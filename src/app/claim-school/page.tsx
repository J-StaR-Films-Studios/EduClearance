import { ClaimSchoolFlow } from '@/components/public/claim-school-flow';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Claim / Register School | ${APP_NAME}`, 'Claim or request access to a seeded school profile.');

export default function ClaimSchoolPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-navy-800">
      <ClaimSchoolFlow />
    </main>
  );
}
