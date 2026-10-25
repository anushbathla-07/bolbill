import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseBill,parseLedger,parseCatalog} from '../js/parser.js';
import {STARTER} from '../js/starter.js';

const catalog=STARTER.map(([name,aliases,price,unit],i)=>({id:'i'+i,name,aliases:aliases.split(','),price,unit}));

function bill(text,customers=[]){
  const p=parseBill(text,catalog,customers);
  const items=p.lines.map(l=>[catalog.find(c=>c.id===l.id).name,l.qty]);
  return {...p,items};
}

test('hinglish bill with amount',()=>{
  const p=bill('2 kilo chawal, 1 tel, 450 rupay');
  assert.deepEqual(p.items,[['Chawal',2],['Refined Tel',1]]);
  assert.equal(p.amount,450);
});

test('works without commas',()=>{
  assert.equal(bill('2 kilo chawal 1 tel 450 rupay').items.length,2);
});

test('devanagari number words',()=>{
  const p=bill('दो किलो चावल एक तेल चार सौ पचास रुपये');
  assert.deepEqual(p.items,[['Chawal',2],['Refined Tel',1]]);
  assert.equal(p.amount,450);
});

test('item before quantity',()=>{
  const p=bill('chawal 2 kilo tel 1 litre cheeni aadha kilo');
  assert.deepEqual(p.items,[['Chawal',2],['Refined Tel',1],['Cheeni',0.5]]);
});

test('unit conversion',()=>{
  const p=bill('dedh kilo aata paanch sau gram namak');
  assert.deepEqual(p.items,[['Atta',1.5],['Namak',0.5]]);
});

test('udhaar with new customer',()=>{
  const p=bill('Ramesh ke naam udhaar 1 kilo cheeni 2 maggi');
  assert.equal(p.customer,'Ramesh');
  assert.ok(p.udhaar);
  assert.equal(p.items.length,2);
});

test('known customer is matched',()=>{
  assert.equal(bill('2 kilo aloo suresh ka udhaar',['Suresh Kumar']).customer,'Suresh Kumar');
});

test('multi word alias and packets',()=>{
  const p=bill('5 parle g 3 maggi 2 packet lays 100 rupay');
  assert.deepEqual(p.items,[['Parle G',5],['Maggi',3],['Lays',2]]);
});

test('aliases merge into one line',()=>{
  assert.deepEqual(bill('1 kilo chini 2 kilo shakkar').items,[['Cheeni',3]]);
});

test('spelling variants',()=>{
  assert.equal(bill('2 kilo chaval 1 magi').items.length,2);
});

test('unknown word is reported',()=>{
  assert.ok(bill('2 kilo xyzabc chawal').unknown.includes('xyzabc'));
});

test('ledger voice',()=>{
  assert.deepEqual(parseLedger('Ramesh ne 200 diye',['Ramesh']),{amount:200,name:'Ramesh',kind:'jama'});
  assert.equal(parseLedger('सुनीता का 150 रुपये उधार').kind,'udhaar');
});

test('catalog by voice',()=>{
  const a=parseCatalog('chawal 60 rupay kilo, tel 150 rupay litre, parle g 10 rupay packet');
  assert.deepEqual(a.map(x=>[x.name,x.price,x.unit]),[['Chawal',60,'kg'],['Tel',150,'l'],['Parle G',10,'pcs']]);
  const b=parseCatalog('namak ek kilo 28 rupay maggi 14 rupay packet');
  assert.deepEqual(b.map(x=>[x.name,x.price,x.unit]),[['Namak',28,'kg'],['Maggi',14,'pcs']]);
  const c=parseCatalog('चावल साठ रुपये किलो तेल एक सौ पचास रुपये लीटर');
  assert.deepEqual(c.map(x=>[x.price,x.unit]),[[60,'kg'],[150,'l']]);
});
