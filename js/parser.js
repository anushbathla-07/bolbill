import {norm,titleCase,lev,fuzzy,NUM,MULT,UNITS,UNIT_INFO,ITEM_FAM,CUR,KW,FILL} from './words.js';

const isNum=k=>/^\d+(\.\d+)?$/.test(k);
const round3=n=>Math.round(n*1000)/1000;

function readNumber(K,start){
  let total=0,cur=0,count=0,j=start;
  while(j<K.length){
    const k=K[j];
    const digit=isNum(k),word=NUM[k]!==undefined,mult=MULT[k]!==undefined;
    if(!digit&&!word&&!mult)break;
    if(mult){
      cur=(cur||1)*MULT[k];
      if(MULT[k]>=1000){total+=cur;cur=0}
    }else if(count===0){
      cur=digit?parseFloat(k):NUM[k];
    }else{
      if(digit)break;
      const v=NUM[k];
      const afterHundred=cur>0&&cur%100===0&&Number.isInteger(v)&&v<100;
      const afterThousand=cur===0&&total>0&&Number.isInteger(v)&&v<1000;
      if(afterHundred||afterThousand)cur+=v;
      else break;
    }
    count++;
    j++;
  }
  return count?{v:total+cur,next:j}:null;
}

export function tokenize(text,catalog=false){
  const raw=String(text||'').toLowerCase()
    .replace(/[०-९]/g,d=>'०१२३४५६७८९'.indexOf(d))
    .replace(/₹/g,' rupay ')
    .replace(/[,;\n\r।|]+/g,' § ')
    .replace(/[?!"'“”‘’()\[\]{}:\-–—_\/\\*#@]/g,' ')
    .replace(/(\d)([^\d\s.§])/g,'$1 $2')
    .replace(/([^\d\s.§])(\d)/g,'$1 $2')
    .split(/\s+/).map(x=>x.replace(/^\.+|\.+$/g,'')).filter(Boolean);
  const K=raw.map(r=>r==='§'||isNum(r)?r:norm(r));
  const S=[],kws=[],amts=[];
  let pending=false;
  for(let i=0;i<raw.length;){
    const k=K[i];
    if(k==='§'){S.push({t:'sep'});pending=false;i++;continue}
    if(!k){i++;continue}
    const n=readNumber(K,i);
    if(n){
      if(pending&&!catalog)amts.push(n.v);
      else S.push({t:'num',v:n.v,price:pending&&catalog});
      pending=false;
      i=n.next;
      continue;
    }
    if(CUR.has(k)){
      const prev=S[S.length-1];
      if(prev?.t==='num'){
        if(catalog)prev.price=true;
        else{S.pop();amts.push(prev.v)}
      }else pending=true;
      i++;
      continue;
    }
    if(UNITS[k])S.push({t:'unit',u:UNITS[k]});
    else if(KW[k])kws.push({k:KW[k],pos:S.length});
    else if(FILL.has(k)){i++;continue}
    else S.push({t:'w',raw:raw[i],key:k});
    if(!KW[k])pending=false;
    i++;
  }
  return {S,kws,amts};
}

function buildIndex(catalog){
  const list=[];
  for(const item of catalog){
    for(const name of [item.name,...(item.aliases||[])]){
      const parts=String(name).split(/\s+/).map(norm).filter(Boolean);
      if(parts.length)list.push({id:item.id,parts});
    }
  }
  return list.sort((a,b)=>b.parts.length-a.parts.length);
}

function matchItem(S,i,index){
  let best=null;
  for(const e of index){
    const len=e.parts.length;
    if(best&&len<best.len)break;
    if(i+len>S.length)continue;
    let dist=0,ok=true;
    for(let q=0;q<len&&ok;q++){
      const t=S[i+q];
      ok=t.t==='w'&&fuzzy(t.key,e.parts[q]);
      if(ok&&t.key!==e.parts[q])dist+=lev(t.key,e.parts[q]);
    }
    if(ok&&(!best||dist<best.dist))best={id:e.id,len,dist};
  }
  return best;
}

export function parseBill(text,catalog,custNames=[]){
  const {S,kws,amts}=tokenize(text);
  const index=buildIndex(catalog);
  const T=[],map=[];
  for(let i=0;i<S.length;){
    map[i]=T.length;
    const m=S[i].t==='w'&&matchItem(S,i,index);
    if(m){
      for(let q=1;q<m.len;q++)map[i+q]=T.length;
      T.push({t:'item',id:m.id});
      i+=m.len;
    }else T.push(S[i++]);
  }
  map[S.length]=T.length;

  const groups=[];
  for(let i=0;i<T.length;i++){
    if(T[i].t==='num'){
      const u=T[i+1]?.t==='unit'?T[i+1].u:null;
      groups.push({s:i,e:u?i+1:i,n:T[i].v,u,used:false});
      if(u)i++;
    }else if(T[i].t==='unit')groups.push({s:i,e:i,n:1,u:T[i].u,used:false});
  }

  const lines=new Map();
  T.forEach((t,k)=>{
    if(t.t!=='item')return;
    const g=groups.find(x=>!x.used&&x.e===k-1)||groups.find(x=>!x.used&&x.s===k+1);
    if(g)g.used=true;
    const item=catalog.find(c=>c.id===t.id);
    let qty=1,mismatch=false;
    if(g&&!g.u)qty=g.n;
    else if(g){
      const unit=UNIT_INFO[g.u];
      if(unit.fam===ITEM_FAM[item.unit])qty=round3(g.n*unit.f);
      else{qty=g.n;mismatch=true}
    }
    const line=lines.get(t.id);
    if(line){
      line.qty=round3(line.qty+qty);
      line.assumed=line.assumed&&!g;
      line.mismatch=line.mismatch||mismatch;
    }else lines.set(t.id,{id:t.id,qty,assumed:!g,mismatch});
  });

  let amount=amts.length?amts[amts.length-1]:null;
  const left=groups.filter(g=>!g.used);
  if(amount==null&&left.length===1&&!left[0].u&&left[0].e===T.length-1){
    amount=left[0].n;
    left[0].used=true;
  }

  let customer='';
  const words=T.filter(t=>t.t==='w');
  for(const w of words){
    const known=custNames.find(c=>fuzzy(w.key,norm(c.split(/\s+/)[0])));
    if(known){customer=known;w.used=true;break}
  }
  if(!customer){
    for(const kw of kws){
      if(kw.k==='jama')continue;
      const p=map[kw.pos];
      const pick=[T[p-1],T[p]].find(t=>t?.t==='w'&&!t.used);
      if(pick){customer=titleCase(pick.raw);pick.used=true;break}
    }
  }

  const unknown=words.filter(t=>!t.used).map(t=>t.raw);
  for(const g of groups)if(!g.used)unknown.push(g.n+(g.u?' '+g.u:''));
  return {lines:[...lines.values()],amount,udhaar:kws.some(k=>k.k==='udhaar'),customer,unknown};
}

export function parseLedger(text,custNames=[]){
  const {S,kws,amts}=tokenize(text);
  const nums=S.filter(t=>t.t==='num');
  const amount=amts.length?amts[amts.length-1]:(nums[0]?.v??null);
  const words=S.filter(t=>t.t==='w');
  let name='';
  for(const w of words){
    name=custNames.find(c=>fuzzy(w.key,norm(c.split(/\s+/)[0])))||'';
    if(name)break;
  }
  if(!name&&words.length)name=titleCase(words[0].raw);
  return {amount,name,kind:kws.some(k=>k.k==='udhaar')?'udhaar':'jama'};
}

export function parseCatalog(text){
  const {S}=tokenize(text,true);
  const unitOf=u=>({kg:'kg',g:'kg',pav:'kg',l:'l',ml:'l'}[u]||'pcs');
  const out=[];
  let name=[],price=null,unit=null;
  const flush=()=>{
    if(name.length&&price!=null)out.push({name:titleCase(name.join(' ')),price,unit:unit||'pcs',aliases:[]});
    name=[];price=null;unit=null;
  };
  for(let i=0;i<S.length;i++){
    const t=S[i];
    if(t.t==='sep')flush();
    else if(t.t==='w'){
      if(price!=null)flush();
      name.push(t.raw);
    }else if(t.t==='num'){
      if(S[i+1]?.t==='unit'&&!t.price&&t.v<=1){unit=unitOf(S[i+1].u);i++}
      else if(price==null)price=t.v;
    }else if(t.t==='unit')unit=unitOf(t.u);
  }
  flush();
  return out;
}
