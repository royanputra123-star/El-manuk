#!/usr/bin/env node
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['levels_bab12','vocab_bab12'])vm.runInContext(fs.readFileSync(path.join(root,'js/data',f+'.js'),'utf8'),ctx);
const levels=ctx.window.LEVELS_BAB12_DATA,words=ctx.window.VOCAB_BAB12_DATA;
const ref=fs.readFileSync(path.join(__dirname,'reference/kotoba_bab1-12.txt'),'utf8').replace(/\s/g,'');
assert(!ref.includes('第十三課'));
for(const w of words)assert(ref.includes(w.jp)||ref.includes(w.kana),`Outside PDF: ${w.jp}`);
// Particles, inflections, and grammar prescribed by the request, not extra content words.
const grammar=['のほうが','のなかで','いちばん','どこ','この','どう','でしたか','ですか','だった','かった','くなかった','くない','ではありませんでした','ではありません','ありません','でした','です','より','どちらも','どちら','は','の','が','と','も','か','？','。','、','よ'];
const dictionary=[...words.flatMap(w=>[w.jp,w.kana,...(w.jp.endsWith('い')?[w.jp.slice(0,-1),w.kana.slice(0,-1)]:[])]),...grammar].sort((a,b)=>b.length-a.length);
function checkJP(text,id){const s=text.replace(/\s|＿＿＿/g,'');const memo=new Map();function ok(i){if(i===s.length)return true;if(memo.has(i))return memo.get(i);const valid=dictionary.some(t=>t&&s.startsWith(t,i)&&ok(i+t.length));memo.set(i,valid);return valid;}assert(ok(0),`${id}: unapproved Japanese: ${s}`);}
const ids=new Set(),sentences=new Set(),counts={},topics={};
assert.equal(levels.length,30);
let total=0,casual=0;
for(const [i,l] of levels.entries()){
 assert.equal(l.level,i+1);assert.equal(l.questions.length,15);assert(l.focus);
 for(const q of l.questions){
  total++;assert.equal(q.id,`q_b12_${total}`);assert(!ids.has(q.id));ids.add(q.id);
  assert(!sentences.has(q.fullJp),`Duplicate sentence ${q.id}`);sentences.add(q.fullJp);
  assert(q.translation&&q.explanation&&q.reading&&q.instruction);
  assert(!/[\u4e00-\u9fff]/.test(q.reading),q.id+' missing kana');
  counts[q.type]=(counts[q.type]||0)+1;topics[q.topic]=(topics[q.topic]||0)+1;
  if(q.casual)casual++;
  checkJP(q.fullJp,q.id);checkJP(q.reading,q.id);
  if(q.options){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(q.options.includes(q.answer));q.options.forEach(s=>checkJP(s,q.id));}
  if(q.type==='complete')assert.equal(q.prompt.split('＿＿＿').length,2);
  if(Array.isArray(q.answer)){assert.equal(q.tiles.length,q.answer.length);assert.deepEqual([...q.tiles].sort(),[...q.answer].sort());assert.equal(q.answer.join(''),q.fullJp);}
  if(q.type==='listening')assert.equal(q.audioText,q.answer.join(''));
  if(q.type==='short_conversation'){assert.equal(q.dialogue.length,2);assert(q.answerId&&q.dialogueId.length===2);assert.equal(q.dialogue.map(d=>d.text.replace('＿＿＿',q.answer)).join(''),q.fullJp);}
 }
}
assert.equal(total,450);assert(casual>=23&&casual<=45);
for(const topic of ['bentuk','より','どちら','いちばん'])assert(topics[topic]>=75);
const TIME_WORDS=['おととい','昨日','今日','明日','あさって','今朝','今晩','毎朝','毎晩','毎日','先週','今週','来週','先月','今月','来月','去年','今年','来年'];
const PAST_TIME=new Set(['おととい','昨日','今朝','先週','先月','去年']);
const NONPAST_TIME=new Set(['明日','あさって','来週','来月','来年','毎朝','毎晩','毎日','今晩']);
const timeCounts=Object.fromEntries(TIME_WORDS.map(t=>[t,0]));
const timeByType={}, timeByBand=Array.from({length:6},()=>new Set());
const mcPos={0:0,1:0,2:0,3:0};
const topicTime=jp=>{const m=String(jp).match(/^(おととい|あさって|昨日|今日|明日|今朝|今晩|毎朝|毎晩|毎日|先週|今週|来週|先月|今月|来月|去年|今年|来年)/);return m?m[1]:null;};
const predPast=jp=>/でした|だった|かった/.test(jp);
for(const [i,l] of levels.entries()){
  for(const q of l.questions){
    const jp=q.fullJp||'';
    for(const t of TIME_WORDS) if(jp.includes(t)){timeCounts[t]++; timeByBand[Math.floor(i/5)].add(t); (timeByType[q.type]||=new Set()).add(t);}
    if(q.options){assert.equal(q.options.filter(o=>o===q.answer).length,1); mcPos[q.options.indexOf(q.answer)]++;}
    if(q.topic==='bentuk'||q.topic==='kasual'){
      const time=topicTime(jp);
      if(time){
        const past=predPast(jp);
        assert(!(PAST_TIME.has(time)&&!past), `${q.id} past time + non-past form: ${jp}`);
        assert(!(NONPAST_TIME.has(time)&&past), `${q.id} non-past time + past form: ${jp}`);
      }
    }
  }
}
for(const t of TIME_WORDS) assert(timeCounts[t]>=3, `Time signal underused: ${t} ${timeCounts[t]}`);
for(const type of Object.keys(counts)) assert((timeByType[type]||new Set()).size>=8, `Time signals missing from type ${type}`);
for(const [b,set] of timeByBand.entries()) assert(set.size>=6, `Time signals not spread in band ${b+1}: ${set.size}`);
const mcN=Object.values(mcPos).reduce((a,b)=>a+b,0);
for(const v of Object.values(mcPos)) assert(Math.abs(v-mcN/4)<=Math.ceil(mcN*0.08)+2, `Unbalanced MC ${JSON.stringify(mcPos)}`);
// Source and bank must remain deterministic when regenerated (run separately in CI/manual).
console.log(JSON.stringify({levels:levels.length,questions:total,casual,casualPercent:casual/total*100,types:counts,topics,vocabulary:words.length,uniqueSentences:sentences.size,timeCounts,timeByBand:timeByBand.map(s=>s.size),mcPos},null,2));
console.log('PASS: schema, answers, kana, exact duplicates, PDF content-word whitelist + explicit grammar, time signals.');
