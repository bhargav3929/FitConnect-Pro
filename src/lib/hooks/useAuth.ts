import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAuthStore } from '../store/authStore';
import { UserProfile } from '@/types/user';

// Internal subscription hook
export function useAuthSubscription() {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setLoading(false);
                if (unsubscribeFirestore) {
                    unsubscribeFirestore();
                    unsubscribeFirestore = null;
                }
                return;
            }

            const userRef = doc(db, 'users', firebaseUser.uid);
            unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUser(docSnap.data() as UserProfile);
                } else {
                    console.log('User document not found');
                }
                setLoading(false);
            }, (error) => {
                console.error("Firestore error:", error);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, [setUser, setLoading]);
}

// Public hook for components
export function useAuth() {
    const { user, isLoading } = useAuthStore();

    const logOut = () => auth.signOut();

    return { user, isLoading, logOut };
}
