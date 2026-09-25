import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

// AP-39, AP-20, AP-13: Route protection utilities
export const publicRoutes = ['/', '/pricing', '/demo/question', '/auth/login', '/auth/register', '/auth/reset', '/auth/verify'];
export const guestOnlyRoutes = ['/demo/question'];
export const protectedRoutes = ['/dashboard', '/progress', '/session'];

export function useAuthGuard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const requireAuth = (pathname: string) => {
    if (loading) return;

    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

    if (isProtected && !user) {
      router.push('/auth/login');
      return false;
    }

    if (guestOnlyRoutes.some(route => pathname.startsWith(route)) && user) {
      // Allow logged-in users but in guest session isolation
      return true;
    }

    return true;
  };

  const validateSessionOwnership = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;
    if (sessionId.startsWith('guest-')) return true; // Guest sessions are allowed for demo

    // AP-20: Validate session belongs to user
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/validate`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return { requireAuth, validateSessionOwnership };
}
