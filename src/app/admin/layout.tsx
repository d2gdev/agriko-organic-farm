import AdminFooter from '@/components/AdminFooter';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout admin-page min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <AdminFooter />
    </div>
  );
}