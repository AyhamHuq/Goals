export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgres://goals:goals@localhost:5432/goals',
  nodeEnv: process.env.NODE_ENV || 'development',
  sandbox: process.env.SANDBOX === 'true',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidEmail: process.env.VAPID_EMAIL || 'mailto:admin@example.com',
  adminPin: process.env.ADMIN_PIN || '',
  adminUserId: process.env.ADMIN_USER_ID || '',
};
