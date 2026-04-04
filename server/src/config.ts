export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgres://goals:goals@localhost:5432/goals',
  nodeEnv: process.env.NODE_ENV || 'development',
  sandbox: process.env.SANDBOX === 'true',
};
