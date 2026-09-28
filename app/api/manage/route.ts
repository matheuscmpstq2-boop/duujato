import {available,db,fail,freeBay,localNow,slotsFor,tokenHash,validClock,validDate} from '@/lib/booking';

type Managed={id:string;customer:string;service_name:string;duration:number;date:string;time:string;vehicle:string;plate:string;status:string};
async function booking(request:Request){const token=new URL(request.url).searchParams.get('token')||'';if(!/^[a-f0-9-]{72}$/.test(token))return null;return db().prepare('SELECT id,customer,service_name,duration,date,time,vehicle,plate,status FROM bookings WHERE manage_token_hash=?').bind(await tokenHash(token)).first<Managed>()}
export async function GET(request:Request){try{const item=await booking(request);if(!item)return fail('Link de agendamento inválido.',404);return Response.json(item)}catch{return fail('Não foi possível consultar o agendamento.',503)}}
export async function PATCH(request:Request){
  let input:{action?:string;date?:string;time?:string};try{input=await request.json()}catch{return fail('Dados inválidos.')}
  try{
    const item=await booking(request);if(!item)return fail('Link de agendamento inválido.',404);
    if(!['pending','confirmed'].includes(item.status))return fail('Este agendamento não pode mais ser alterado.',409);
    const now=localNow();if(item.date<now.today||item.date===now.today&&item.time<=now.time)return fail('O horário deste agendamento já passou. Fale com o lava-jato.',409);
    if(input.action==='cancel'){
      await db().batch([db().prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND status IN ('pending','confirmed')").bind(item.id),db().prepare("DELETE FROM occupied_slots WHERE booking_id=? AND EXISTS (SELECT 1 FROM bookings WHERE id=? AND status='cancelled')").bind(item.id,item.id)]);
      return Response.json({ok:true,status:'cancelled'});
    }
    if(input.action!=='reschedule'||!input.date||!input.time||!validDate(input.date)||!validClock(input.time))return fail('Selecione uma data e um horário válidos.');
    if(item.date===input.date&&item.time===input.time)return fail('Escolha um horário diferente.');
    if(!(await available(input.date,item.duration,item.id)).includes(input.time))return fail('Horário indisponível. Escolha outro horário.',409);
    const bay=await freeBay(input.date,input.time,item.duration,item.id);
    if(!bay)return fail('Horário indisponível. Escolha outro horário.',409);
    await db().batch([db().prepare("UPDATE bookings SET date=?,time=?,status='pending' WHERE id=? AND status IN ('pending','confirmed')").bind(input.date,input.time,item.id),db().prepare('DELETE FROM occupied_slots WHERE booking_id=?').bind(item.id),...slotsFor(input.time,item.duration).map(slot=>db().prepare('INSERT INTO occupied_slots (date,time,booking_id,bay) VALUES (?,?,?,?)').bind(input.date,slot,item.id,bay))]);
    return Response.json({ok:true,status:'pending'});
  }catch{return fail('Não foi possível atualizar. Tente outro horário.',409)}
}
