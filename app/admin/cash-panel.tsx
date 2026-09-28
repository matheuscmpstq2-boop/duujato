'use client';
import {useEffect,useState} from 'react';

type Entry={id:string;type:'income'|'expense';date:string;category:string;description:string;amount_cents:number;payment_method:string;booking_id:string|null;voided_at:string|null};
type Booking={id:string;date:string;time:string;customer:string;service_name:string;status:string};
type CashData={entries:Entry[];income:number;expense:number;balance:number;daily:{date:string;income:number;expense:number}[];truncated:boolean};
const categories={income:['Serviços','Produtos','Outras entradas'],expense:['Produtos e materiais','Equipe','Aluguel','Água e energia','Manutenção','Impostos e taxas','Outras saídas']};
const methods=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Outro'];
const money=(cents:number)=>(cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const initial=()=>({type:'income' as 'income'|'expense',date:today(),category:'Serviços',description:'',amount:'',payment_method:'Pix',booking_id:''});

export default function CashPanel({bookings,selectedBooking,onRegistered}:{bookings:Booking[];selectedBooking:string;onRegistered:()=>void}){
  const [month,setMonth]=useState(()=>today().slice(0,7));
  const [data,setData]=useState<CashData|null>(null);
  const [form,setForm]=useState(initial);
  const [filter,setFilter]=useState('all');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!selectedBooking)return;const item=bookings.find(b=>b.id===selectedBooking);if(item)setForm({...initial(),booking_id:item.id,description:`${item.service_name} · ${item.customer}`})},[selectedBooking,bookings]);
  async function load(selected:string){
    const response=await fetch('/api/admin/cash?month='+encodeURIComponent(selected));
    const payload=await response.json() as CashData & {error?:string};
    if(!response.ok)throw new Error(payload.error||'Não foi possível carregar o caixa.');
    setData(payload);
  }
  useEffect(()=>{let active=true;fetch('/api/admin/cash?month='+encodeURIComponent(month)).then(async response=>{const result=await response.json() as CashData & {error?:string};if(!response.ok)throw new Error(result.error||'Não foi possível carregar o caixa.');if(active){setData(result);setError('')}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Não foi possível carregar o caixa.')});return()=>{active=false}},[month]);
  async function save(e:React.FormEvent){
    e.preventDefault();setError('');setMessage('');
    const typed=form.amount.trim();
    const raw=typed.includes(',')?typed.replace(/\./g,'').replace(',','.'):typed;
    if(!/^\d+(\.\d{1,2})?$/.test(raw)){setError('Informe um valor válido, por exemplo 45,00.');return}
    const cents=Math.round(Number(raw)*100);
    if(cents<1||cents>100000000){setError('O valor deve ser maior que zero e menor que R$ 1.000.000,00.');return}
    setBusy(true);
    try{const response=await fetch('/api/admin/cash',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:form.type,date:form.date,category:form.category,description:form.description,amount_cents:cents,payment_method:form.payment_method,booking_id:form.type==='income'&&form.booking_id||null})});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||'Não foi possível salvar.');setForm(initial());onRegistered();setMonth(form.date.slice(0,7));await load(form.date.slice(0,7));setMessage('Lançamento registrado no caixa.')}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setBusy(false)}
  }
  async function remove(entry:Entry){if(!confirm(`Estornar ${entry.description} (${money(entry.amount_cents)})? O registro permanecerá no histórico.`))return;setBusy(true);setError('');setMessage('');try{const response=await fetch('/api/admin/cash?id='+encodeURIComponent(entry.id),{method:'DELETE'});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||'Não foi possível estornar.');await load(month);onRegistered();setMessage('Lançamento estornado.')}catch(e){setError(e instanceof Error?e.message:'Não foi possível estornar.')}finally{setBusy(false)}}
  const shown=data?.entries.filter(entry=>filter==='all'||entry.type===filter)||[];
  return <><div className="tab-heading"><div><h2>Caixa</h2><p className="muted">Registre valores recebidos e despesas para acompanhar o resultado do mês.</p></div><div className="actions"><label className="field">Mês<input type="month" value={month} onChange={e=>setMonth(e.target.value)} aria-label="Mês do caixa"/></label><a className="secondary-link" href={'/api/admin/cash?month='+month+'&format=csv'}>Baixar planilha CSV</a></div></div>
    {error&&<div className="notice error" role="alert">{error}</div>}{message&&<div className="notice success" role="status">{message}</div>}
    <div className="cash-summary"><div className="card"><span>Entradas</span><strong className="cash-positive">{data?money(data.income):'—'}</strong></div><div className="card"><span>Saídas</span><strong className="cash-negative">{data?money(data.expense):'—'}</strong></div><div className="card"><span>Saldo do mês</span><strong className={data?.balance&&data.balance<0?'cash-negative':'cash-positive'}>{data?money(data.balance):'—'}</strong></div></div>
    <form className="card editor" onSubmit={save}><h3>Novo lançamento</h3><div className="field-grid"><label className="field">Tipo<select value={form.type} onChange={e=>{const type=e.target.value as 'income'|'expense';setForm({...form,type,category:categories[type][0],booking_id:''})}}><option value="income">Entrada</option><option value="expense">Saída</option></select></label><label className="field">Data<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label><label className="field">Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories[form.type].map(c=><option key={c}>{c}</option>)}</select></label><label className="field">Valor em R$<input inputMode="decimal" placeholder="Ex.: 45,00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></label><label className="field">Descrição<input placeholder="Ex.: Lavagem completa" minLength={2} maxLength={180} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/></label><label className="field">Forma de pagamento<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>{methods.map(m=><option key={m}>{m}</option>)}</select></label>{form.type==='income'&&<label className="field">Agendamento (opcional)<select value={form.booking_id} onChange={e=>{const b=bookings.find(b=>b.id===e.target.value);setForm({...form,booking_id:e.target.value,description:b?`${b.service_name} · ${b.customer}`:form.description})}}><option value="">Sem vínculo</option>{bookings.filter(b=>['confirmed','completed'].includes(b.status)&&!data?.entries.some(e=>e.booking_id===b.id&&!e.voided_at)).map(b=><option value={b.id} key={b.id}>{new Date(b.date+'T12:00:00').toLocaleDateString('pt-BR')} · {b.customer} · {b.service_name}</option>)}</select></label>}</div><button className="primary-action cash-save" disabled={busy}>Registrar {form.type==='income'?'entrada':'saída'}</button><p className="muted">Um agendamento só entra no caixa depois que você registra o pagamento. O valor pode ser diferente do preço do catálogo.</p></form>
    <div className="card editor"><h3>Fechamento por dia</h3>{data?.daily.length?<div className="cash-daily">{data.daily.map(day=><div key={day.date}><strong>{new Date(day.date+'T12:00:00').toLocaleDateString('pt-BR')}</strong><span className="cash-positive">+ {money(day.income)}</span><span className="cash-negative">− {money(day.expense)}</span><strong>{money(day.income-day.expense)}</strong></div>)}</div>:<p className="muted">Sem movimentação neste mês.</p>}</div>
    <div className="tab-heading"><div><h2>Histórico do mês</h2><p className="muted">{data?.entries.length||0} lançamentos registrados</p></div><select aria-label="Filtrar lançamentos" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="income">Entradas</option><option value="expense">Saídas</option></select></div><div className="admin-list">{shown.length?shown.map(entry=><div className={'card cash-row '+(entry.voided_at?'cash-voided':'')} key={entry.id}><div><span className={'cash-kind '+entry.type}>{entry.type==='income'?'Entrada':'Saída'}{entry.voided_at?' · Estornado':''}</span><h3>{entry.description}</h3><p className="muted">{new Date(entry.date+'T12:00:00').toLocaleDateString('pt-BR')} · {entry.category} · {entry.payment_method}{entry.booking_id?' · Agendamento vinculado':''}</p></div><div className="cash-row-end"><strong className={entry.type==='income'?'cash-positive':'cash-negative'}>{entry.type==='income'?'+':'−'} {money(entry.amount_cents)}</strong>{!entry.voided_at&&<button type="button" disabled={busy} onClick={()=>remove(entry)}>Estornar</button>}</div></div>):<div className="empty">Nenhum lançamento nesta visualização.</div>}</div>{data?.truncated&&<p className="muted">Mostrando os 500 lançamentos mais recentes deste mês. Os totais incluem todos os lançamentos válidos.</p>}
  </>
}
