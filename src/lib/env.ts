import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const env = serverEnvSchema.parse(process.env);
  const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);

  if (process.env.VERCEL_ENV === 'production') {
    if (appUrl.protocol !== 'https:' || appUrl.hostname === 'localhost') {
      throw new Error('NEXT_PUBLIC_APP_URL must be a production HTTPS URL.');
    }

    if (env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') || env.PAYSTACK_PUBLIC_KEY?.startsWith('pk_test_')) {
      throw new Error('Paystack test keys cannot be used in Vercel production.');
    }
  }

  return env;
}
