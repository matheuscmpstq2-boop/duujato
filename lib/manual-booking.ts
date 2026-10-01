import {db,fail,admin,owner,validDate,validClock,hoursOn,minutes,freeBay,slotsFor,localNow} from './booking';

const methods=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Outro'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function createManualBooking(request:Request){
  if(!await admin())return fail('Acesso não autorizado.',403);
  const isOwner=await owner();
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return fail('Dados inválidos.')}
  const id=String(body.id||''),date=String(body.date||''),time=String(body.time||''),serviceId=String(body.service||'');
  const customer=String(body.customer||'').trim(),phone=String(body.phone||'').replace(/\D/g,''),vehicle=String(body.vehicle||'').trim(),plate=String(body.plate||'').trim().toUpperCase();
  const status=body.status,paid=body.paid,amount=body.amount_cents,method=body.payment_method;
  if(!uuid.test(id)||!validDate(date)||!validClock(time)||customer.length<2||customer.length>100||vehicle.length<2||vehicle.length>80||!/^[A-Z0-9-]{6,8}$/.test(plate)||(phone&&!(phone.length>=10&&phone.length<=13))||!['confirmed','completed'].includes(String(status))||typeof paid!=='boolean')return fail('Confira os dados do atendimento.');
  if(paid&&!isOwner)return fail('Apenas o administrador pode registrar pagamentos.',403);
  if(paid&&(typeof amount!=='number'||!Number.isSafeInteger(amount)||amount<1||amount>100000000||typeof method!=='string'||!methods.includes(method)))return fail('Confira o valor recebido e a forma de pagamento.');
  const today=localNow().today;
  if(status==='completed'&&date!==today)return fail('Um atendimento concluído deve ter a data de hoje.');
  const saved=()=>db().prepare(isOwner?'SELECT b.id,b.status,c.id AS cash_id FROM bookings b LEFT JOIN cash_entries c ON c.booking_id=b.id AND c.voided_at IS NULL WHERE b.id=?':'SELECT id,status FROM bookings WHERE id=?').bind(id).first<{id:string;status:string;cash_id:string|null}>();
  try{
    const existing=await saved();
    if(existing)return Response.json({id:existing.id,status:existing.status,paid:isOwner&&existing.cash_id!=null,alreadyRegistered:true});
    const service=await db().prepare('SELECT id,name,duration FROM services WHERE id=? AND active=1').bind(serviceId).first<{id:string;name:string;duration:number}>();
    if(!service)return fail('Escolha um serviço ativo.');
    if(!Number.isInteger(service.duration)||service.duration<30||service.duration%30!==0)return fail('Revise a duração do serviço.');
    const [hours,closed]=await Promise.all([hoursOn(date),db().prepare('SELECT date FROM closed_dates WHERE date=?').bind(date).first()]);
    const start=minutes(time),end=start+service.duration;
    if(closed||!hours.enabled||start<minutes(hours.opening)||end>minutes(hours.closing)||(hours.break_start&&hours.break_end&&start<minutes(hours.break_end)&&end>minutes(hours.break_start)))return fail('O atendimento deve caber no expediente, fora das pausas e dos dias fechados.',409);
    // Manual entries may start in the current half-hour or earlier today.
    const bay=await freeBay(date,time,service.duration);
    if(!bay)return fail('Não há vaga neste horário. Confira a agenda e escolha outro horário.',409);
    const createdAt=new Date().toISOString();
    const statements=[
      db().prepare('INSERT INTO bookings (id,service_id,service_name,duration,date,time,customer,phone,vehicle,plate,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,service.id,service.name,service.duration,date,time,customer,phone,vehicle,plate,status,createdAt),
      ...slotsFor(time,service.duration).map(slot=>db().prepare('INSERT INTO occupied_slots (date,time,booking_id,bay) VALUES (?,?,?,?)').bind(date,slot,id,bay)),
    ];
    if(paid)statements.push(db().prepare('INSERT INTO cash_entries (id,type,date,category,description,amount_cents,payment_method,created_at,booking_id) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'income',today,'Serviços',`${service.name} · ${customer}`,amount,method,createdAt,id));
    // The existing adapter commits the booking, capacity and payment together.
    await db().batch(statements);
    return Response.json({id,status,paid},{status:201});
  }catch(error){
    if((error as {code?:string})?.code==='23505'){
      try{const existing=await saved();if(existing)return Response.json({id:existing.id,status:existing.status,paid:isOwner&&existing.cash_id!=null,alreadyRegistered:true})}catch{}
      return fail('Este horário acabou de ser ocupado. Confira a agenda e tente outro horário.',409);
    }
    return fail('Não foi possível salvar o atendimento. Tente novamente; o mesmo envio não será duplicado.',503);
  }
}
