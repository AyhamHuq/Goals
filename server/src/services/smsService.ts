import dotenv from 'dotenv';
dotenv.config();

interface SmsPayload {
  to: string;
  message: string;
}

/**
 * Send an SMS via Twilio. In MVP this is a stub — set TWILIO_ENABLED=true
 * and provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 * to activate real sending in V2.
 */
export async function sendSms({ to, message }: SmsPayload): Promise<void> {
  const enabled = process.env.TWILIO_ENABLED === 'true';

  if (!enabled) {
    console.log(`[SMS stub] To: ${to} | Message: ${message}`);
    return;
  }

  // V2: real Twilio integration
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body: message });
  throw new Error('Twilio real sending not yet implemented — set TWILIO_ENABLED=false for MVP');
}
