import {db,esc,rs,stamp} from './store.js';
import {$,act} from './ui.js';
import {showBill} from './bill.js';

const sum=(list,f)=>list.reduce((s,x)=>s+f(x),0);

export function renderHisaab(){
  const today=db.bills.filter(b=>b.ts>=new Date().setHours(0,0,0,0));
  $('#main').innerHTML=`<div class="card"><h3>Aaj ka hisaab</h3>
<div class="stat">
<div>Bikri<b>${rs(sum(today,b=>b.total))}</b></div>
<div>Bill<b>${today.length}</b></div>
<div>Cash mila<b>${rs(sum(today,b=>Math.min(b.paid,b.total)))}</b></div>
<div>Udhaar diya<b>${rs(sum(today,b=>b.due))}</b></div>
</div></div>
<div class="card"><h3>Purane bill</h3>
${db.bills.slice(0,60).map((b,i)=>`<div class="item" data-a="oldBill" data-v="${i}">
<div><b>Bill #${b.no}</b><small>${stamp(b.ts)}${b.customer?' · '+esc(b.customer):''}</small></div>
<span class="amt">${rs(b.total)}</span></div>`).join('')||'<p class="mut">Abhi koi bill nahi.</p>'}</div>`;
}

act.oldBill=i=>showBill(db.bills[+i],true);
