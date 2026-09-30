import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import nodemailer from 'nodemailer';
import {OWNER_EMAIL} from './access';
export function invitationsConfigured(){return !!(process.env.SUPABASE_SECRET_KEY&&process.env.GMAIL_APP_PASSWORD)}
export function employeeAuth(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw new Error('Cadastro de funcionários não configurado.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export function temporaryPassword(){return 'Dj!'+randomBytes(18).toString('base64url')+'9a'}
export async function sendEmployeeAccess(email:string,password:string,userId:string){
const appPassword=process.env.GMAIL_APP_PASSWORD?.replace(/\s/g,'');
if(!appPassword)throw new Error('Envio de e-mail não configurado.');
const login=new URL('/admin',process.env.NEXT_PUBLIC_SITE_URL||'https://duujato.vercel.app').toString();if(new URL(login).protocol!=='https:')throw new Error('Endereço do painel inválido.');
const smtp=nodemailer.createTransport({service:'gmail',auth:{user:OWNER_EMAIL,pass:appPassword},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:15000});
try{const result=await smtp.sendMail({from:{name:'Duu Jato',address:OWNER_EMAIL},to:email,messageId:`<employee-${userId}@duujato.vercel.app>`,subject:'Seu acesso de funcionário ao Duu Jato foi liberado',text:`Olá!\n\nO administrador liberou seu acesso de funcionário ao Duu Jato.\n\nPainel: ${login}\nE-mail: ${email}\nSenha inicial: ${password}\n\nEntre no painel e use a opção Trocar senha para definir uma senha pessoal. Seu acesso permite trabalhar com a agenda e o caixa.\n\nEquipe Duu Jato`});if(!result.accepted?.includes(email))throw new Error('O envio não foi aceito pelo Gmail.');return result.messageId}finally{smtp.close()}
}
