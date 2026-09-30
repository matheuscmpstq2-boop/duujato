import {admin,fail} from '@/lib/booking';
import {authClient} from '@/lib/auth';
export async function POST(request:Request){if(!await admin())return fail('Acesso restrito.',403);let password:unknown;try{password=((await request.json()) as {password?:unknown}).password}catch{return fail('Dados inválidos.')}
if(typeof password!=='string'||password.length<12||password.length>128)return fail('Use uma senha entre 12 e 128 caracteres.');
try{const {error}=await (await authClient()).auth.updateUser({password});if(error)return fail('Não foi possível trocar a senha. Entre novamente e tente outra vez.',400);return Response.json({ok:true})}catch{return fail('Não foi possível trocar a senha.',503)}}
