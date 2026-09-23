import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
export type Service={id:string;name:string;description:string;duration:number;price_cents:number|null;active:number;sort:number};
export type Hours={weekday:number;enabled:number;opening:string;closing:string;break_start:string|null;break_end:string|null};
export const DAYS=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export const defaultHours:Hours[]=DAYS.map((_,weekday)=>({weekday,enabled:1,opening:'08:00',closing:'18:00',break_start:null,break_end:null}));
export function db(){if(!env.DB)throw new Error('DB indisponível');return env.DB}
export function minutes(s:string){const [h,m]=s.split(':').map(Number);return h*60+m}
export function clock(n:number){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
export function slotsFor(time:string,duration:number){const start=minutes(time);return Array.from({length:duration/30},(_,i)=>clock(start+i*30))}
export function validClock(s:string){return /^([01]\d|2[0-3]):(00|30)$/.test(s)}
export function localNow(){const current=new Date();return {today:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(current),time:new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(current)}}
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00Z`);if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==s)return false;const now=localNow().today;const days=(Date.parse(s+'T12:00:00Z')-Date.parse(now+'T12:00:00Z'))/86400000;return days>=0&&days<=90}
export async function hoursOn(date:string){const weekday=new Date(`${date}T12:00:00Z`).getUTCDay();return await db().prepare('SELECT weekday,enabled,opening,closing,break_start,break_end FROM weekly_hours WHERE weekday=?').bind(weekday).first<Hours>()??defaultHours[weekday]}
export async function available(date:string,duration:number){const [hours,closed,occupied]=await Promise.all([hoursOn(date),db().prepare('SELECT date FROM closed_dates WHERE date=?').bind(date).first(),db().prepare('SELECT time FROM occupied_slots WHERE date=?').bind(date).all<{time:string}>()]);if(!hours.enabled||closed)return [];const taken=new Set(occupied.results.map(x=>x.time));const open=minutes(hours.opening),close=minutes(hours.closing),breakStart=hours.break_start?minutes(hours.break_start):null,breakEnd=hours.break_end?minutes(hours.break_end):null;const {today,time:now}=localNow();const output:string[]=[];for(let start=open;start+duration<=close;start+=30){const end=start+duration,t=clock(start);if(date===today&&t<=now)continue;if(breakStart!==null&&breakEnd!==null&&start<breakEnd&&end>breakStart)continue;if(slotsFor(t,duration).some(slot=>taken.has(slot)))continue;output.push(t)}return output}
export async function owner(){const h=await headers();const email=h.get('oai-authenticated-user-email');const configured=(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;return !!email&&!!configured&&email.toLowerCase()===configured.toLowerCase()}
export async function admin(){const h=await headers();const email=h.get('oai-authenticated-user-email');if(!email)return false;if(await owner())return true;try{return !!await db().prepare('SELECT email FROM admin_accounts WHERE email=?').bind(email.toLowerCase()).first()}catch{return false}}
export const fail=(message:string,status=400)=>Response.json({error:message},{status});
