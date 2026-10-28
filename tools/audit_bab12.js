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
// Source and bank must remain deterministic when regenerated (run separately in CI/manual).
console.log(JSON.stringify({levels:levels.length,questions:total,casual,casualPercent:casual/total*100,types:counts,topics,vocabulary:words.length,uniqueSentences:sentences.size},null,2));
console.log('PASS: schema, answers, kana, exact duplicates, PDF content-word whitelist + explicit grammar.');
