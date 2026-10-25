export const $=s=>document.querySelector(s);
export const act={},chg={},inp={};

const hit=(e,key)=>e.target.closest(`[data-${key}]`);

document.addEventListener('click',e=>{
  if(e.target.classList.contains('ov'))return closeModal();
  const el=hit(e,'a');
  if(el&&act[el.dataset.a])act[el.dataset.a](el.dataset.v,el);
});

document.addEventListener('change',e=>{
  const el=hit(e,'c');
  if(el&&chg[el.dataset.c])chg[el.dataset.c](el.value,el,el.dataset.v);
});

document.addEventListener('input',e=>{
  const el=hit(e,'i');
  if(el&&inp[el.dataset.i])inp[el.dataset.i](el.value,el,el.dataset.v);
});

export const modal=html=>{$('#modal').innerHTML=`<div class="ov"><div class="sheet">${html}</div></div>`};
export const closeModal=()=>{$('#modal').innerHTML=''};
act.close=closeModal;

let timer;
export function toast(msg){
  const el=$('#toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(timer);
  timer=setTimeout(()=>el.classList.remove('show'),2800);
}

export function waLink(text,phone=''){
  let p=phone.replace(/\D/g,'');
  if(p.length===10)p='91'+p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
