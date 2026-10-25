import {db,save,esc,rs,stamp,uid,balance,addCustomer} from './store.js';
import {$,act,chg,modal,closeModal,toast,waLink} from './ui.js';
import {listen} from './voice.js';
import {parseLedger} from './parser.js';

let cur=0;

const names=()=>db.customers.map(c=>c.name);

export function renderUdhaar(){
  const rows=db.customers.map((c,i)=>({c,i,b:balance(c.name)})).sort((a,b)=>b.b-a.b);
  const owed=rows.reduce((s,x)=>s+Math.max(0,x.b),0);
  $('#main').innerHTML=`<div class="card">
<div class="mut">Kul baaki udhaar</div>
<div class="tot"><span class="due">${rs(owed)}</span><span class="mut" style="font-size:14px">${rows.filter(x=>x.b>0).length} log</span></div>
<div class="row"><button class="mic" data-idle="🎤 Bolkar entry" data-on="⏹ Sun raha hoon…" data-a="ledMic">🎤 Bolkar entry</button><button class="ghost" data-a="ledManual">✍️ Haath se</button></div>
<div class="hint" style="text-align:left;margin:8px 0 0">Bolo: “Ramesh ne 200 diye” ya “Sunita ka 150 udhaar”</div>
</div>
<div class="card">${rows.map(({c,i,b})=>`<div class="item" data-a="cust" data-v="${i}">
<div><b>${esc(c.name)}</b><small>${esc(c.phone||'phone nahi')}</small></div>
<span class="amt ${b>0?'due':'ok'}">${rs(b)}</span></div>`).join('')||'<p class="mut">Abhi koi udhaar nahi. Bill banate waqt “udhaar” bolo to yahan dikhega.</p>'}</div>`;
}

function ledger(name,amount,kind){
  modal(`<h2>Udhaar entry</h2>
<label>Customer</label><input id="lName" list="lNames" value="${esc(name)}" placeholder="Naam">
<datalist id="lNames">${db.customers.map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist>
<label>Amount (₹)</label><input id="lAmt" type="number" inputmode="decimal" value="${amount??''}">
<label>Kya hua?</label>
<select id="lKind"><option value="jama" ${kind==='jama'?'selected':''}>Paise mile (jama)</option><option value="udhaar" ${kind==='udhaar'?'selected':''}>Udhaar diya</option></select>
<button class="primary big" data-a="ledSave">Save</button>`);
}

act.ledMic=(_,btn)=>listen(btn,(t,final)=>{
  if(!final)return;
  const p=parseLedger(t,names());
  ledger(p.name,p.amount,p.kind);
});

act.ledManual=()=>ledger('',null,'jama');

act.ledSave=()=>{
  const name=$('#lName').value.trim(),amt=parseFloat($('#lAmt').value);
  if(!name||!(amt>0))return toast('Naam aur amount dono chahiye');
  const cust=addCustomer(name);
  db.entries.push({id:uid(),cust,type:$('#lKind').value,amt,ts:Date.now()});
  save();
  closeModal();
  renderUdhaar();
  toast(`${cust}: baaki ${rs(balance(cust))}`);
};

function sheet(){
  const c=db.customers[cur];
  const b=balance(c.name);
  const rows=db.entries.filter(e=>e.cust===c.name).sort((x,y)=>y.ts-x.ts).slice(0,25);
  modal(`<h2>${esc(c.name)}</h2>
<div class="tot"><span>Baaki</span><span class="${b>0?'due':'ok'}">${rs(b)}</span></div>
<label>Phone</label><input type="tel" inputmode="numeric" value="${esc(c.phone)}" data-c="phone">
<div class="row">
<input id="cAmt" type="number" inputmode="decimal" placeholder="₹ amount">
<button class="primary" data-a="entry" data-v="jama">Mile</button>
<button class="ghost" data-a="entry" data-v="udhaar">Udhaar</button>
</div>
${b>0?'<div class="row"><button class="ghost" data-a="remind">📲 WhatsApp par yaad dilao</button></div>':''}
<div class="row"><button class="ghost" data-a="close">Band karo</button></div>
<h3 style="margin-top:14px">Hisaab</h3>
${rows.map(e=>`<div class="item"><div>${e.type==='udhaar'?'Udhaar':'Jama'}<small>${stamp(e.ts)}${e.bill?' · Bill #'+e.bill:''}</small></div>
<span class="amt ${e.type==='udhaar'?'due':'ok'}">${e.type==='udhaar'?'+':'−'}${rs(e.amt)}</span></div>`).join('')||'<p class="mut">Koi entry nahi</p>'}`);
}

act.cust=i=>{cur=+i;sheet()};

chg.phone=v=>{db.customers[cur].phone=v;save()};

act.entry=kind=>{
  const amt=parseFloat($('#cAmt').value);
  if(!(amt>0))return toast('Amount likho');
  db.entries.push({id:uid(),cust:db.customers[cur].name,type:kind,amt,ts:Date.now()});
  save();
  sheet();
  renderUdhaar();
};

act.remind=()=>{
  const c=db.customers[cur];
  const text=`Namaste ${c.name} ji, ${db.shop||'dukaan'} se yaad dila rahe hain: aapka ${rs(balance(c.name))} baaki hai. Dhanyavaad 🙏`;
  window.open(waLink(text,c.phone),'_blank');
};
