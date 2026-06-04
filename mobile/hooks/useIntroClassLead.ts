import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@fitconnect/shared/firebase/config';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';

/**
 * Returns whether the current authenticated client has already submitted an
 * intro-class lead. `null` means unknown / still loading (or no user yet).
 */
export function useIntroClassLead(): {
    hasIntroClassLead: boolean | null;
    refresh: () => void;
} {
    const { clientUser } = useClientAuthStore();
    const userId = clientUser?.id ?? null;
    const [hasIntroClassLead, setHas] = useState<boolean | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        if (!userId) {
            setHas(null);
            return;
        }
        setHas(null);
        (async () => {
            try {
                const q = query(
                    collection(db, 'introClassLeads'),
                    where('userId', '==', userId),
                    limit(1),
                );
                const snap = await getDocs(q);
                if (!cancelled) setHas(!snap.empty);
            } catch (err) {
                console.error('useIntroClassLead query failed', err);
                if (!cancelled) setHas(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, tick]);

    return { hasIntroClassLead, refresh: () => setTick((t) => t + 1) };
}
