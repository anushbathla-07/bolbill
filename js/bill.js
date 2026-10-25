import {db,save,esc,fmt,rs,stamp,UNAME,addCustomer} from './store.js';
import {$,act,chg,inp,modal,closeModal,toast,waLink} from './ui.js';
import {listen,say} from './voice.js';
import {parseBill} from './parser.js';
import {norm,fuzzy} from './words.js';

let bill=null,last='',shown={};

const names=()=>db.customers.map(c=>c.name);
const cents=n=>Math.round(n*100)/100;
const lineTotal=l=>cents(l.qty*l.price);

function totals(){
  const total=cents(bill.lines.reduce((s,l)=>s+lineTotal(l),0));
  const paid=bill.paid??total;
  return {total,paid,due:Math.max(0,cents(total-paid)),change:Math.max(0,cents(paid-total))};
}

export function textBill(r){
  const W=34,rule='-'.repeat(W);
  const center=s=>' '.repeat(Math.max(0,Math.floor((W-s.length)/2)))+s;
  const row=(a,b)=>{b=String(b);return String(a).slice(0,Math.max(1,W-b.length-1)).padEnd(W-b.length)+b};
  const out=[];
  if(r.shop)out.push(center(r.shop.toUpperCase()));
  out.push(center(`Bill #${r.no}   ${stamp(r.ts)}`),rule);
  for(const l of r.lines)out.push(row(l.name,fmt(lineTotal(l))),`  ${fmt(l.qty)} ${UNAME[l.unit]} x ${fmt(l.price)}`);
  out.push(rule,row('TOTAL',fmt(r.total)));
  if(r.paid>0)out.push(row('Mile (paid)',fmt(Math.min(r.paid,r.total))));
  if(r.paid>r.total)out.push(row('Wapas',fmt(r.paid-r.total)));
  if(r.due>0)out.push(row('UDHAAR'+(r.customer?` (${r.customer})`:''),fmt(r.due)));
  out.push(rule,center('Dhanyavaad! Phir aaiye 🙏'));
  return out.join('\n');
}

export function renderBill(){
  $('#main').innerHTML=`<div class="hero">
<button class="bigmic" data-idle="🎤" data-on="⏹" data-a="mic">🎤</button>
<div class="status" id="status">Mic dabao aur bolo</div>
<div class="hint">Jaise: “2 kilo chawal, 1 tel, 450 rupay”<br>ya “Ramesh ke naam udhaar 1 kilo cheeni”</div>
</div>
<div class="card" style="margin-top:12px">
<textarea id="tx" rows="2" placeholder="Ya yahan likhkar bhi bol sakte ho…"></textarea>
<div class="row"><button class="primary" data-a="make">Bill banao</button><button class="ghost" data-a="clear">Saaf karo</button></div>
</div>
<div id="area"></div>`;
  if(bill)$('#tx').value=last;
  area();
}

const lineHtml=(l,i)=>`<div class="line">
<div class="ln"><span><b>${esc(l.name)}</b>${l.flag?` <span class="due">${l.flag==='qty'?'⚠ qty 1 maani':'⚠ unit check karo'}</span>`:''}</span><span class="lt">${rs(lineTotal(l))}</span></div>
<div class="lc">
<button class="sq" data-a="step" data-v="${i},-1">−</button>
<input type="number" inputmode="decimal" step="any" value="${l.qty}" data-c="qty" data-v="${i}">
<span>${UNAME[l.unit]}</span> × ₹
<input class="pr" type="number" inputmode="decimal" step="any" value="${l.price}" data-c="price" data-v="${i}">
<button class="sq" data-a="step" data-v="${i},1">+</button>
<button class="x" data-a="del" data-v="${i}">✕</button>
</div></div>`;

