export interface AdminUser {
    username: string;
    role: 'super_admin';
    name: string;
    email: string;
    lastLogin?: Date;
}

// Hardcoded admin credentials for MVP
export const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
} as const;

export const DEFAULT_ADMIN_USER: AdminUser = {
    username: 'admin',
    role: 'super_admin',
    name: 'Super Admin',
    email: 'admin@fitconnect.pro',
};
