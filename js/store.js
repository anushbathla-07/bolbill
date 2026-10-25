import {norm,titleCase} from './words.js';
import {STARTER} from './starter.js';

const KEY='bolbill_v1';

const load=()=>{
  try{return JSON.parse(localStorage.getItem(KEY))||{}}
  catch{return {}}
};

export const db={
  shop:'',lang:'hi-IN',speak:true,onboarded:false,
  catalog:[],customers:[],entries:[],bills:[],nextBill:1,
  ...load()
};

export const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
export const wipe=()=>localStorage.removeItem(KEY);
export const uid=()=>Math.random().toString(36).slice(2,9);
export const fmt=n=>String(Math.round(n*100)/100);
export const rs=n=>'₹'+fmt(n);
export const UNAME={kg:'kg',l:'ltr',pcs:'pcs'};

export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function stamp(ts){
  const d=new Date(ts),p=n=>String(n).padStart(2,'0');
  return `${p(d.getDate())}-${p(d.getMonth()+1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const balance=name=>db.entries.reduce((sum,e)=>e.cust===name?sum+(e.type==='udhaar'?e.amt:-e.amt):sum,0);

export function addCustomer(name){
  const clean=titleCase(name);
  let c=db.customers.find(x=>norm(x.name)===norm(clean));
  if(!c){c={name:clean,phone:''};db.customers.push(c)}
  return c.name;
}

export const starterItems=()=>STARTER.map(([name,aliases,price,unit])=>({id:uid(),name,aliases:aliases.split(','),price,unit}));

export function addItems(list){
  let added=0;
  for(const it of list){
    const old=db.catalog.find(c=>norm(c.name)===norm(it.name));
    if(old){old.price=it.price;old.unit=it.unit||old.unit}
    else{db.catalog.push({id:uid(),name:it.name,aliases:it.aliases||[],price:it.price,unit:it.unit||'pcs'});added++}
  }
  return added;
}
