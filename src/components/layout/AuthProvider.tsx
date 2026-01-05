'use client';

import { useAuthSubscription } from '@/lib/hooks/useAuth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    useAuthSubscription();
    return <>{children}</>;
}
