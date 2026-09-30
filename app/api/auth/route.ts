import {createServerClient} from '@supabase/ssr';
import {NextRequest,NextResponse} from 'next/server';
import {authorizedEmail} from '@/lib/booking';
import {normalizeEmail,validEmail} from '@/lib/access';
function client(request:NextRequest,response:NextResponse){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Autenticação não configurada');return createServerClient(url,key,{cookies:{getAll(){return request.cookies.getAll()},setAll(items){items.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}})}
export async function POST(request:NextRequest){let body:{email?:string;password?:string;action?:string};try{body=await request.json()}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400})}
if(body.action!=='signin')return NextResponse.json({error:'O cadastro de funcionários é feito exclusivamente pelo administrador.'},{status:403});
const email=normalizeEmail(body.email);if(!validEmail(email)||typeof body.password!=='string'||!body.password||body.password.length>200)return NextResponse.json({error:'Informe e-mail e senha.'},{status:400});
const response=NextResponse.json({ok:true});try{const supabase=client(request,response),result=await supabase.auth.signInWithPassword({email,password:body.password});if(result.error)return NextResponse.json({error:'E-mail ou senha inválidos. Confira também a confirmação do e-mail.'},{status:401});
if(!await authorizedEmail(result.data.user?.email)){await supabase.auth.signOut();const denied=NextResponse.json({error:'Esta conta não tem acesso. Peça ao administrador para cadastrar seu e-mail.'},{status:403});response.cookies.getAll().forEach(cookie=>denied.cookies.set(cookie));return denied}return response}catch{return NextResponse.json({error:'Não foi possível entrar agora.'},{status:503})}}
export async function DELETE(request:NextRequest){const response=NextResponse.json({ok:true});try{await client(request,response).auth.signOut();return response}catch{return NextResponse.json({error:'Não foi possível sair.'},{status:503})}}
