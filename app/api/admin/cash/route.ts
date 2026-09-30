import {owner,db,fail,localNow} from '@/lib/booking';

type CashEntry={id:string;type:string;date:string;category:string;description:string;amount_cents:number;payment_method:string;created_at:string;booking_id:string|null;voided_at:string|null};
const validDate=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
const categories={income:['Serviços','Produtos','Outras entradas'],expense:['Produtos e materiais','Equipe','Aluguel','Água e energia','Manutenção','Impostos e taxas','Outras saídas']};
const methods=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Outro'];
function nextMonth(month:string){const [year,m]=month.split('-').map(Number);return m===12?`${year+1}-01`:`${year}-${String(m+1).padStart(2,'0')}`}
function csvCell(v:string|number){let text=String(v);if(/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'}

export async function GET(request:Request){
  if(!await owner())return fail('Acesso restrito.',403);
  const q=new URL(request.url).searchParams,month=q.get('month')||localNow().today.slice(0,7),format=q.get('format');
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return fail('Mês inválido.');
  try{
    if(format==='csv'){
      const all=await db().prepare('SELECT * FROM cash_entries WHERE date>=? AND date<? ORDER BY date,created_at').bind(month+'-01',nextMonth(month)+'-01').all<CashEntry>();
      const rows=[['Data','Tipo','Categoria','Descrição','Valor (R$)','Forma de pagamento','Agendamento','Situação'],...all.results.map(x=>[x.date,x.type==='income'?'Entrada':'Saída',x.category,x.description,(x.amount_cents/100).toFixed(2).replace('.',','),x.payment_method,x.booking_id||'',x.voided_at?'Estornado':'Válido'])];
      return new Response('\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="caixa-${month}.csv"`,'cache-control':'no-store'}});
    }
    const [entries,totals,daily]=await Promise.all([
      db().prepare('SELECT * FROM cash_entries WHERE date>=? AND date<? ORDER BY date DESC,created_at DESC LIMIT 500').bind(month+'-01',nextMonth(month)+'-01').all<CashEntry>(),
      db().prepare('SELECT type,COALESCE(SUM(amount_cents),0) AS total FROM cash_entries WHERE date>=? AND date<? AND voided_at IS NULL GROUP BY type').bind(month+'-01',nextMonth(month)+'-01').all<{type:string;total:number}>(),
      db().prepare("SELECT date, SUM(CASE WHEN type='income' THEN amount_cents ELSE 0 END) AS income, SUM(CASE WHEN type='expense' THEN amount_cents ELSE 0 END) AS expense FROM cash_entries WHERE date>=? AND date<? AND voided_at IS NULL GROUP BY date ORDER BY date DESC").bind(month+'-01',nextMonth(month)+'-01').all<{date:string;income:number;expense:number}>(),
    ]);
    const income=totals.results.find(x=>x.type==='income')?.total||0,expense=totals.results.find(x=>x.type==='expense')?.total||0;
    return Response.json({entries:entries.results,income,expense,balance:income-expense,daily:daily.results,truncated:entries.results.length===500});
  }catch{return fail('Não foi possível carregar o caixa.',503)}
}

export async function POST(request:Request){
  if(!await owner())return fail('Acesso restrito.',403);
  let data:Record<string,unknown>;try{data=await request.json()}catch{return fail('Dados inválidos.')}
  const type=data.type,date=data.date,category=data.category,description=data.description,amount=data.amount_cents,method=data.payment_method,bookingId=data.booking_id;
  if((type!=='income'&&type!=='expense')||typeof date!=='string'||!validDate(date)||typeof category!=='string'||!categories[type].includes(category)||typeof description!=='string'||description.trim().length<2||description.trim().length>180||typeof amount!=='number'||!Number.isSafeInteger(amount)||amount<1||amount>100000000||typeof method!=='string'||!methods.includes(method)||bookingId!==undefined&&bookingId!==null&&(type!=='income'||typeof bookingId!=='string'||!/^[-a-f0-9]{36}$/.test(bookingId)))return fail('Confira os dados do lançamento.');
  try{
    if(bookingId){const booking=await db().prepare('SELECT status FROM bookings WHERE id=?').bind(bookingId).first<{status:string}>();if(!booking||!['confirmed','completed'].includes(booking.status))return fail('Confirme ou conclua o agendamento antes de registrar o recebimento.');}
    const id=crypto.randomUUID();
    await db().prepare('INSERT INTO cash_entries (id,type,date,category,description,amount_cents,payment_method,created_at,booking_id) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,type,date,category,description.trim(),amount,method,new Date().toISOString(),bookingId||null).run();
    return Response.json({id},{status:201});
  }catch{return fail(bookingId?'Este agendamento já tem um recebimento registrado.':'Não foi possível registrar o lançamento.',bookingId?409:503)}
}

export async function DELETE(request:Request){
  if(!await owner())return fail('Acesso restrito.',403);
  const id=new URL(request.url).searchParams.get('id');if(!id||!/^[-a-f0-9]{36}$/.test(id))return fail('Lançamento inválido.');
  try{const result=await db().prepare('UPDATE cash_entries SET voided_at=? WHERE id=? AND voided_at IS NULL').bind(new Date().toISOString(),id).run();if(!result.meta.changes)return fail('Lançamento não encontrado.',404);return Response.json({ok:true})}catch{return fail('Não foi possível estornar o lançamento.',503)}
}
