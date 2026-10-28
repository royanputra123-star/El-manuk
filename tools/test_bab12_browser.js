#!/usr/bin/env node
// Optional dev tools: npm install --prefix /tmp/nihongo-test playwright @sparticuz/chromium
// NODE_PATH=/tmp/nihongo-test/node_modules node tools/test_bab12_browser.js
// Serve repository first, e.g. python3 -m http.server 8000 --bind 0.0.0.0
const assert=require('assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const module=require('@sparticuz/chromium');const bundled=module.default||module;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||await bundled.executablePath(),args:bundled.args,headless:true});
 try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8000');
 await page.evaluate(()=>{AudioManager.isSupported=()=>false;AudioManager.stopAudio=()=>{};for(const k of Object.keys(SoundFx))if(typeof SoundFx[k]==='function')SoundFx[k]=()=>{};});
 assert.match(await page.locator('#hero-badge-ch').textContent(),/Bab 12/);
 await page.locator('#btn-go-map').click();assert.equal(await page.locator('.map-level-tile').count(),30);
 await page.locator('.map-level-tile').first().click();
 // Drive the actual application controller through every answer and all result screens.
 const completed=await page.evaluate(()=>{
  let n=0;const levels=window.LEVELS_BAB12_DATA;
  for(const level of levels){
   for(const q of level.questions){
    const body=document.getElementById('quiz-body');
    if(Array.isArray(q.answer)){
     for(const token of q.answer){const b=[...body.querySelectorAll('.tile-bank-zone .tile')].find(b=>b.textContent===token&&!b.disabled);if(!b)throw Error('Missing tile '+q.id+' '+token);b.click();}
    }else {const b=[...body.querySelectorAll('.option-btn')].find(b=>b.textContent===q.answer);if(!b)throw Error('Missing option '+q.id);b.click();}
    const check=document.getElementById('btn-quiz-check');if(check.disabled)throw Error('Disabled check '+q.id);check.click();
    if(!document.getElementById('quiz-feedback').classList.contains('feedback-correct'))throw Error('Incorrect key '+q.id);
    if(!document.getElementById('quiz-feedback').textContent.includes(q.explanation))throw Error('Missing explanation '+q.id);
    check.click();n++;
   }
   if(!document.getElementById('screen-result').classList.contains('active'))throw Error('No result '+level.level);
   const p=StorageManager.getProgress();if(p.levelsDone.bab12[level.level]!==100)throw Error('Score '+level.level);
   if(level.level<30)document.getElementById('btn-result-next').click();
  }
  return n;
 });assert.equal(completed,450);
 await page.reload();assert.match(await page.locator('#continue-level-title').textContent(),/Level 30/);
 assert.equal(await page.evaluate(()=>Object.keys(StorageManager.getProgress().levelsDone.bab12).length),30);
 // Every chapter remains navigable; material only belongs to Bab 12.
 for(const [ch,count] of [['bab11',30],['bab10',50],['bab9',50],['bab8',50],['bab7',50]]){
  await page.locator('#btn-chap-'+ch).click();assert(await page.locator('#bab12-material').isHidden());
  await page.locator('#btn-go-map').click();assert.equal(await page.locator('.map-level-tile').count(),count);
  await page.locator('.map-level-tile').first().click();assert(await page.locator('#quiz-body .q-block').isVisible());
  page.once('dialog',d=>d.accept());await page.locator('#btn-quiz-exit').click();
 }
 // Legacy progress migration preserves chapter, scores and XP.
 const migration=await page.evaluate(()=>{
  localStorage.setItem('nihongo_app_progress_v2',JSON.stringify({activeChapter:'bab8',xp:123,levelsDone:{bab8:{1:80}},lastLevel:{bab8:2},history:[],badges:[]}));
  const p=StorageManager.getProgress();return {chapter:p.activeChapter,xp:p.xp,old:p.levelsDone.bab8[1],newCount:Object.keys(p.levelsDone.bab12).length,newLevel:p.lastLevel.bab12};
 });assert.deepEqual(migration,{chapter:'bab8',xp:123,old:80,newCount:0,newLevel:1});
 // Wrong-answer path for each supported type, using real renderer.
 const wrongs=await page.evaluate(()=>{
  const qs=LEVELS_BAB12_DATA.flatMap(l=>l.questions),types=[...new Set(qs.map(q=>q.type))];
  for(const type of types){const q=qs.find(q=>q.type===type),host=document.createElement('div');document.body.appendChild(host);const c=QuestionRenderer.renderQuestion(host,q);
   if(Array.isArray(q.answer)){for(const t of [...q.answer].reverse()){const b=[...host.querySelectorAll('.tile-bank-zone .tile')].find(b=>b.textContent===t);b.click();}}
   else [...host.querySelectorAll('.option-btn')].find(b=>b.textContent!==q.answer).click();
   if(!c.isComplete()||c.checkCorrect())throw Error('Wrong-answer validation '+type);c.reveal(false);c.onExit();host.remove();
  }return types.length;
 });assert.equal(wrongs,6);
 await page.reload();await page.locator('#btn-chap-bab12').click();
 for(const width of [360,390,768,1280]){
  await page.setViewportSize({width,height:850});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`Horizontal overflow ${width}`);
  assert(await page.locator('#btn-chap-bab12').isVisible());
  await page.locator('#bab12-material summary').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`Material overflow ${width}`);
  await page.locator('#bab12-material summary').click();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 450 real UI answers, 30 results/progress, reload, 5 old chapters, migration, 6 incorrect-answer paths, responsive 360/390/768/1280.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
