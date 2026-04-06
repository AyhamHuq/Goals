import { sendDailyReminders } from '../reminderService';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../smsService', () => ({
  sendSms: jest.fn().mockResolvedValue({ sid: 'SM_test' }),
}));

jest.mock('../streakService', () => ({
  getUserStreak: jest.fn().mockResolvedValue(0),
}));

import { pool } from '../../db/pool';
import { sendSms } from '../smsService';
import { getUserStreak } from '../streakService';

const mockQuery = pool.query as jest.Mock;
const mockSendSms = sendSms as jest.Mock;
const mockGetStreak = getUserStreak as jest.Mock;

const TODAY = new Date('2026-04-10T00:00:00Z');
const TODAY_STR = '2026-04-10';

const USER = {
  id: 'user-1',
  display_name: 'Alice',
  phone: '+15551234567',
  reminder_hour: 20,
};

beforeEach(() => {
  mockQuery.mockReset();
  mockSendSms.mockReset();
  mockSendSms.mockResolvedValue({ sid: 'SM_test' });
  mockGetStreak.mockReset();
  mockGetStreak.mockResolvedValue(0);
});

describe('sendDailyReminders', () => {
  it('does not query users with wrong hour', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // users query returns nobody
    await sendDailyReminders(19, TODAY); // hour 19, user wants 20
    expect(mockSendSms).not.toHaveBeenCalled();
  });

  it('skips users who already marked today as done', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] }) // eligible users
      .mockResolvedValueOnce({ rows: [{ id: 'comp-1' }] }) // already marked done today
    ;
    await sendDailyReminders(20, TODAY);
    expect(mockSendSms).not.toHaveBeenCalled();
  });

  it('skips users with a notification already sent today', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] }) // eligible users
      .mockResolvedValueOnce({ rows: [] }) // no progress today
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] }); // already notified
    await sendDailyReminders(20, TODAY);
    expect(mockSendSms).not.toHaveBeenCalled();
  });

  it('sends reminder with streak info when user has active streak', async () => {
    mockGetStreak.mockResolvedValue(5);
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] }) // eligible users
      .mockResolvedValueOnce({ rows: [] }) // no progress today
      .mockResolvedValueOnce({ rows: [] }) // no prior notification
      .mockResolvedValueOnce({ rows: [{ id: 'notif-new' }] }); // insert notification_log

    await sendDailyReminders(20, TODAY);

    expect(mockSendSms).toHaveBeenCalledTimes(1);
    const callArgs = mockSendSms.mock.calls[0][0];
    expect(callArgs.to).toBe('+15551234567');
    expect(callArgs.message).toContain('5-day streak');
    expect(callArgs.message).toContain('Alice');
    expect(callArgs.message).toContain('mark done');
  });

  it('sends generic reminder when user has no streak', async () => {
    mockGetStreak.mockResolvedValue(0);
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await sendDailyReminders(20, TODAY);

    expect(mockSendSms).toHaveBeenCalledTimes(1);
    const callArgs = mockSendSms.mock.calls[0][0];
    expect(callArgs.message).toContain('Alice');
    expect(callArgs.message).not.toContain('streak');
  });

  it('records sent notification in notification_log', async () => {
    mockGetStreak.mockResolvedValue(3);
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await sendDailyReminders(20, TODAY);

    // The 4th query should be the INSERT into notification_log
    const insertCall = mockQuery.mock.calls[3];
    expect(insertCall[0]).toMatch(/INSERT INTO notification_log/i);
    expect(insertCall[1]).toContain(USER.id);
    expect(insertCall[1]).toContain(TODAY_STR);
  });

  it('handles Twilio errors gracefully and continues to next user', async () => {
    const USER2 = { ...USER, id: 'user-2', display_name: 'Bob', phone: '+15559876543' };
    mockSendSms
      .mockRejectedValueOnce(new Error('Twilio error'))
      .mockResolvedValueOnce({ sid: 'SM_ok' });

    mockQuery
      .mockResolvedValueOnce({ rows: [USER, USER2] }) // 2 users
      // User 1: no progress, no prior notification
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      // User 2: no progress, no prior notification
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // User 2 insert

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await sendDailyReminders(20, TODAY);
    consoleSpy.mockRestore();

    // Both attempted, second should succeed
    expect(mockSendSms).toHaveBeenCalledTimes(2);
  });

  it('keeps messages under 135 chars (leaves room for Twilio trial prefix)', async () => {
    mockGetStreak.mockResolvedValue(42);
    mockQuery
      .mockResolvedValueOnce({ rows: [USER] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await sendDailyReminders(20, TODAY);

    const callArgs = mockSendSms.mock.calls[0][0];
    expect(callArgs.message.length).toBeLessThanOrEqual(135);
  });
});
