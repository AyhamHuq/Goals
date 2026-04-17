import { sendDailyReminders } from '../reminderService';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../pushService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

jest.mock('../streakService', () => ({
  getUserStreak: jest.fn().mockResolvedValue(0),
}));

import { pool } from '../../db/pool';
import { sendPushNotification } from '../pushService';
import { getUserStreak } from '../streakService';

const mockQuery = pool.query as jest.Mock;
const mockSendPush = sendPushNotification as jest.Mock;
const mockGetStreak = getUserStreak as jest.Mock;

const TODAY = new Date(2026, 3, 10); // Apr 10 local time
const TODAY_STR = '2026-04-10';

const USER = { id: 'user-1', display_name: 'Alice' };

// Helper: mock a full successful send (users query + not completed + not sent + insert)
function mockFullSend(users = [USER]) {
  mockQuery
    .mockResolvedValueOnce({ rows: users })      // eligible users
    .mockResolvedValueOnce({ rows: [] })          // not completed
    .mockResolvedValueOnce({ rows: [] })          // not sent yet
    .mockResolvedValueOnce({ rows: [] });         // insert
}

beforeEach(() => {
  mockQuery.mockReset();
  mockSendPush.mockReset();
  mockSendPush.mockResolvedValue({ sent: 1, failed: 0 });
  mockGetStreak.mockReset();
  mockGetStreak.mockResolvedValue(0);
});

describe('sendDailyReminders — window routing', () => {
  it('sends at hour 15 (afternoon window)', async () => {
    mockFullSend();
    await sendDailyReminders(15, TODAY);
    expect(mockSendPush).toHaveBeenCalledTimes(1);
  });

  it('sends at hour 20 (evening window)', async () => {
    mockFullSend();
    await sendDailyReminders(20, TODAY);
    expect(mockSendPush).toHaveBeenCalledTimes(1);
  });

  it('sends at hour 22 (final window)', async () => {
    mockFullSend();
    await sendDailyReminders(22, TODAY);
    expect(mockSendPush).toHaveBeenCalledTimes(1);
  });

  it('sends nothing at a non-window hour and makes no DB calls', async () => {
    await sendDailyReminders(14, TODAY);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it('sends nothing at hour 16 (non-window)', async () => {
    await sendDailyReminders(16, TODAY);
    expect(mockSendPush).not.toHaveBeenCalled();
  });
});

describe('sendDailyReminders — skip conditions', () => {
  it('skips users who already completed the day', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] })
      .mockResolvedValueOnce({ rows: [{ id: 'comp-1' }] }); // already done

    await sendDailyReminders(15, TODAY);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it('skips if this window already sent today', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] })
      .mockResolvedValueOnce({ rows: [] })                  // not completed
      .mockResolvedValueOnce({ rows: [{ id: 'log-1' }] }); // already sent

    await sendDailyReminders(15, TODAY);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it('sends nothing when no users have reminders enabled', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await sendDailyReminders(15, TODAY);
    expect(mockSendPush).not.toHaveBeenCalled();
  });
});

describe('sendDailyReminders — notification_type per window', () => {
  it('uses push_afternoon at hour 15', async () => {
    mockFullSend();
    await sendDailyReminders(15, TODAY);
    const notifCheckCall = mockQuery.mock.calls[2];
    expect(notifCheckCall[1]).toContain('push_afternoon');
  });

  it('uses push_evening at hour 20', async () => {
    mockFullSend();
    await sendDailyReminders(20, TODAY);
    const notifCheckCall = mockQuery.mock.calls[2];
    expect(notifCheckCall[1]).toContain('push_evening');
  });

  it('uses push_final at hour 22', async () => {
    mockFullSend();
    await sendDailyReminders(22, TODAY);
    const notifCheckCall = mockQuery.mock.calls[2];
    expect(notifCheckCall[1]).toContain('push_final');
  });
});

