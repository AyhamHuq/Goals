import { sendSms } from '../smsService';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

afterAll(() => consoleSpy.mockRestore());

describe('sendSms — stub mode (TWILIO_ENABLED=false)', () => {
  beforeEach(() => {
    delete process.env.TWILIO_ENABLED;
  });

  it('logs to console and returns null sid', async () => {
    const result = await sendSms({ to: '+15551234567', message: 'Hello!' });
    expect(result.sid).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('+15551234567'),
    );
  });

  it('does not throw', async () => {
    await expect(sendSms({ to: '+15551234567', message: 'Test' })).resolves.not.toThrow();
  });
});

describe('sendSms — real mode (TWILIO_ENABLED=true)', () => {
  const mockCreate = jest.fn();
  const mockMessages = { create: mockCreate };
  const mockClient = { messages: mockMessages };

  beforeEach(() => {
    process.env.TWILIO_ENABLED = 'true';
    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM_NUMBER = '+15550000000';
    jest.resetModules();
    jest.mock('twilio', () => () => mockClient);
    mockCreate.mockReset();
  });

  afterEach(() => {
    delete process.env.TWILIO_ENABLED;
    jest.unmock('twilio');
  });

  it('calls twilio messages.create with correct params and returns sid', async () => {
    mockCreate.mockResolvedValueOnce({ sid: 'SM123' });
    // Re-import after mocking twilio
    const { sendSms: sendSmsFresh } = await import('../smsService');
    const result = await sendSmsFresh({ to: '+15551234567', message: 'Hey!' });
    expect(mockCreate).toHaveBeenCalledWith({
      to: '+15551234567',
      from: '+15550000000',
      body: 'Hey!',
    });
    expect(result.sid).toBe('SM123');
  });

  it('throws a descriptive error when Twilio API fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Invalid phone number'));
    const { sendSms: sendSmsFresh } = await import('../smsService');
    await expect(sendSmsFresh({ to: '+bad', message: 'Hey!' })).rejects.toThrow('Invalid phone number');
  });
});
