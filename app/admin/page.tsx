import { admin } from '@/lib/booking';
import AdminPanel from './panel';
export const dynamic='force-dynamic';
export default async function Admin(){const allowed=await admin();return <><header className="top shell"><a className="brand" href="/">DUU<span>JATO</span></a><a href="/">Agendamento</a></header><main className="shell admin">{allowed?<AdminPanel/>:<div className="card"><h1>Área restrita</h1><p className="muted">Entre com a conta autorizada para acompanhar os agendamentos.</p><a className="cta" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 20px',width:'auto'}} href="/signin-with-chatgpt?return_to=%2Fadmin">Entrar com ChatGPT</a></div>}</main></>}
