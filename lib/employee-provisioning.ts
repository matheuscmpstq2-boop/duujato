import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
export function invitationsConfigured(){return !!(process.env.SUPABASE_SECRET_KEY&&process.env.RESEND_API_KEY&&process.env.EMAIL_FROM&&process.env.NEXT_PUBLIC_SITE_URL)}
export function employeeAuth(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw new Error('Cadastro de funcionários não configurado.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export function temporaryPassword(){return 'Dj!'+randomBytes(18).toString('base64url')+'9a'}
export async function sendEmployeeAccess(email:string,password:string,userId:string){
const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM,site=process.env.NEXT_PUBLIC_SITE_URL;
if(!key||!from||!site)throw new Error('Envio de e-mail não configurado.');
const login=new URL('/admin',site).toString();if(new URL(login).protocol!=='https:')throw new Error('Endereço do painel inválido.');
const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`employee-welcome/${userId}`},body:JSON.stringify({from,to:[email],subject:'Seu acesso de funcionário ao Duu Jato foi liberado',text:`Olá!\n\nO administrador liberou seu acesso de funcionário ao Duu Jato.\n\nPainel: ${login}\nE-mail: ${email}\nSenha inicial: ${password}\n\nEntre no painel e use a opção Trocar senha para definir uma senha pessoal. Seu acesso permite trabalhar com a agenda e o caixa.\n\nEquipe Duu Jato`}),signal:AbortSignal.timeout(15000)});
if(!response.ok)throw new Error('Não foi possível enviar o e-mail. Nenhum acesso foi liberado.');const result=await response.json() as {id?:string};if(!result.id)throw new Error('O envio do e-mail não foi confirmado.');return result.id;
}
