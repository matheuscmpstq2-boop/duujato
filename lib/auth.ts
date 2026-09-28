import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';

export async function authClient(){
  const store=await cookies();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Autenticação não configurada');
  return createServerClient(url,key,{cookies:{getAll(){return store.getAll()},setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Server Components não podem alterar cookies; proxy atualiza a sessão. */}}}});
}
export async function getAccountUser(){try{const {data,error}=await (await authClient()).auth.getUser();return error?null:data.user}catch{return null}}
