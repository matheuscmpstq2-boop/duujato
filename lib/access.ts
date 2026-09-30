export const OWNER_EMAIL = 'luanvictorlcst12@gmail.com';
export function normalizeEmail(value: unknown){return typeof value==='string'?value.trim().toLowerCase():''}
export function isOwnerEmail(email: unknown){return normalizeEmail(email)===OWNER_EMAIL}
export function validEmail(email:string){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
