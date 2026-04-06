export interface SmsPayload {
  to: string;
  message: string;
}

export interface SmsResult {
  sid: string | null;
}

/**
 * Send an SMS via Twilio.
 * Set TWILIO_ENABLED=true and provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_FROM_NUMBER to activate real sending.
 * When disabled, logs to console (useful for local dev).
 */
export async function sendSms({ to, message }: SmsPayload): Promise<SmsResult> {
  const enabled = process.env.TWILIO_ENABLED === 'true';

  if (!enabled) {
    console.log(`[SMS stub] To: ${to} | Message: ${message}`);
    return { sid: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const msg = await client.messages.create({
    to,
    from: process.env.TWILIO_FROM_NUMBER,
    body: message,
  });
  return { sid: msg.sid };
}
