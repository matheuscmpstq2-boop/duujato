import {db,fail} from '@/lib/booking';
export async function GET(){try{return Response.json(await db().prepare('SELECT name,phone,address,notice FROM business_settings WHERE id=1').first()??{name:'Duu Jato',phone:'',address:'',notice:''})}catch{return fail('Não foi possível carregar as informações.',503)}}
