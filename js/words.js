const CONS={'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n','ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'f','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h','ळ':'l'};
const VOWEL={'अ':'a','आ':'a','इ':'i','ई':'i','उ':'u','ऊ':'u','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऑ':'o'};
const MATRA={'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u','े':'e','ै':'ai','ो':'o','ौ':'au','ृ':'ri','ॅ':'e','ॉ':'o'};
const NUKTA='़';
const HALANT='्';

function translit(s){
  let out='';
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(CONS[c]){
      out+=CONS[c];
      let j=i+1;
      if(s[j]===NUKTA)j++;
      const n=s[j];
      if(n===HALANT)i=j;
      else if(MATRA[n]){out+=MATRA[n];i=j}
      else{
        if(j<s.length&&/[ऀ-ॿ]/.test(n)&&n!=='।')out+='a';
        i=j-1;
      }
    }else if(VOWEL[c])out+=VOWEL[c];
    else if(c==='ं'||c==='ँ')out+='n';
    else if(c==='ः')out+='h';
    else if(!MATRA[c]&&c!==NUKTA&&c!==HALANT)out+=c;
  }
  return out;
}

export function norm(word){
  let w=String(word).toLowerCase();
  if(/[ऀ-ॿ]/.test(w))w=translit(w);
  return w.replace(/[^a-z0-9]/g,'')
    .replace(/chh/g,'ch').replace(/sh/g,'s').replace(/ph/g,'f').replace(/w/g,'v').replace(/z/g,'j')
    .replace(/ee/g,'i').replace(/oo/g,'u').replace(/([kgjtdpb])h/g,'$1').replace(/ch/g,'c')
    .replace(/([a-z])\1+/g,'$1');
}

export const titleCase=s=>String(s).trim().split(/\s+/).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');

export function lev(a,b){
  if(!a.length)return b.length;
  if(!b.length)return a.length;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const cur=[i];
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    prev=cur;
  }
  return prev[b.length];
}

export function fuzzy(a,b){
  if(a===b)return true;
  const longest=Math.max(a.length,b.length);
  if(Math.min(a.length,b.length)<3||longest<4)return false;
  const limit=longest>=8?2:1;
  return Math.abs(a.length-b.length)<=limit&&lev(a,b)<=limit;
}

const dict=pairs=>{
  const out={};
  for(const [words,value] of pairs)for(const w of words)out[norm(w)]=value;
  return out;
};

export const NUM=dict([
  [['ek','एक'],1],[['do','दो'],2],[['teen','tin','तीन'],3],[['char','chaar','चार'],4],[['panch','paanch','पांच','पाँच'],5],
  [['chhe','chhah','chah','che','chhey','छह','छः'],6],[['saat','sat','सात'],7],[['aath','ath','आठ'],8],[['nau','नौ'],9],[['das','दस'],10],
  [['gyarah','gyaarah','igyarah','ग्यारह'],11],[['barah','baarah','बारह'],12],[['terah','तेरह'],13],[['chaudah','चौदह'],14],
  [['pandrah','pandraha','पंद्रह'],15],[['solah','सोलह'],16],[['satrah','सत्रह'],17],[['atharah','अठारह'],18],[['unnis','उन्नीस'],19],
  [['bees','बीस'],20],[['ikkis','इक्कीस'],21],[['pachchis','pachis','pachees','पच्चीस'],25],
  [['tees','तीस'],30],[['chalis','chaalis','चालीस'],40],[['pachas','pachaas','पचास'],50],[['saath','साठ'],60],
  [['sattar','सत्तर'],70],[['assi','अस्सी'],80],[['nabbe','नब्बे'],90],
  [['aadha','adha','aadhi','adhi','आधा','आधी'],0.5],[['dedh','डेढ़','डेढ'],1.5],[['dhai','dhaai','ढाई'],2.5],
  [['sava','सवा'],1.25],[['pauna','पौना'],0.75]
]);

export const MULT=dict([
  [['sau','sao','सौ'],100],
  [['hazaar','hazar','hajar','हज़ार','हजार'],1000]
]);

export const UNITS=dict([
  [['kilo','kg','kilogram','kilogm','kelo','किलो','किलोग्राम','केजी'],'kg'],
  [['gram','gm','grm','ग्राम'],'g'],
  [['litre','liter','ltr','lit','लीटर','लिटर'],'l'],
  [['ml','millilitre','एमएल'],'ml'],
  [['packet','pkt','paket','packt','pack','पैकेट','पैक'],'pkt'],
  [['piece','pcs','pc','nag','पीस','नग'],'pcs'],
  [['dozen','darjan','dajan','दर्जन'],'dz'],
  [['pav','paav','pao','पाव'],'pav']
]);

export const UNIT_INFO={
  kg:{fam:'w',f:1},g:{fam:'w',f:0.001},pav:{fam:'w',f:0.25},
  l:{fam:'v',f:1},ml:{fam:'v',f:0.001},
  pkt:{fam:'c',f:1},pcs:{fam:'c',f:1},dz:{fam:'c',f:12}
};

export const ITEM_FAM={kg:'w',l:'v',pcs:'c'};

export const CUR=new Set(['rupay','rupaye','rupee','rupees','rupiya','rupaiye','rupya','ruppe','rs','inr','रुपये','रुपए','रुपया','रुपय','रूपये'].map(norm));

export const KW=dict([
  [['udhaar','udhar','uddhar','udhari','khata','khate','credit','baki','baaki','उधार','उधारी','खाता','खाते','बाकी'],'udhaar'],
  [['naam','nam','name','नाम'],'naam'],
  [['jama','jamaa','diye','diya','mile','mila','chukaya','chuka','wapas','जमा','दिए','दिये','दिया','मिले','मिला'],'jama']
]);

export const FILL=new Set(['ka','ke','ki','ko','ne','se','hai','hain','he','ho','wala','wali','aur','and','plus','or','bhi','bhaiya','bhai','ji','didi','mujhe','chahiye','chahie','dijiye','dena','dedo','de','bill','banao','bana','bnao','kar','karo','ye','yeh','wo','vo','total','kul','sab','please','pls','add','likho','likh','rakho','for','of','the','a','per','prati','rate','kya','mein','me','का','के','की','को','ने','से','है','हैं','और','भी','भाई','जी','दीजिए','चाहिए','बिल','बनाओ','दे','क्या','में'].map(norm));
