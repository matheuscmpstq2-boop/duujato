'use client';
import {useEffect,useRef,useState} from 'react';

type Service={id:string;name:string;duration:number;price_cents:number|null;active:number};
const methods=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Outro'];
const empty={date:'',time:'',service:'',customer:'',phone:'',vehicle:'',plate:'',status:'confirmed',paid:false,amount:'',payment_method:'Pix'};
function now(){const d=new Date();const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);const time=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);const rounded=Math.ceil((Number(time.slice(0,2))*60+Number(time.slice(3)))/30)*30;return {date:rounded===1440?new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10):date,time:rounded===1440?'00:00':String(Math.floor(rounded/60)).padStart(2,'0')+':'+String(rounded%60).padStart(2,'0')}}

export default function ManualBooking({services,onSaved,onCancel}:{services:Service[];onSaved:(paid:boolean)=>void;onCancel:()=>void}){
  const [form,setForm]=useState(empty),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const submission=useRef('');
  useEffect(()=>{setForm({...empty,...now()});submission.current=crypto.randomUUID()},[]);
  const active=services.filter(s=>s.active);
  async function save(e:React.FormEvent){
    e.preventDefault();if(busy)return;setError('');
    let cents:number|undefined;
    if(form.paid){const value=form.amount.trim().replace(/\s/g,'');const raw=value.includes(',')?value.replace(/\./g,'').replace(',','.'):value;if(!/^\d+(\.\d{1,2})?$/.test(raw)){setError('Informe o valor recebido, por exemplo 45,00.');return}cents=Math.round(Number(raw)*100);if(cents<1||cents>100000000){setError('Informe um valor recebido válido, maior que zero.');return}}
    if(!submission.current){setError('Aguarde o formulário carregar.');return}
    setBusy(true);
    try{const response=await fetch('/api/admin/bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,id:submission.current,amount_cents:cents})});const data=await response.json() as {error?:string;paid?:boolean};if(!response.ok)throw new Error(data.error||'Não foi possível salvar o atendimento.');onSaved(data.paid===true)}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setBusy(false)}
  }
  return <form className="card editor" onSubmit={save} aria-label="Novo atendimento manual">
    <h3>Novo atendimento</h3><p className="muted">Cadastre um carro que chegou sem agendamento ou inclua uma reserva feita diretamente com você.</p>
    {error&&<div className="notice error" role="alert">{error}</div>}
    {!active.length&&<p className="notice error">Cadastre ou ative um serviço na aba Serviços antes de registrar o atendimento.</p>}
    <fieldset disabled={busy} style={{border:0,padding:0,margin:0}}><div className="field-grid">
      <label className="field">Serviço<select required value={form.service} onChange={e=>{const s=active.find(s=>s.id===e.target.value);setForm({...form,service:e.target.value,amount:s?.price_cents!=null?(s.price_cents/100).toFixed(2).replace('.',','):''})}}><option value="">Selecione o serviço</option>{active.map(s=><option key={s.id} value={s.id}>{s.name} · {s.duration} min</option>)}</select></label>
      <label className="field">Situação<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="confirmed">Confirmado / a atender</option><option value="completed">Lavagem concluída</option></select></label>
      <label className="field">Data<input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label className="field">Horário de início<input type="time" step="1800" required value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label>
      <label className="field">Nome do cliente<input required minLength={2} maxLength={100} value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/></label>
      <label className="field">WhatsApp (opcional)<input type="tel" maxLength={25} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
      <label className="field">Veículo<input required minLength={2} maxLength={80} placeholder="Ex.: Honda Civic" value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}/></label>
      <label className="field">Placa<input required minLength={6} maxLength={8} placeholder="Ex.: ABC1D23" value={form.plate} onChange={e=>setForm({...form,plate:e.target.value.toUpperCase()})}/></label>
    </div><p className="muted">Horário de Brasília, em intervalos de 30 minutos. O atendimento precisa caber no expediente e ter uma vaga livre.</p>
    <label className="weekday-name" style={{margin:'20px 0'}}><input type="checkbox" checked={form.paid} onChange={e=>setForm({...form,paid:e.target.checked})}/>Pagamento já recebido</label>
    {form.paid&&<div className="field-grid"><label className="field">Valor recebido em R$<input inputMode="decimal" required placeholder="Ex.: 45,00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label className="field">Forma de pagamento<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>{methods.map(method=><option key={method}>{method}</option>)}</select></label></div>}
    <p className="muted">{form.paid?'Uma entrada vinculada a este atendimento será registrada no caixa de hoje.':'O atendimento entra na agenda. Quando receber o pagamento, use Registrar recebimento.'}</p>
    <div className="actions"><button className="primary-action" disabled={busy||!active.length}>{busy?'Salvando…':form.paid?'Salvar atendimento e entrada no caixa':'Salvar atendimento'}</button><button type="button" onClick={onCancel} disabled={busy}>Cancelar</button></div></fieldset>
  </form>
}
