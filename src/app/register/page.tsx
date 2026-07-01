import { AuthAccessForm } from '@/components/public/auth-access-form';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Sign Up | ${APP_NAME}`, 'Create a school account for EduClearance.');

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <AuthAccessForm mode="register" />
    </main>
  );
}
