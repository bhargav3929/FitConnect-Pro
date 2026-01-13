export interface ClientUser {
    id: string;
    username: string; // for hardcoded login
    name: string;
    email: string;
    avatar?: string;
    membership: {
        type: 'Free' | 'Pro' | 'Elite';
        status: 'active' | 'expired';
        expiresAt: string;
    };
    stats: {
        classesAttended: number;
        streak: number;
        points: number;
    }
}

export const CLIENT_CREDENTIALS = {
    username: 'client',
    password: 'client123'
}

export const MOCK_CLIENT: ClientUser = {
    id: 'client-1',
    username: 'client',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    membership: {
        type: 'Pro',
        status: 'active',
        expiresAt: '2024-12-31'
    },
    stats: {
        classesAttended: 12,
        streak: 3,
        points: 450
    }
}
