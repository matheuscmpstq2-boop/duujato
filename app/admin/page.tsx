import {admin,owner} from '@/lib/booking';
import {getAccountUser} from '@/lib/auth';
import Login from './login';
import {BOOKING_URL} from '@/lib/site';
import AdminPanel from './panel';
export const dynamic='force-dynamic';
export default async function Admin(){const [allowed,user,canManageAccess]=await Promise.all([admin(),getAccountUser(),owner()]);return <><header className="top shell"><a className="brand brand-with-logo" href={BOOKING_URL}><img src="/duujato-logo.webp" alt="" width="56" height="38"/>DUU<span>JATO</span></a><a href={BOOKING_URL}>Página de agendamento</a></header><main className="shell admin">{allowed?<AdminPanel email={user?.email||''} canManageAccess={canManageAccess}/>:<Login/>}</main></>}
