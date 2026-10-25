import {db} from './store.js';
import {$,act,toast} from './ui.js';

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

const ERRORS={
  'not-allowed':'Mic ki permission do',
  'service-not-allowed':'Mic permission band hai',
  'no-speech':'Kuch sunai nahi diya, phir bolo',
  'audio-capture':'Mic nahi mila',
  'network':'Speech ke liye internet chahiye'
};

let active=null,timer,stopped=false;

function light(btn,on){
  btn.classList.toggle('on',on);
  if(btn.dataset.idle)btn.innerHTML=on?btn.dataset.on:btn.dataset.idle;
}

export function listen(btn,onText){
  if(!SR)return toast('Mic ke liye Android Chrome use karo');
  if(active){stopped=true;return active.stop()}
  stopped=false;
  let done='';
  const rearm=()=>{clearTimeout(timer);timer=setTimeout(()=>{stopped=true;active?.stop()},4500)};
  const start=()=>{
    const r=new SR();
    let live='';
    r.lang=db.lang;
    r.interimResults=true;
    r.continuous=false;
    r.onresult=e=>{
      live=[...e.results].map(x=>x[0].transcript).join(' ').trim();
      onText((done+' '+live).trim(),false);
      rearm();
    };
    r.onerror=e=>{
      if(e.error==='no-speech'||e.error==='aborted')return;
      stopped=true;
      toast(ERRORS[e.error]||'Mic error: '+e.error);
    };
    r.onend=()=>{
      done=(done+' '+live).trim();
      if(!stopped)return start();
      clearTimeout(timer);
      light(btn,false);
      active=null;
      if(done)onText(done,true);
    };
    active=r;
    r.start();
  };
  light(btn,true);
  rearm();
  start();
}

export function say(text){
  if(!db.speak||!window.speechSynthesis)return;
  const u=new SpeechSynthesisUtterance(text);
  u.lang='hi-IN';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

act.fillmic=(id,btn)=>listen(btn,t=>{$('#'+id).value=t});
