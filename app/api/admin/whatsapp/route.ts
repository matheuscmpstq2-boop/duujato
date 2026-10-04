import {owner,db,fail} from '@/lib/booking';
import {dispatchWhatsapp,whatsappConfiguration} from '@/lib/whatsapp';
export const maxDuration=30;
export async function GET(){
  if(!await owner())return fail('Acesso restrito.',403);
  try{const config=whatsappConfiguration();const entries=await db().prepare('SELECT n.booking_id,n.status,n.attempts,n.error,n.created_at,n.updated_at,b.customer,b.date,b.time FROM whatsapp_notifications n JOIN bookings b ON b.id=n.booking_id ORDER BY n.created_at DESC LIMIT 50').all();return Response.json({configured:config.configured,enabled:config.enabled,recipient:config.recipient?`+${config.recipient.slice(0,2)} •••• ${config.recipient.slice(-4)}`:null,entries:entries.results})}catch{return fail('Não foi possível carregar os avisos.',503)}
}
export async function POST(request:Request){
  if(!await owner())return fail('Acesso restrito.',403);
  if(!whatsappConfiguration().configured)return fail('Conecte o WhatsApp antes de reenviar avisos.',409);
  let body:{id?:unknown};try{body=await request.json()}catch{return fail('Dados inválidos.')}
  if(typeof body.id!=='string'||!/^[-a-f0-9]{36}$/i.test(body.id))return fail('Aviso inválido.');
  try{const status=await dispatchWhatsapp(body.id);return Response.json({status})}catch{return fail('Não foi possível confirmar o envio. Confira o histórico antes de repetir.',503)}
}
