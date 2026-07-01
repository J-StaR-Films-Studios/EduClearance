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
  return serverEnvSchema.parse(process.env);
}

export function hasPaystackTestKeys(env: Pick<ServerEnv, 'PAYSTACK_SECRET_KEY' | 'PAYSTACK_PUBLIC_KEY'>) {
  return Boolean(env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') || env.PAYSTACK_PUBLIC_KEY?.startsWith('pk_test_'));
}

export function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production';
}
