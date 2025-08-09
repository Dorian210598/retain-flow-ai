import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { ClientDashboard } from '@/features/dashboard/ClientDashboard';

const Index = () => {
  const { profile } = useAuth();

  return (
    <ProtectedRoute>
      {profile?.role === 'admin' ? <AdminDashboard /> : <ClientDashboard />}
    </ProtectedRoute>
  );
};

export default Index;
