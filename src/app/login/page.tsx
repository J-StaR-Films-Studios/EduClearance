import { AuthAccessForm } from '@/components/public/auth-access-form';
import { buildLocalAccessHref, type SessionRole } from '@/lib/local-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Sign In | ${APP_NAME}`, 'Sign in to your EduClearance account.');

type LoginPageProps = {
  searchParams: Promise<{ role?: string; redirect?: string }>;
};

function resolveRequestedRole(role?: string): SessionRole {
  if (role === 'admin') {
    return 'platform_admin';
  }

  if (role === 'school_owner' || role === 'school_staff') {
    return role;
  }

  return 'school_admin';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { role, redirect } = await searchParams;
  const requestedRole = resolveRequestedRole(role);
  const isAdmin = requestedRole === 'platform_admin';
  const defaultRedirect = isAdmin ? '/admin' : '/dashboard';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthAccessForm
        mode="login"
        audience={isAdmin ? 'admin' : 'school'}
        destination={buildLocalAccessHref(requestedRole, redirect ?? defaultRedirect)}
      />
    </main>
  );
}
