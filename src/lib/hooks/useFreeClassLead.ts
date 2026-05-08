'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@fitconnect/shared/firebase/config';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';

/**
 * Returns whether the current authenticated client has already submitted a
 * free-class lead. `null` means unknown / still loading (or no user yet).
 */
export function useFreeClassLead(): {
    hasFreeClassLead: boolean | null;
    refresh: () => void;
} {
    const { clientUser } = useClientAuthStore();
    const userId = clientUser?.id ?? null;
    const [hasFreeClassLead, setHas] = useState<boolean | null>(null);
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
                    collection(db, 'freeClassLeads'),
                    where('userId', '==', userId),
                    limit(1),
                );
                const snap = await getDocs(q);
                if (!cancelled) setHas(!snap.empty);
            } catch (err) {
                console.error('useFreeClassLead query failed', err);
                if (!cancelled) setHas(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, tick]);

    return { hasFreeClassLead, refresh: () => setTick((t) => t + 1) };
}
