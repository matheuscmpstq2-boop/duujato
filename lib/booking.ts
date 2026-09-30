import {db} from './database';
import {getAccountUser} from './auth';
import {isOwnerEmail,normalizeEmail} from './access';
export type Service={id:string;name:string;description:string;duration:number;price_cents:number|null;active:number;sort:number};
export type Hours={weekday:number;enabled:number;opening:string;closing:string;break_start:string|null;break_end:string|null};
export const DAYS=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export const defaultHours:Hours[]=DAYS.map((_,weekday)=>({weekday,enabled:1,opening:'08:00',closing:'18:00',break_start:null,break_end:null}));
export {db};
export function minutes(s:string){const [h,m]=s.split(':').map(Number);return h*60+m}
export function clock(n:number){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
export function slotsFor(time:string,duration:number){const start=minutes(time);return Array.from({length:duration/30},(_,i)=>clock(start+i*30))}
export function validClock(s:string){return /^([01]\d|2[0-3]):(00|30)$/.test(s)}
export function localNow(){const current=new Date();return {today:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(current),time:new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(current)}}
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00Z`);if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==s)return false;const now=localNow().today;const days=(Date.parse(s+'T12:00:00Z')-Date.parse(now+'T12:00:00Z'))/86400000;return days>=0&&days<=90}
export async function hoursOn(date:string){const weekday=new Date(`${date}T12:00:00Z`).getUTCDay();return await db().prepare('SELECT weekday,enabled,opening,closing,break_start,break_end FROM weekly_hours WHERE weekday=?').bind(weekday).first<Hours>()??defaultHours[weekday]}
export async function capacity(){const row=await db().prepare('SELECT capacity FROM business_settings WHERE id=1').first<{capacity:number}>();return Math.max(1,Math.min(10,row?.capacity||1))}
export async function freeBay(date:string,time:string,duration:number,excludeBooking?:string){const slots=slotsFor(time,duration);const [limit,result]=await Promise.all([capacity(),db().prepare('SELECT time,bay FROM occupied_slots WHERE date=? AND booking_id!=?').bind(date,excludeBooking||'').all<{time:string;bay:number}>()]);const occupied=new Set(result.results.map(x=>`${x.time}:${x.bay}`));for(let bay=1;bay<=limit;bay++)if(slots.every(slot=>!occupied.has(`${slot}:${bay}`)))return bay;return null}
export async function available(date:string,duration:number,excludeBooking=''){const [hours,closed,occupied,limit]=await Promise.all([hoursOn(date),db().prepare('SELECT date FROM closed_dates WHERE date=?').bind(date).first(),db().prepare('SELECT time,bay FROM occupied_slots WHERE date=? AND booking_id!=?').bind(date,excludeBooking).all<{time:string;bay:number}>(),capacity()]);if(!hours.enabled||closed)return [];const taken=new Set(occupied.results.map(x=>`${x.time}:${x.bay}`));const open=minutes(hours.opening),close=minutes(hours.closing),breakStart=hours.break_start?minutes(hours.break_start):null,breakEnd=hours.break_end?minutes(hours.break_end):null;const {today,time:now}=localNow();const output:string[]=[];for(let start=open;start+duration<=close;start+=30){const end=start+duration,t=clock(start);if(date===today&&t<=now)continue;if(breakStart!==null&&breakEnd!==null&&start<breakEnd&&end>breakStart)continue;const slots=slotsFor(t,duration);let free=false;for(let bay=1;bay<=limit;bay++)if(slots.every(slot=>!taken.has(`${slot}:${bay}`))){free=true;break}if(free)output.push(t)}return output}
export async function tokenHash(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
export async function owner(){return isOwnerEmail((await getAccountUser())?.email)}
export async function authorizedEmail(value:unknown){const email=normalizeEmail(value);if(!email)return false;if(isOwnerEmail(email))return true;try{return !!await db().prepare('SELECT email FROM admin_accounts WHERE email=?').bind(email).first()}catch{return false}}
export async function admin(){return authorizedEmail((await getAccountUser())?.email)}
export const fail=(message:string,status=400)=>Response.json({error:message},{status});
