import {db,save,esc,rs,uid,UNAME,addItems} from './store.js';
import {$,act,inp,modal,closeModal,toast} from './ui.js';
import {parseCatalog} from './parser.js';
import {norm} from './words.js';

let editing=null;

export function renderSaman(){
  $('#main').innerHTML=`<div class="card">
<input placeholder="🔍 Saman dhundo…" data-i="sq">
<div class="row"><button class="primary" data-a="editItem">➕ Naya saman</button><button class="mic" data-a="bulk">🎤 Bolkar jodo</button></div>
</div>
<div class="card" id="slist"></div>`;
  list('');
}

function list(q){
  const key=norm(q);
  const items=db.catalog.filter(c=>!key||norm(c.name).includes(key)).sort((a,b)=>a.name.localeCompare(b.name));
  $('#slist').innerHTML=items.map(c=>`<div class="item" data-a="editItem" data-v="${c.id}">
<div><b>${esc(c.name)}</b><small>${esc(c.aliases.slice(0,4).join(', '))}</small></div>
<span class="amt">${rs(c.price)}/${UNAME[c.unit]}</span></div>`).join('')||'<p class="mut">Kuch nahi mila.</p>';
}

inp.sq=v=>list(v);

act.editItem=id=>{
  editing=id||null;
  const c=db.catalog.find(x=>x.id===id)||{name:'',aliases:[],price:0,unit:'kg'};
  const opt=(v,l)=>`<option value="${v}" ${c.unit===v?'selected':''}>${l}</option>`;
  modal(`<h2>${id?'Saman badlo':'Naya saman'}</h2>
<label>Naam</label><input id="eName" value="${esc(c.name)}">
<label>Dusre naam / bolne ke tareeke (comma se alag)</label><input id="eAlias" value="${esc(c.aliases.join(', '))}" placeholder="jaise: chaval, rice">
<div class="row">
<div><label>Rate (₹)</label><input id="ePrice" type="number" inputmode="decimal" value="${c.price}"></div>
<div><label>Hisaab</label><select id="eUnit">${opt('kg','per kilo')}${opt('l','per litre')}${opt('pcs','per piece/packet')}</select></div>
</div>
<div class="row"><button class="primary" data-a="saveItem">Save</button>${id?'<button class="danger" data-a="delItem">Hatao</button>':''}</div>`);
};

act.saveItem=()=>{
  const name=$('#eName').value.trim();
  if(!name)return toast('Naam likho');
  const data={
    name,
    aliases:$('#eAlias').value.split(',').map(s=>s.trim()).filter(Boolean),
    price:parseFloat($('#ePrice').value)||0,
    unit:$('#eUnit').value
  };
  const old=db.catalog.find(c=>c.id===editing);
  if(old)Object.assign(old,data);
  else db.catalog.push({id:uid(),...data});
  save();
  closeModal();
  renderSaman();
};

act.delItem=()=>{
  if(!confirm('Ye saman hatana hai?'))return;
  db.catalog=db.catalog.filter(c=>c.id!==editing);
  save();
  closeModal();
  renderSaman();
};

act.bulk=()=>modal(`<h2>Bolkar saman jodo</h2>
<p class="mut">Jaise: <i>namak 28 rupay kilo, maggi 14 rupay packet</i></p>
<textarea id="bk" rows="3"></textarea>
<div class="row"><button class="mic" data-idle="🎤 Bolo" data-on="⏹ Sun raha hoon…" data-a="fillmic" data-v="bk">🎤 Bolo</button><button class="primary" data-a="bulkAdd">Jodo</button></div>`);

act.bulkAdd=()=>{
  const items=parseCatalog($('#bk').value);
  if(!items.length)return toast('Samajh nahi aaya. Aise bolo: namak 28 rupay kilo');
  const added=addItems(items);
  save();
  closeModal();
  renderSaman();
  toast(`${added} naye saman jude, ${items.length-added} ke rate badle`);
};