function area(){
  const el=$('#area');
  if(!bill){el.innerHTML='';return}
  const has=bill.lines.length;
  const t=has?totals():null;
  const unknown=bill.unknown.length?`<div class="card"><b>❓ Ye samajh nahi aaya</b>
<div class="mut">Naam par tap karke batao ye kaunsa saman hai, app yaad rakhega.</div>
${bill.unknown.map((u,i)=>/^[\d.]/.test(u)?`<span class="chip w">${esc(u)}</span>`:`<button class="chip w" data-a="learn" data-v="${i}">${esc(u)}</button>`).join('')}</div>`:'';
  const lines=has?`<div class="card">${bill.lines.map(lineHtml).join('')}</div>`:'';
  const pay=has?`<div class="card"><div class="tot"><span>Total</span><span>${rs(t.total)}</span></div>
<label>Customer ne diye (₹)</label>
<input type="number" inputmode="decimal" value="${bill.paid??t.total}" data-c="paid">
<div class="row"><button class="ghost" data-a="paid" data-v="${t.total}">Poora mila</button><button class="ghost" data-a="paid" data-v="0">Poora udhaar</button></div>
${t.due>0?`<p class="due">Baaki udhaar: ${rs(t.due)}</p>
<label>Kiske naam par? (zaroori)</label>
<input id="cust" list="custList" value="${esc(bill.customer)}" data-i="cust" placeholder="Customer ka naam">
<datalist id="custList">${db.customers.map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist>`:''}
${t.change>0?`<p class="ok">Wapas dene hain: ${rs(t.change)}</p>`:''}</div>
<div class="card"><b>🧾 Bill</b>
<pre class="bill">${esc(textBill({no:db.nextBill,ts:Date.now(),shop:db.shop,lines:bill.lines,...t,customer:bill.customer}))}</pre>
<button class="primary big" data-a="saveBill">💾 Bill save karo</button></div>`:'';
  el.innerHTML=`${unknown}${lines}
<div class="card"><b>➕ Saman jodo</b><input placeholder="Saman ka naam likho…" data-i="find"><div id="found"></div></div>${pay}`;
}

function make(text){
  text=text.trim();
  if(!text)return toast('Pehle bolo ya likho');
  last=text;
  const p=parseBill(text,db.catalog,names());
  const lines=p.lines.map(l=>{
    const it=db.catalog.find(c=>c.id===l.id);
    return {id:it.id,name:it.name,unit:it.unit,price:it.price,qty:l.qty,flag:l.mismatch?'unit':l.assumed?'qty':''};
  });
  bill={lines,paid:p.amount??(p.udhaar?0:null),customer:p.customer,unknown:p.unknown};
  area();
  if(!lines.length)return toast('Koi saman nahi pehchana. Neeche se sikhao ya Saman tab me jodo');
  const t=totals();
  say(`Total ${fmt(t.total)} rupay${t.due>0?`, udhaar ${fmt(t.due)} rupay`:''}`);
}

act.mic=(_,btn)=>{
  $('#status').textContent='Bolo…';
  listen(btn,(t,final)=>{
    $('#tx').value=t;
    $('#status').textContent=final?'Samajh liya ✓':'Sun raha hoon… '+t;
    if(final)make(t);
  });
};

act.make=()=>make($('#tx').value);

act.clear=()=>{
  bill=null;
  last='';
  $('#tx').value='';
  $('#status').textContent='Mic dabao aur bolo';
  area();
};

act.step=v=>{
  const [i,d]=v.split(',').map(Number);
  const l=bill.lines[i];
  l.qty=Math.max(0,Math.round((l.qty+d*(l.unit==='pcs'?1:0.5))*1000)/1000);
  l.flag='';
  if(!l.qty)bill.lines.splice(i,1);
  area();
};

act.del=i=>{bill.lines.splice(+i,1);area()};
chg.qty=(v,_,i)=>{bill.lines[i].qty=Math.max(0,parseFloat(v)||0);bill.lines[i].flag='';area()};
chg.price=(v,_,i)=>{bill.lines[i].price=Math.max(0,parseFloat(v)||0);area()};
chg.paid=v=>{bill.paid=Math.max(0,parseFloat(v)||0);area()};
act.paid=v=>{bill.paid=+v;area()};
inp.cust=v=>{bill.customer=v};

inp.find=v=>{
  const q=norm(v);
  const hits=q?db.catalog.filter(c=>[c.name,...c.aliases].some(n=>norm(n).includes(q)||fuzzy(norm(n),q))).slice(0,8):[];
  $('#found').innerHTML=hits.map(c=>`<button class="chip" data-a="add" data-v="${c.id}">${esc(c.name)} · ${rs(c.price)}/${UNAME[c.unit]}</button>`).join('');
};

act.add=id=>{
  const old=bill.lines.find(l=>l.id===id);
  if(old)old.qty+=1;
  else{
    const c=db.catalog.find(x=>x.id===id);
    bill.lines.push({id,name:c.name,unit:c.unit,price:c.price,qty:1,flag:''});
  }
  area();
};

const pickList=(i,q='')=>{
  const hits=db.catalog.filter(c=>!q||norm(c.name).includes(norm(q))).slice(0,12);
  return hits.map(c=>`<button class="chip" data-a="pick" data-v="${c.id},${i}">${esc(c.name)}</button>`).join('');
};

act.learn=i=>modal(`<h2>“${esc(bill.unknown[i])}” kaunsa saman hai?</h2>
<input placeholder="Saman dhundo…" data-i="learnq" data-v="${i}">
<div id="pickList">${pickList(i)}</div>
<button class="ghost big" data-a="close">Rehne do</button>`);

inp.learnq=(v,_,i)=>{$('#pickList').innerHTML=pickList(i,v)};

act.pick=v=>{
  const [id,i]=v.split(',');
  const item=db.catalog.find(c=>c.id===id);
  const word=bill.unknown[+i];
  if(!item.aliases.includes(word))item.aliases.push(word);
  save();
  closeModal();
  toast(`“${word}” = ${item.name}, yaad rakh liya ✓`);
  make(last);
};

act.saveBill=()=>{
  if(!bill?.lines.length)return toast('Bill me koi saman nahi');
  const t=totals();
  const name=bill.customer.trim();
  if(t.due>0&&!name){
    toast('Udhaar hai, customer ka naam likho');
    return $('#cust')?.focus();
  }
  const rec={
    no:db.nextBill++,ts:Date.now(),shop:db.shop,
    lines:bill.lines.map(({name,unit,price,qty})=>({name,unit,price,qty})),
    ...t,customer:t.due>0?addCustomer(name):''
  };
  db.bills.unshift(rec);
  if(t.due>0)db.entries.push({id:rec.no,cust:rec.customer,type:'udhaar',amt:t.due,ts:rec.ts,bill:rec.no});
  save();
  bill=null;
  last='';
  renderBill();
  showBill(rec);
};

export function showBill(r,old=false){
  const c=db.customers.find(x=>x.name===r.customer);
  shown={text:textBill(r),phone:c?.phone||''};
  modal(`<h2>${old?'Bill #'+r.no:'✅ Bill ban gaya'}</h2>
<pre class="bill">${esc(shown.text)}</pre>
<div class="row"><button class="primary" data-a="wa">WhatsApp</button><button class="ghost" data-a="copy">Copy</button><button class="ghost" data-a="print">Print</button></div>
<button class="ghost big" data-a="close">${old?'Band karo':'Naya bill'}</button>`);
}

act.wa=()=>window.open(waLink(shown.text,shown.phone),'_blank');

act.copy=()=>navigator.clipboard.writeText(shown.text).then(()=>toast('Copy ho gaya'),()=>toast('Copy nahi hua'));

act.print=()=>{
  const w=window.open('','_blank');
  if(!w)return toast('Print window block hui');
  w.document.write(`<pre style="font:14px monospace">${esc(shown.text)}</pre>`);
  w.document.close();
  w.print();
};