describe('sendDailyReminders — message copy', () => {
  it('afternoon with streak mentions the streak count and name', async () => {
    mockGetStreak.mockResolvedValue(7);
    mockFullSend();
    await sendDailyReminders(15, TODAY);
    const [, , body] = mockSendPush.mock.calls[0];
    expect(body).toContain('Alice');
    expect(body).toContain('7');
  });

  it('afternoon without streak mentions logging goals', async () => {
    mockGetStreak.mockResolvedValue(0);
    mockFullSend();
    await sendDailyReminders(15, TODAY);
    const [, , body] = mockSendPush.mock.calls[0];
    expect(body).toContain('Alice');
    expect(body).toMatch(/log|goal/i);
  });

  it('evening with streak mentions streak', async () => {
    mockGetStreak.mockResolvedValue(3);
    mockFullSend();
    await sendDailyReminders(20, TODAY);
    const [, , body] = mockSendPush.mock.calls[0];
    expect(body).toContain('3');
    expect(body).toContain('Alice');
  });

  it('evening without streak mentions logging progress', async () => {
    mockGetStreak.mockResolvedValue(0);
    mockFullSend();
    await sendDailyReminders(20, TODAY);
    const [, , body] = mockSendPush.mock.calls[0];
    expect(body).toContain('Alice');
    expect(body).toMatch(/log/i);
  });

  it('final window title says Last chance', async () => {
    mockFullSend();
    await sendDailyReminders(22, TODAY);
    const [, title] = mockSendPush.mock.calls[0];
    expect(title).toContain('Last chance');
  });

  it('final window with streak body mentions keeping the streak', async () => {
    mockGetStreak.mockResolvedValue(5);
    mockFullSend();
    await sendDailyReminders(22, TODAY);
    const [, , body] = mockSendPush.mock.calls[0];
    expect(body).toContain('5');
    expect(body).toContain('Alice');
  });

  it('final window without streak body mentions midnight', async () => {
    mockGetStreak.mockResolvedValue(0);
    mockFullSend();
    await sendDailyReminders(22, TODAY);
    const [, , body] = mockSendPush.mock.calls[0];
    expect(body).toContain('Alice');
    expect(body).toMatch(/midnight/i);
  });
});

describe('sendDailyReminders — notification_log recording', () => {
  it('inserts into notification_log with correct user, type, and date', async () => {
    mockFullSend();
    await sendDailyReminders(15, TODAY);
    const insertCall = mockQuery.mock.calls[3];
    expect(insertCall[0]).toMatch(/INSERT INTO notification_log/i);
    expect(insertCall[1]).toContain(USER.id);
    expect(insertCall[1]).toContain(TODAY_STR);
    expect(insertCall[1]).toContain('push_afternoon');
  });
});

describe('sendDailyReminders — uses local date, not UTC', () => {
  it('queries daily_completions with the local date string from the Date object', async () => {
    // Create a date where getDate() returns local day — the function should use
    // getFullYear/getMonth/getDate (local) not toISOString (UTC).
    const localDate = new Date(2026, 3, 17, 22, 0, 0); // Apr 17, 10pm local
    const expectedStr = '2026-04-17';

    mockFullSend();
    await sendDailyReminders(22, localDate);

    // The completion check (2nd query) should use the local date
    const completionCheckCall = mockQuery.mock.calls[1];
    expect(completionCheckCall[1]).toContain(expectedStr);

    // The notification_log check (3rd query) should also use local date
    const notifCheckCall = mockQuery.mock.calls[2];
    expect(notifCheckCall[1]).toContain(expectedStr);
  });
});

describe('sendDailyReminders — error handling', () => {
  it('continues to second user if first push fails', async () => {
    const USER2 = { id: 'user-2', display_name: 'Bob' };
    mockSendPush
      .mockRejectedValueOnce(new Error('Push error'))
      .mockResolvedValueOnce({ sent: 1, failed: 0 });

    mockQuery
      .mockResolvedValueOnce({ rows: [USER, USER2] }) // 2 users
      .mockResolvedValueOnce({ rows: [] })             // user1: not completed
      .mockResolvedValueOnce({ rows: [] })             // user1: not sent
      // user1 push throws — no insert call
      .mockResolvedValueOnce({ rows: [] })             // user2: not completed
      .mockResolvedValueOnce({ rows: [] })             // user2: not sent
      .mockResolvedValueOnce({ rows: [] });             // user2: insert

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await sendDailyReminders(15, TODAY);
    consoleSpy.mockRestore();

    expect(mockSendPush).toHaveBeenCalledTimes(2);
  });
});
