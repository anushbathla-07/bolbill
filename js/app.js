import {db,save,esc,wipe,addItems,starterItems} from './store.js';
import {$,act,chg,modal,closeModal,toast} from './ui.js';
import './voice.js';
import {renderOnboard} from './onboard.js';
import {renderBill} from './bill.js';
import {renderSaman} from './saman.js';
import {renderUdhaar} from './udhaar.js';
import {renderHisaab} from './hisaab.js';

const views={bill:renderBill,saman:renderSaman,udhaar:renderUdhaar,hisaab:renderHisaab};
const tabs=[['bill','🎙️','Bill'],['saman','📦','Saman'],['udhaar','📒','Udhaar'],['hisaab','📊','Hisaab']];
let tab='bill';

function shell(){
  $('#app').innerHTML=`<header><b>🎙️ ${esc(db.shop||'BolBill')}</b><button class="gear" data-a="settings">⚙️</button></header>
<main id="main"></main>
<nav>${tabs.map(([k,icon,label])=>`<button class="${k===tab?'on':''}" data-a="tab" data-v="${k}"><span>${icon}</span>${label}</button>`).join('')}</nav>`;
  views[tab]();
}

act.tab=v=>{tab=v;shell()};

act.settings=()=>modal(`<h2>⚙️ Settings</h2>
<label>Dukaan ka naam</label><input id="sShop" value="${esc(db.shop)}">
<label>Bolne ki bhasha</label>
<select id="sLang"><option value="hi-IN" ${db.lang==='hi-IN'?'selected':''}>Hindi / Hinglish</option><option value="en-IN" ${db.lang==='en-IN'?'selected':''}>English (India)</option></select>
<label><input type="checkbox" id="sSpeak" style="width:auto" ${db.speak?'checked':''}> Total bolkar batao</label>
<button class="primary big" data-a="saveSettings">Save</button>
<h3 style="margin-top:16px">Data</h3>
<div class="row"><button class="ghost" data-a="backup">⬇️ Backup</button><button class="ghost" data-a="pickFile">⬆️ Restore</button></div>
<input type="file" id="rf" accept=".json" data-c="restore" hidden>
<div class="row"><button class="ghost" data-a="starter">⚡ Ready list jodo</button><button class="danger" data-a="wipe">🗑 Sab mita do</button></div>
<p class="mut">Sab data sirf is browser me hai. Hafte me ek baar Backup le lo.</p>
<button class="ghost big" data-a="close">Band karo</button>`);

act.saveSettings=()=>{
  db.shop=$('#sShop').value.trim();
  db.lang=$('#sLang').value;
  db.speak=$('#sSpeak').checked;
  save();
  closeModal();
  shell();
};

act.backup=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));
  a.download=`bolbill-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
};

act.pickFile=()=>$('#rf').click();

chg.restore=(_,el)=>{
  const file=el.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!data.catalog)throw new Error('bad file');
      Object.assign(db,data);
      save();
      closeModal();
      shell();
      toast('Restore ho gaya');
    }catch{toast('File sahi nahi hai')}
  };
  reader.readAsText(file);
};

act.starter=()=>{
  addItems(starterItems());
  save();
  closeModal();
  views[tab]();
  toast('Ready list judi');
};

act.wipe=()=>{
  if(!confirm('Pura data (saman, bill, udhaar) hat jayega. Pakka?'))return;
  wipe();
  location.reload();
};

if(db.onboarded)shell();
else renderOnboard(shell);
