import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <div className="dashboard">
      <Sidebar name={session.user.name ?? 'User'} role={session.user.role} />
      <main className="main">{children}</main>
    </div>
  );
}
