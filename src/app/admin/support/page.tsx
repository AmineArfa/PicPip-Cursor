import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/admin';
import { AdminSupportContent } from './admin-support-content';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const { isAdmin } = await checkAdminAccess();

  if (!isAdmin) {
    redirect('/');
  }

  return <AdminSupportContent />;
}

