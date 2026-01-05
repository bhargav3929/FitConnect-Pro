import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { UserProfile } from '@/types/user';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
}

export async function createUserProfile(user: UserProfile): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, user);
}
