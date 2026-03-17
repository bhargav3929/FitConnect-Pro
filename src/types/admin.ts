export interface AdminUser {
    uid: string;
    role: 'super_admin' | 'admin';
    name: string;
    email: string;
    lastLogin?: Date;
}
