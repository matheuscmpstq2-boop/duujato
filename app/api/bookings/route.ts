import {available,db,fail,freeBay,slotsFor,tokenHash,validDate,validClock} from '@/lib/booking';
import {after} from 'next/server';
import {dispatchWhatsapp,whatsappConfiguration} from '@/lib/whatsapp';

export const maxDuration=30;
export async function POST(request:Request){
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return fail('Dados inválidos.')}
  const date=String(body.date||''),time=String(body.time||''),id=String(body.service||''),customer=String(body.customer||'').trim(),phone=String(body.phone||'').replace(/\D/g,''),vehicle=String(body.vehicle||'').trim(),plate=String(body.plate||'').trim().toUpperCase();
  if(!validDate(date)||!validClock(time)||customer.length<2||customer.length>100||phone.length<10||phone.length>13||vehicle.length<2||vehicle.length>80||!/^[A-Z0-9-]{6,8}$/.test(plate))return fail('Confira os dados do agendamento.');
  try{
    const service=await db().prepare('SELECT id,name,duration FROM services WHERE id=? AND active=1').bind(id).first<{id:string;name:string;duration:number}>();
    if(!service)return fail('Serviço indisponível.');
    if(!(await available(date,service.duration)).includes(time))return fail('Horário indisponível. Escolha outro horário.',409);
    const bay=await freeBay(date,time,service.duration);
    if(!bay)return fail('Horário indisponível. Escolha outro horário.',409);
    const bookingId=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
    const notification=whatsappConfiguration();
    const createdAt=new Date().toISOString();
    await db().batch([
      db().prepare('INSERT INTO bookings (id,service_id,service_name,duration,date,time,customer,phone,vehicle,plate,status,created_at,manage_token_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(bookingId,id,service.name,service.duration,date,time,customer,phone,vehicle,plate,'pending',createdAt,await tokenHash(token)),
      ...slotsFor(time,service.duration).map(slot=>db().prepare('INSERT INTO occupied_slots (date,time,booking_id,bay) VALUES (?,?,?,?)').bind(date,slot,bookingId,bay)),
      ...(notification.configured?[db().prepare('INSERT INTO whatsapp_notifications (booking_id,recipient,created_at,updated_at) VALUES (?,?,?,?)').bind(bookingId,notification.recipient,createdAt,createdAt)]:[]),
    ]);
    if(notification.configured){try{after(async()=>{try{await dispatchWhatsapp(bookingId)}catch{console.error('Falha ao processar aviso de agendamento no WhatsApp.')}})}catch{console.error('Aviso de agendamento aguardando processamento.')}}
    return Response.json({id:bookingId,status:'pending',manageUrl:'/manage?token='+token},{status:201});
  }catch{return fail('Este horário acabou de ser reservado. Escolha outro horário.',409)}
}
