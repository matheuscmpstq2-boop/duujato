import {db} from './database';

type Notice={booking_id:string;recipient:string;customer:string;service_name:string;date:string;time:string;vehicle:string;plate:string;status?:string};
const fields=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_OWNER_PHONE','WHATSAPP_TEMPLATE_NAME','WHATSAPP_API_VERSION'] as const;
export function whatsappConfiguration(){
  const missing=fields.filter(key=>!process.env[key]?.trim());
  const recipient=process.env.WHATSAPP_OWNER_PHONE?.replace(/\D/g,'')||'';
  const valid=/^\d{10,15}$/.test(recipient)&&/^\d+$/.test(process.env.WHATSAPP_PHONE_NUMBER_ID||'')&&/^[a-z0-9_]+$/.test(process.env.WHATSAPP_TEMPLATE_NAME||'')&&/^v\d+\.\d+$/.test(process.env.WHATSAPP_API_VERSION||'');
  const enabled=process.env.WHATSAPP_ENABLED==='true';
  // Preview deployments never send real messages.
  const configured=enabled&&process.env.VERCEL_ENV==='production'&&missing.length===0&&valid;
  return {configured,enabled,missing,recipient};
}
export function whatsappBody(notice:Notice){
  const values=[notice.customer,notice.service_name,notice.date.split('-').reverse().join('/'),notice.time,notice.vehicle,notice.plate];
  return {messaging_product:'whatsapp',recipient_type:'individual',to:notice.recipient,type:'template',template:{name:process.env.WHATSAPP_TEMPLATE_NAME,language:{code:'pt_BR'},components:[{type:'body',parameters:values.map(value=>({type:'text',text:value.replace(/\s+/g,' ').trim()}))}]}};
}
export async function dispatchWhatsapp(bookingId:string){
  if(!whatsappConfiguration().configured)return 'disabled';
  // Claim atomically. Accepted and uncertain messages are never retried automatically.
  const claimed=await db().prepare("UPDATE whatsapp_notifications SET status='sending',attempts=attempts+1,updated_at=? WHERE booking_id=? AND status IN ('pending','failed') AND attempts<3 RETURNING booking_id").bind(new Date().toISOString(),bookingId).first();
  if(!claimed)return 'unchanged';
  const notice=await db().prepare('SELECT n.booking_id,n.recipient,b.customer,b.service_name,b.date,b.time,b.vehicle,b.plate,b.status FROM whatsapp_notifications n JOIN bookings b ON b.id=n.booking_id WHERE n.booking_id=?').bind(bookingId).first<Notice>();
  if(!notice)return 'unchanged';
  if(notice.status==='cancelled'){await db().prepare("UPDATE whatsapp_notifications SET status='cancelled',error=NULL,updated_at=? WHERE booking_id=?").bind(new Date().toISOString(),bookingId).run();return 'cancelled'}
  let status='uncertain',messageId:string|null=null,error:string|null='Não foi possível confirmar o envio. Confira o WhatsApp antes de tentar novamente.';
  try{
    const response=await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,'content-type':'application/json'},body:JSON.stringify(whatsappBody(notice)),signal:AbortSignal.timeout(10000)});
    const data=await response.json() as {messages?:{id?:string}[];error?:{code?:number}};
    if(response.ok&&data.messages?.[0]?.id){status='accepted';messageId=data.messages[0].id;error=null}
    else if(!response.ok){status='failed';error=`A Meta recusou o envio (HTTP ${response.status}${typeof data.error?.code==='number'?`, código ${data.error.code}`:''}). Revise a conexão e o modelo de mensagem.`}
  }catch{}
  await db().prepare('UPDATE whatsapp_notifications SET status=?,message_id=?,error=?,updated_at=? WHERE booking_id=?').bind(status,messageId,error,new Date().toISOString(),bookingId).run();
  return status;
}
