import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-in-production-refresh',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),   // 15 min
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10), // 30 days
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'local',
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME,
    },
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.EMAIL_FROM ?? 'noreply@school.com',
  },

  sms: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
  },
}));
