import { AuthDemoForm } from '@/components/public/auth-demo-form';
import { buildDemoLoginHref, type DemoSessionRole } from '@/lib/demo-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Sign In | ${APP_NAME}`, 'Sign in to your EduClearance account.');

type LoginPageProps = {
  searchParams: Promise<{ role?: string; redirect?: string }>;
};

function resolveRequestedRole(role?: string): DemoSessionRole {
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
      <AuthDemoForm
        mode="login"
        audience={isAdmin ? 'admin' : 'school'}
        destination={buildDemoLoginHref(requestedRole, redirect ?? defaultRedirect)}
      />
    </main>
  );
}
