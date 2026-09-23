import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
export type Service = { id:string; name:string; description:string; duration:number; price_cents:number|null; active:number; sort:number };
export function db(){ if(!env.DB) throw new Error('DB indisponível'); return env.DB; }
export function slotsFor(time:string,duration:number){const [h,m]=time.split(':').map(Number);const start=h*60+m;return Array.from({length:duration/30},(_,i)=>{const n=start+i*30;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`})}
export function times(){return Array.from({length:18},(_,i)=>{const n=8*60+i*30;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`})}
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00-03:00`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s&&d.valueOf()>=Date.now()-86400000&&d.valueOf()<Date.now()+90*86400000}
export async function admin(){const h=await headers();const email=h.get('oai-authenticated-user-email');return !!email && !!(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL && email.toLowerCase()===String((env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL).toLowerCase()}
export const fail=(message:string,status=400)=>Response.json({error:message},{status});
