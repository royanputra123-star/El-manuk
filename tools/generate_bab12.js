#!/usr/bin/env node
// Deterministic Bab 12 authoring. Only curated PDF vocabulary + grammar morphemes.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(__dirname, 'reference/kotoba_bab1-12.txt'), 'utf8');
const words = `
先生|せんせい|guru
綺麗|きれい|indah
休み|やすみ|hari libur
だれ|だれ|siapa
本|ほん|buku
辞書|じしょ|kamus
雑誌|ざっし|majalah
新聞|しんぶん|koran
ノート|ノート|buku catatan
時計|とけい|jam
傘|かさ|payung
かばん|かばん|tas
テレビ|テレビ|televisi
カメラ|カメラ|kamera
車|くるま|mobil
机|つくえ|meja
椅子|いす|kursi
チョコレート|チョコレート|cokelat
コーヒー|コーヒー|kopi
日本語|にほんご|bahasa Jepang
英語|えいご|bahasa Inggris
教室|きょうしつ|ruang kelas
食堂|しょくどう|kantin
事務所|じむしょ|kantor
部屋|へや|kamar
会社|かいしゃ|perusahaan
靴|くつ|sepatu
図書館|としょかん|perpustakaan
昨日|きのう|kemarin
今日|きょう|hari ini
今朝|けさ|tadi pagi
先週|せんしゅう|minggu lalu
先月|せんげつ|bulan lalu
去年|きょねん|tahun lalu
学校|がっこう|sekolah
駅|えき|stasiun
飛行機|ひこうき|pesawat
電車|でんしゃ|kereta
新幹線|しんかんせん|Shinkansen
バス|バス|bus
タクシー|タクシー|taksi
自転車|じてんしゃ|sepeda
家族|かぞく|keluarga
父|ちち|ayah saya
母|はは|ibu saya
兄|あに|kakak laki-laki saya
姉|あね|kakak perempuan saya
弟|おとうと|adik laki-laki saya
妹|いもうと|adik perempuan saya
パン|パン|roti
卵|たまご|telur
肉|にく|daging
魚|さかな|ikan
野菜|やさい|sayuran
果物|くだもの|buah
水|みず|air
お茶|おちゃ|teh Jepang
紅茶|こうちゃ|teh hitam
牛乳|ぎゅうにゅう|susu
ジュース|ジュース|jus
映画|えいが|film
店|みせ|toko
レストラン|レストラン|restoran
宿題|しゅくだい|PR
テニス|テニス|tenis
サッカー|サッカー|sepak bola
花|はな|bunga
シャツ|シャツ|kemeja
荷物|にもつ|barang bawaan
静か|しずか|tenang
にぎやか|にぎやか|ramai
有名|ゆうめい|terkenal
親切|しんせつ|baik hati
元気|げんき|sehat
暇|ひま|senggang
便利|べんり|praktis
大きい|おおきい|besar
小さい|ちいさい|kecil
新しい|あたらしい|baru
古い|ふるい|lama
いい|いい|baik
悪い|わるい|buruk
暑い|あつい|panas (cuaca)
寒い|さむい|dingin (cuaca)
冷たい|つめたい|dingin
難しい|むずかしい|sulit
易しい|やさしい|mudah
高い|たかい|mahal
安い|やすい|murah
面白い|おもしろい|menarik
おいしい|おいしい|enak
忙しい|いそがしい|sibuk
楽しい|たのしい|menyenangkan
白い|しろい|putih
黒い|くろい|hitam
赤い|あかい|merah
青い|あおい|biru
町|まち|kota
食べ物|たべもの|makanan
仕事|しごと|pekerjaan
好き|すき|disukai
上手|じょうず|mahir
料理|りょうり|masakan
スポーツ|スポーツ|olahraga
音楽|おんがく|musik
りんご|りんご|apel
みかん|みかん|jeruk
アイスクリーム|アイスクリーム|es krim
簡単|かんたん|mudah
近い|ちかい|dekat
遠い|とおい|jauh
速い|はやい|cepat
遅い|おそい|lambat
暖かい|あたたかい|hangat
涼しい|すずしい|sejuk
甘い|あまい|manis
辛い|からい|pedas
重い|おもい|berat
軽い|かるい|ringan
季節|きせつ|musim
春|はる|musim semi
夏|なつ|musim panas
秋|あき|musim gugur
冬|ふゆ|musim dingin
天気|てんき|cuaca
雨|あめ|hujan
雪|ゆき|salju
曇り|くもり|mendung
ホテル|ホテル|hotel
空港|くうこう|bandara
海|うみ|laut
世界|せかい|dunia
パーティー|パーティー|pesta
お祭り|おまつり|festival
試験|しけん|ujian
すき焼き|すきやき|sukiyaki
刺身|さしみ|sashimi
おすし|おすし|sushi
てんぷら|てんぷら|tempura
どちら|どちら|yang mana (dua pilihan)
どちらも|どちらも|keduanya
何|なに|apa
いつ|いつ|kapan
`.trim().split('\n').map((s,i)=> { const [jp,kana,id_mean]=s.split('|'); return {id:`b12_v${i+1}`,jp:jp==='椅子'?'いす':jp,kana,id_mean,type:'word',lesson:12}; });
// PDF orthography/reading must occur before Lesson 13 (normalise typography only).
const compact=s=>s.replace(/\s/g,'');
for(const w of words) if(!compact(source).includes(compact(w.jp))&&!compact(source).includes(compact(w.kana))) throw Error(`Not in PDF: ${w.jp}`);
const dict=Object.fromEntries(words.map(w=>[w.jp,w]));
const mean=w=>dict[w]?.id_mean||w;
const na=new Set(['静か','にぎやか','有名','親切','元気','暇','便利','好き','上手','簡単','綺麗']);
function form(a,t){if(na.has(a)||!a.endsWith('い'))return a+['です','でした','ではありません','ではありませんでした'][t];const stem=a==='いい'?'よ':a.slice(0,-1);return [a+'です',stem+'かったです',stem+'くないです',stem+'くなかったです'][t];}
const tense=['sekarang positif','lampau positif','sekarang negatif','lampau negatif'];
const formRule=a=>na.has(a)||!a.endsWith('い')?'Kata sifat な dan kata benda memakai です／でした／ではありません／ではありませんでした.':`Kata sifat い: lepas い lalu tambahkan かった／くない／くなかった, diikuti です.${a==='いい'?' Pengecualian いい memakai dasar よ-.':''}`;
const records=[],seen=new Set();
function add(tokens,translation,topic,explanation,slot,choices,extra={}){const jp=tokens.join('');if(seen.has(jp))return false;seen.add(jp);records.push({tokens,translation,topic,explanation,slot,choices,...extra});return true;}
const contexts=[['天気','寒い'],['天気','暑い'],['部屋','暖かい'],['部屋','涼しい'],['水','冷たい'],['コーヒー','甘い'],['料理','辛い'],['試験','難しい'],['宿題','易しい'],['試験','簡単'],['映画','面白い'],['パーティー','楽しい'],['仕事','忙しい'],['ホテル','静か'],['町','にぎやか'],['父','元気'],['母','暇'],['店','便利'],['荷物','重い'],['かばん','軽い'],['車','新しい'],['時計','古い'],['教室','大きい'],['部屋','小さい'],['シャツ','白い'],['靴','黒い'],['花','赤い'],['シャツ','青い'],['料理','おいしい'],['カメラ','高い'],['辞書','安い'],['天気','いい'],['天気','悪い'],['ホテル','有名'],['店','近い'],['空港','遠い'],['先生','親切'],['駅','便利'],['図書館','静か'],['海','綺麗']].filter(([n,a])=>dict[n]&&dict[a]);
// 150 unique time/state contexts, balanced across adjective classes and noun predicates.
for(let t=0;t<4;t++) for(let i=0;i<contexts.length;i++){
 const [n,a]=contexts[i],time=t%2?'昨日':'今日',f=form(a,t);
 add([time+'の',n+'は',f+'。'],`${mean(n)} ${time==='昨日'?'kemarin':'hari ini'} ${t>=2?'tidak ':''}${mean(a)}.`, 'bentuk',formRule(a)+` Target: ${tense[t]}.`,2,[0,1,2,3].map(x=>form(a,x)+'。'),{targetTense:t});
}
// Noun predicates are deliberately explicit, not adjective-only conjugation.
for(const [n,a] of [['昨日','雨'],['昨日','雪'],['昨日','曇り'],['今日','休み'],['昨日','休み'],['昨日','パーティー']]){

 for(const t of (n==='昨日'?[1,3]:[0,2])) add([n+'は',form(a,t)+'。'],`${mean(n)} ${t>=2?'bukan ':''}${mean(a)}.`, 'bentuk',formRule(a)+` Target: ${tense[t]}.`,1,[0,1,2,3].map(x=>form(a,x)+'。'),{targetTense:t});
}
const forms=records.splice(0);seen.clear();
// Pair contexts: each adjective describes the actual category naturally.
const families=[
 [['かばん','荷物','辞書','本','カメラ'],['重い','軽い']],
 [['車','自転車','時計','カメラ','テレビ'],['高い','安い','新しい','古い']],
 [['新幹線','電車','バス','タクシー','自転車'],['速い','遅い']],
 [['コーヒー','紅茶','ジュース','牛乳','水'],['冷たい']]
 ,[['チョコレート','ジュース','りんご','みかん','アイスクリーム'],['甘い']],
 [['すき焼き','刺身','おすし','てんぷら','パン'],['おいしい','高い','安い']],
 [['ホテル','図書館','学校','駅','店'],['静か','近い','便利']],
 [['日本語','英語'],['難しい','易しい']],
 [['試験','宿題'],['難しい','易しい']]
];
const pairs=[];
for(let k=0;k<5;k++)for(const [ns,as] of families)for(let j=0;j<ns.length;j++){
 const n=ns[j],b=ns[(j+k+1)%ns.length],a=as[k%as.length];if(n!==b&&!pairs.some(p=>p.join('|')===[n,b,a].join('|')))pairs.push([n,b,a]);
}
const comparison=[],choice=[],group=[];
for(const [n,b,a] of pairs){
 const f=form(a,0)+'。';
 comparison.push({tokens:[n+'は',b+'より',f],translation:`${mean(n)} lebih ${mean(a)} daripada ${mean(b)}.`,topic:'より',explanation:'N1 は N2 より sifat です: N1 memiliki sifat lebih daripada N2; より menandai pembanding.',slot:1,choices:[b+'より',b+'が',b+'も',b+'と']});
 const both=choice.length%3===0;
 const response=both?'どちらも'+f:n+'のほうが'+f;
 const rs=both?'Keduanya '+mean(a)+'.':mean(n)+' lebih '+mean(a)+'.';
 choice.push({tokens:[n+'と',b+'と', 'どちらが',form(a,0)+'か。',response],translation:`Antara ${mean(n)} dan ${mean(b)}, mana yang lebih ${mean(a)}? ${rs}`,topic:'どちら',explanation:both?'どちら menanyakan satu dari dua pilihan. どちらも berarti keduanya; tidak diikuti が.':'Jawaban N のほうが sifat です memilih satu dari dua hal yang dibandingkan.',slot:4,choices:both?[response,'どちらが'+f,'どちらと'+f,'どちらより'+f]:[response,b+'のほうが'+f,n+'より'+f,b+'より'+f],context:both?'Konteks: keduanya dinilai sama.':`Konteks: pembicara memilih ${mean(n)}.`});
}
const groups=[
 {ns:['すき焼き','刺身','おすし','てんぷら','パン','肉','魚','野菜'],a:['おいしい','高い','安い'],wh:'何'},
 {ns:['父','母','兄','姉','弟','妹'],a:['忙しい','元気','暇'],wh:'だれ'},
 {ns:['ホテル','学校','駅','図書館','店','食堂'],a:['静か','近い','便利'],wh:'どこ'},
 {ns:['春','夏','秋','冬'],a:['好き'],wh:'いつ'}
];
for(let round=0;round<12;round++)for(const g of groups){
 const i=round%g.ns.length,j=(i+1)%g.ns.length,k=(i+2)%g.ns.length,ns=[g.ns[i],g.ns[j],g.ns[k]],a=g.a[Math.floor(round/g.ns.length)%g.a.length],f=form(a,0)+'。';
 group.push({tokens:[ns.join('と')+'のなかで',g.wh+'が','いちばん',form(a,0)+'か。',ns[round%3]+'がいちばん'+f],translation:`Di antara ${ns.map(mean).join(', ')}, ${g.wh==='だれ'?'siapa':g.wh==='どこ'?'tempat mana':g.wh==='いつ'?'musim mana':'apa'} yang paling ${mean(a)}? ${mean(ns[round%3])} paling ${mean(a)}.`,topic:'いちばん',explanation:'N のなかで membatasi kelompok; kata tanya + がいちばん menanyakan yang paling. Jawaban memakai N がいちばん sifat です.',slot:1,choices:['何が','だれが','どこが','いつが'],context:`Konteks jawaban: ${mean(ns[round%3])}.`});
}
// More unique explicit subsets, not rankings asserted as universal facts.
for(const g of groups)for(let i=0;i<g.ns.length;i++)for(let j=i+1;j<g.ns.length;j++)for(let k=j+1;k<g.ns.length;k++)for(const a of g.a){
 const ns=[g.ns[i],g.ns[j],g.ns[k]],f=form(a,0)+'。';
 group.push({tokens:[ns.join('と')+'のなかで',g.wh+'が','いちばん',form(a,0)+'か。',ns[0]+'がいちばん'+f],translation:`Di antara ${ns.map(mean).join(', ')}, ${g.wh==='だれ'?'siapa':g.wh==='どこ'?'tempat mana':g.wh==='いつ'?'musim mana':'apa'} yang paling ${mean(a)}? ${mean(ns[0])} paling ${mean(a)}.`,topic:'いちばん',explanation:'のなかで menentukan kelompok. が menandai subjek; いちばん berarti paling. Pilih kata tanya sesuai kategori.',slot:1,choices:['何が','だれが','どこが','いつが'],context:`Konteks jawaban: ${mean(ns[0])}.`});
}
function unique(pool){const seen=new Set();return pool.filter(r=>{let s=r.tokens.join('');if(seen.has(s))return false;seen.add(s);return true;});}
// First bands balanced by tense rather than blocks of the same conjugation.
const balanced=[];for(let i=0;i<forms.length;i++) {const r=forms[(i%4)*contexts.length+Math.floor(i/4)];if(r&&!balanced.includes(r))balanced.push(r);}for(const r of forms)if(!balanced.includes(r))balanced.push(r);
// Ensure noun predicates appear before finishing level 10.
const nouns=forms.filter(r=>r.tokens.length===2);for(let i=0;i<nouns.length;i++){const idx=14+i*13;const old=balanced[idx];balanced[idx]=nouns[i];const prev=balanced.indexOf(nouns[i],idx+1);if(prev>=0)balanced[prev]=old;}
const bands=[balanced.slice(0,75),balanced.slice(75,150),unique(comparison).slice(0,75),unique(choice).slice(0,75),unique(group).slice(0,75)];
const used=new Set(bands.flat().map(r=>r.tokens.join('')));
const mixed=[];
for(let i=0;i<30;i++){
 const [n,a]=contexts[i],past=i%2===0,casual=past?(na.has(a)?a+'だった':form(a,1).replace(/です$/,'')):a;
 mixed.push({tokens:[(past?'昨日':'今日')+'の',n+'、',casual+'？'],translation:`Apakah ${mean(n)} ${past?'kemarin':'hari ini'} ${mean(a)}? (kasual)`,topic:'kasual',explanation:'Pengenalan kasual: hilangkan です dan gunakan intonasi tanya. '+formRule(a)+' Untuk kata sifat な, lampau kasual memakai だった. Bentuk sopan tetap menjadi fokus bab.',slot:2,choices:[casual+'？',(past?a:(na.has(a)?a+'だった':form(a,1).replace(/です$/,'')))+'？',form(a,2).replace(/です$/,'')+'？',form(a,3).replace(/です$/,'')+'？'],casual:true});
}
const tails=[balanced.slice(150),unique(comparison).slice(75),unique(choice).slice(75),unique(group).slice(75)];
const remaining=[];for(let i=0;i<Math.max(...tails.map(a=>a.length));i++)for(const pool of tails)if(pool[i])remaining.push(pool[i]);
for(let i=0;mixed.length<75&&i<remaining.length;i++){const r=remaining[i];if(!used.has(r.tokens.join(''))){mixed.push(r);used.add(r.tokens.join(''));}}
// Interleave casual and polite questions in final five levels (six casual per level).
const casuals=mixed.filter(r=>r.casual),polite=mixed.filter(r=>!r.casual);bands.push(Array.from({length:75},(_,i)=>i%5<2?casuals.shift():polite.shift()));
// Curated kana replacement, conjugated stems preserved, grammar explicitly listed.
function reading(s){let out=s;for(const w of [...words].sort((a,b)=>b.jp.length-a.jp.length))if(w.jp!==w.kana){out=out.split(w.jp).join(w.kana);if(w.jp.endsWith('い'))out=out.split(w.jp.slice(0,-1)).join(w.kana.slice(0,-1));}return out;}
function rotate(a,n){n%=a.length;return a.slice(n).concat(a.slice(0,n));}
function question(r,i){
 const jp=r.tokens.join(''),type=r.casual?'complete':['complete','choose_translation','translate','arrange','listening','short_conversation'][i%6];
 const opts=[...new Set(r.choices)],correct=r.tokens[r.slot];
 if(!opts.includes(correct)||opts.length!==4)throw Error('Bad choices '+jp+' '+JSON.stringify(opts));
 const q={id:`q_b12_${i+1}`,type,instruction:'',translation:r.translation,reading:reading(jp),explanation:r.explanation,topic:r.topic,casual:!!r.casual,fullJp:jp};
 if(type==='complete')Object.assign(q,{instruction:(r.context?r.context+' ':'')+'Lengkapi bagian rumpang sesuai arti dan konteks.',prompt:r.tokens.map((t,j)=>j===r.slot?'＿＿＿':t).join(''),options:rotate(opts,i%4),answer:correct});
 else if(type==='choose_translation')Object.assign(q,{instruction:'Pilih kalimat Jepang yang sesuai arti berikut.',prompt:r.translation,options:rotate(opts.map(o=>r.tokens.map((t,j)=>j===r.slot?o:t).join('')),i%4),answer:jp});
 else if(['arrange','translate','listening'].includes(type))Object.assign(q,{instruction:type==='listening'?'Dengarkan lalu susun kalimat.':type==='translate'?'Susun terjemahan Jepang: mulai dari topik/kelompok; pertanyaan sebelum jawaban.':'Susun dari topik/kelompok, pertanyaan, lalu jawaban jika ada.',prompt:r.translation,tiles:rotate([...r.tokens].reverse(),i%r.tokens.length),answer:r.tokens,...(type==='listening'?{audioText:jp}:{})});
 else { // Cloze dialogue: context supplied so personal preference is never guessed.
 const isDialog=['どちら','いちばん'].includes(r.topic),a=isDialog?r.tokens.slice(0,-1).join(''):r.tokens.slice(0,-1).join('')+(r.targetTense%2?'どうでしたか。':'どうですか。'),b=isDialog?r.tokens.at(-1):jp;
 const responseOptions=r.topic==='いちばん'?[b,b.replace('がいちばん','はいちばん'),b.replace('がいちばん','よりいちばん'),b.replace('がいちばん','といちばん')]:r.topic==='どちら'?opts:opts.map(o=>r.tokens.map((t,j)=>j===r.slot?o:t).join(''));
 Object.assign(q,{instruction:'Baca percakapan, lalu pilih respons sesuai konteks.',dialogue:[{speaker:'A',text:a},{speaker:'B',text:'＿＿＿'}],question:(r.context||r.translation)+' Pilih respons B.',options:rotate(responseOptions,i%4),answer:b,answerId:isDialog?r.translation.split('? ').at(-1):r.translation,dialogueId:[isDialog?r.translation.split('? ')[0]+'?':'Konfirmasi sesuai konteks.',isDialog?r.translation.split('? ').at(-1):r.translation],fullJp:a+b,reading:reading(a+b)});
 }
 return q;
}
const focus=['Pengenalan bentuk sifat い／な dan kata benda','Lampau dan negatif dalam konteks waktu','Perbandingan dua hal: より','Memilih dua hal: どちら／どちらも／のほうが','Kelompok: のなかで／いちばん','Campuran dan pengenalan kasual'];
const levels=[];let id=0;
bands.forEach((band,b)=>{if(band.length!==75||band.some(r=>!r))throw Error('Insufficient band '+b);for(let l=0;l<5;l++)levels.push({level:levels.length+1,title:`Level ${levels.length+1}`,tier:b<2?'mudah':b<4?'sedang':b===4?'kalimat':'campuran',focus:focus[b],theme:'Minna no Nihongo Bab 12',questions:band.slice(l*15,l*15+15).map(r=>question(r,id++))});});
fs.writeFileSync(path.join(root,'js/data/levels_bab12.js'),'// Generated by tools/generate_bab12.js\nwindow.LEVELS_BAB12_DATA = '+JSON.stringify(levels,null,2)+';\n');
fs.writeFileSync(path.join(root,'js/data/vocab_bab12.js'),'// Curated from uploaded PDF, lessons 1–12 only.\nwindow.VOCAB_BAB12_DATA = '+JSON.stringify(words,null,2)+';\n');
module.exports={words,levels,source,form};
console.log(`Bab 12: ${levels.length} levels, ${id} questions.`);
