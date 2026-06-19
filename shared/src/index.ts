// @fitconnect/shared — barrel exports
export * from './types';
export * from './constants/schedule';
export { auth, db, storage, functions } from './firebase/config';
export { initApiConfig, getApiBaseUrl } from './firebase/api-config';
export * from './firebase/firestore';
export * from './payments/mock-processor';
export { useClientAuthStore } from './stores/clientAuthStore';
export { useAdminAuthStore } from './stores/adminAuthStore';
export { useUIStore } from './stores/uiStore';
