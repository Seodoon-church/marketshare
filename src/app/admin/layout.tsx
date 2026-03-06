import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const metadata = {
  title: '플랫폼 관리자',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar role="platform_admin" />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-6">
          <h2 className="text-lg font-semibold text-gray-900">플랫폼 관리</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">관리자님</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">A</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
