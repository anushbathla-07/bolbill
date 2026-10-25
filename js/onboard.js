import {db,save,esc,addItems,starterItems} from './store.js';
import {$,act,chg,toast} from './ui.js';
import {parseCatalog} from './parser.js';
import {norm} from './words.js';
import {STARTER} from './starter.js';

let draft=[];
let finish=()=>{};

const UNIT_OPTIONS=[['kg','/kg'],['l','/ltr'],['pcs','/pcs']];

export function renderOnboard(done){
  finish=done;
  $('#app').innerHTML=`<div class="wrap">
<h1>🎙️ BolBill</h1>
<p class="sub">Bolke bill banao. Pehle apni dukaan ka saman bata do, phir app wahi saman pehchanega.</p>
<div class="card"><label>Dukaan ka naam</label><input id="obShop" value="${esc(db.shop)}" placeholder="Jaise: Sharma Kirana Store"></div>
<div class="card"><h3>Saman ki list</h3>
<p class="mut">Saman, rate aur hisaab bolo ya likho. Jaise:<br><i>chawal 60 rupay kilo, tel 150 rupay litre, parle g 10 rupay packet</i></p>
<textarea id="obText" rows="3" placeholder="Yahan bolo ya likho…"></textarea>
<div class="row">
<button class="mic" data-idle="🎤 Bolkar likho" data-on="⏹ Sun raha hoon…" data-a="fillmic" data-v="obText">🎤 Bolkar likho</button>
<button class="primary" data-a="obAdd">➕ Jodo</button>
</div>
<div class="row"><button class="ghost" data-a="obStarter">⚡ Ready list (${STARTER.length} saman)</button></div>
</div>
<div id="obList"></div>
<button class="primary big" data-a="obDone">✅ Shuru karo</button>
</div>`;
  list();
}

function list(){
  const el=$('#obList');
  if(!draft.length){el.innerHTML='';return}
  el.innerHTML=`<div class="card"><h3>Aapka saman (${draft.length})</h3><div class="mut">Naam ya rate galat ho to yahin sudhar lo.</div>
${draft.map((d,i)=>`<div class="dr">
<input value="${esc(d.name)}" data-c="dn" data-v="${i}">
<input type="number" inputmode="decimal" value="${d.price}" data-c="dp" data-v="${i}">
<select data-c="du" data-v="${i}">${UNIT_OPTIONS.map(([v,l])=>`<option value="${v}" ${d.unit===v?'selected':''}>${l}</option>`).join('')}</select>
<button class="x" data-a="drm" data-v="${i}">✕</button>
</div>`).join('')}</div>`;
}

const indexOf=name=>draft.findIndex(d=>norm(d.name)===norm(name));

act.obAdd=()=>{
  const items=parseCatalog($('#obText').value);
  if(!items.length)return toast('Samajh nahi aaya. Aise bolo: chawal 60 rupay kilo');
  for(const it of items){
    const i=indexOf(it.name);
    if(i<0)draft.push(it);
    else draft[i]=it;
  }
  $('#obText').value='';
  list();
  toast(items.length+' saman jude');
};

act.obStarter=()=>{
  draft.push(...starterItems().filter(s=>indexOf(s.name)<0));
  list();
  toast('Ready list judi, rate apne hisaab se badlo');
};

act.drm=i=>{draft.splice(+i,1);list()};
chg.dn=(v,_,i)=>{draft[i].name=v};
chg.dp=(v,_,i)=>{draft[i].price=parseFloat(v)||0};
chg.du=(v,_,i)=>{draft[i].unit=v};

act.obDone=()=>{
  const items=draft.filter(d=>d.name.trim());
  if(!items.length)return toast('Kam se kam kuch saman jodo');
  db.shop=$('#obShop').value.trim();
  addItems(items);
  db.onboarded=true;
  save();
  draft=[];
  finish();
};
