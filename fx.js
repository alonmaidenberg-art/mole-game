/* Shared extras for every game: new-best celebration, fun modes, admin panel, play-time stats.
   (c) Alon Maidenberg 2026 - please do not copy. */
(function(){
  'use strict';
  var EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  var ID=location.pathname.replace(/\/index\.html$/,'').replace(/\/+$/,'').split('/').pop()||'hub';
  var BK={flappy:'b_best',fallingblocks:'f_best',game2048:'g_best',snake:'s_best'};
  var KEY=BK[ID]||(ID+'_best');
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
  function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){}return null}

  /* ---------- time scale (slow / fast) ---------- */
  var scale=+ss('ag_scale')||1,vt=null,lr=null,raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=function(cb){return raf(function(ts){
    if(vt===null){if(scale===1)return cb(ts);vt=ts;lr=ts}
    var d=Math.min(100,ts-lr);lr=ts;vt+=d*scale;cb(vt)})};
  function setScale(s){scale=s;ss('ag_scale',String(s))}
  window.AG=window.AG||{};window.AG.setScale=setScale;

  /* ---------- visual modes ---------- */
  var st=document.createElement('style');
  st.textContent='html[data-m~=invert]{filter:invert(1) hue-rotate(180deg)}html[data-m~=gray]{filter:grayscale(1)}html[data-m~=blur]{filter:blur(1.2px)}'
   +'html[data-m~=rainbow]{animation:agr 6s linear infinite}@keyframes agr{to{filter:hue-rotate(360deg)}}html[data-m~=mirror] canvas{scale:-1 1}'
   +'#ag-panel{position:fixed;z-index:2147483600;left:8px;right:8px;top:48px;max-width:340px;max-height:80vh;overflow:auto;background:rgba(20,12,50,.96);color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:18px;padding:12px;font:600 14px system-ui,Arial,sans-serif;display:none}'
   +'#ag-panel.show{display:block}#ag-panel h3{margin:4px 0 8px;font-size:16px}#ag-panel button,#ag-panel input{font:inherit;border-radius:12px;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;padding:7px 10px;margin:3px;cursor:pointer}'
   +'#ag-panel button.on{background:#ffd23f;color:#222;border-color:#ffd23f}#ag-panel input{width:90px;cursor:text}#ag-toast{position:fixed;z-index:2147483600;left:50%;top:14%;transform:translateX(-50%);background:linear-gradient(135deg,#ffd23f,#ff8a3d);color:#222;font:900 22px system-ui,Arial,sans-serif;padding:10px 22px;border-radius:999px;box-shadow:0 6px 24px #0008;pointer-events:none;animation:agt 2.2s ease forwards}'
   +'@keyframes agt{0%{opacity:0;transform:translate(-50%,-20px) scale(.7)}15%{opacity:1;transform:translate(-50%,0) scale(1.05)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-10px)}}';
  (document.head||document.documentElement).appendChild(st);
  var modes=(ss('ag_modes')||'').split(',').filter(Boolean);
  function applyModes(){document.documentElement.setAttribute('data-m',modes.join(' '));ss('ag_modes',modes.join(','))}
  applyModes();

  /* ---------- new best: confetti + toast + small reward ---------- */
  function confetti(){
    var c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483500';
    c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);var x=c.getContext('2d'),P=[],cols=['#ff5a6a','#ffd23f','#3ddc97','#4da8ff','#82d2ff'];
    for(var i=0;i<90;i++)P.push({x:c.width/2,y:c.height*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*13-3,c:cols[i%5],s:5+Math.random()*6,r:Math.random()*6});
    var n=0;(function f(){x.clearRect(0,0,c.width,c.height);P.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.r+=.2;x.fillStyle=p.c;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
      if(++n<100)raf(f);else c.remove()})();
  }
  function toast(t){var d=document.createElement('div');d.id='ag-toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2300)}
  var lastCel=0;
  try{
    var so=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){
      try{if(this===localStorage&&/best/i.test(k)&&!/^ag_/.test(k)){var old=+localStorage.getItem(k)||0,nv=+v;
        if(isFinite(nv)&&old>0&&nv>old&&Date.now()-lastCel>4000&&document.body){lastCel=Date.now();confetti();toast(T('🏆 שיא חדש!','🏆 New best!'));
          if(window.AG)AG.add(5,0)}}}catch(e){}
      return so.apply(this,arguments)};
  }catch(e){}

  /* ---------- play time ---------- */
  setInterval(function(){if(document.visibilityState!=='visible'||ID==='hub')return;try{var o=JSON.parse(ls('ag_time')||'{}');o[ID]=(o[ID]||0)+5;ls('ag_time',JSON.stringify(o))}catch(e){}},5000);


  /* ---------- trolls (admin pranks; harmless, visual, a few seconds) ---------- */
  var trollSt=document.createElement('style');trollSt.textContent='@keyframes agq{0%,100%{transform:translate(0,0)}20%{transform:translate(-9px,5px)}40%{transform:translate(8px,-6px)}60%{transform:translate(-6px,-8px)}80%{transform:translate(7px,7px)}}@keyframes agf{to{transform:translateY(110vh) rotate(360deg)}}';(document.head||document.documentElement).appendChild(trollSt);
  var TROLLS=[['flip',T('🙃 מסך הפוך','🙃 Flip screen')],['shake',T('📳 רעידת אדמה','📳 Earthquake')],['crash',T('💥 קריסה מזויפת','💥 Fake crash')],['coins',T('💸 "גנבו מטבעות"','💸 "Coins stolen"')],['fast',T('⚡ מהירות מטורפת','⚡ Crazy speed')],['slow',T('🐢 האטה','🐢 Slow motion')],['rain',T('👻 גשם רוחות','👻 Ghost rain')],['colors',T('🌈 צבעים משתגעים','🌈 Color madness')],['mirror',T('🪞 מראה','🪞 Mirror')]];
  function ovl(css,html,ms){var d=document.createElement('div');d.style.cssText='position:fixed;z-index:2147483640;'+css;d.innerHTML=html;document.body.appendChild(d);setTimeout(function(){d.remove()},ms);return d}
  function withMode(m,ms){if(modes.indexOf(m)<0){modes.push(m);applyModes();setTimeout(function(){var i=modes.indexOf(m);if(i>=0){modes.splice(i,1);applyModes()}},ms)}}
  window.AG=window.AG||{};
  AG.troll=function(k,remote){
    if(remote&&ls('ag_notroll')==='1')return;
    var ms=6000;
    if(k==='flip'){document.documentElement.style.transition='transform .4s';document.documentElement.style.transform='rotate(180deg)';setTimeout(function(){document.documentElement.style.transform='';},ms)}
    else if(k==='shake'){document.body.style.animation='agq .35s infinite';setTimeout(function(){document.body.style.animation=''},ms)}
    else if(k==='crash'){var d=ovl('inset:0;background:#0a4aa8;color:#fff;font:700 22px system-ui,Arial;padding:10vh 8vw;direction:ltr','<div style="font-size:90px">:(</div><p>'+T('המשחק נתקל בבעיה וצריך להפעיל אותו מחדש.','Your game ran into a problem and needs to restart.')+'</p><p>0%</p>',3500);var n=0,iv=setInterval(function(){n+=7;var p=d.querySelector('p:last-child');if(p)p.textContent=Math.min(99,n)+'%';if(n>99)clearInterval(iv)},180);setTimeout(function(){ovl('left:50%;top:40%;transform:translateX(-50%);background:#ffd23f;color:#222;border-radius:18px;padding:14px 22px;font:900 22px system-ui,Arial','😜 '+T('סתם צוחקים!','Just kidding!'),2200)},3500)}
    else if(k==='coins'){ovl('left:50%;top:30%;transform:translateX(-50%);background:#c01a2a;color:#fff;border-radius:18px;padding:14px 22px;font:900 22px system-ui,Arial;text-align:center','💸 '+T('גנבו לך את כל המטבעות!','All your coins were stolen!'),3000);setTimeout(function(){ovl('left:50%;top:30%;transform:translateX(-50%);background:#ffd23f;color:#222;border-radius:18px;padding:14px 22px;font:900 22px system-ui,Arial','😜 '+T('סתם – הכול בסדר','Just kidding – all is fine'),2200)},3100)}
    else if(k==='fast'){var o=scale;setScale(2);setTimeout(function(){setScale(o)},ms)}
    else if(k==='slow'){var o2=scale;setScale(.5);setTimeout(function(){setScale(o2)},ms)}
    else if(k==='rain'){for(var i=0;i<26;i++){(function(i){var e=ovl('left:'+Math.random()*95+'vw;top:-60px;font-size:'+(28+Math.random()*30)+'px;pointer-events:none;animation:agf '+(2.5+Math.random()*2.5)+'s linear '+Math.random()*2+'s forwards','👻',6000)})(i)}}
    else if(k==='colors'){withMode('rainbow',ms);withMode('invert',ms/2)}
    else if(k==='mirror'){withMode('mirror',ms)}
  };
  if(window.AG&&AG.tampered){setTimeout(function(){AG.coins();if(AG.tampered())toast(T('⚠ זוהה שינוי לא חוקי בארנק – הוא אופס','⚠ Illegal wallet edit detected – wallet reset'))},900)}

  /* ---------- buttons + panels ---------- */
  var BOT=/\/(chess|englishbot|impostor|game2048)\//.test(location.pathname);
  function mkBtn(txt,left,fn,label){var b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute('aria-label',label);
    b.style.cssText='position:fixed;z-index:2147483000;'+(BOT?'bottom:max(8px,env(safe-area-inset-bottom));':'top:max(6px,env(safe-area-inset-top));')+'left:'+left+'px;width:34px;height:34px;border-radius:50%;border:0;font-size:17px;background:rgba(0,0,0,.45);color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent';
    b.onclick=fn;document.body.appendChild(b);return b}
  var panel;
  function ensurePanel(){if(panel)return panel;panel=document.createElement('div');panel.id='ag-panel';if(BOT){panel.style.top='auto';panel.style.bottom='52px'}document.body.appendChild(panel);return panel}
  function btn(txt,on,fn){var b=document.createElement('button');b.textContent=txt;if(on)b.className='on';b.onclick=fn;return b}
  function head(t){var h=document.createElement('h3');h.textContent=t;return h}
  function funPanel(){var p=ensurePanel();if(p.dataset.k==='fun'&&p.classList.contains('show')){p.classList.remove('show');return}p.dataset.k='fun';p.classList.add('show');draw();
    function draw(){p.textContent='';p.append(head(T('⚡ מצבים מצחיקים','⚡ Fun modes')));
      [['slow',T('🐢 איטי','🐢 Slow'),.6],['norm',T('🙂 רגיל','🙂 Normal'),1],['fast',T('🐇 מהיר','🐇 Fast'),1.5],['crazy',T('⚡ מטורף','⚡ Crazy'),2]].forEach(function(m){p.append(btn(m[1],scale===m[2],function(){setScale(m[2]);draw()}))});
      p.append(document.createElement('br'));
      [['mirror',T('🪞 עולם הפוך','🪞 Mirror world')],['invert',T('🎨 צבעים הפוכים','🎨 Inverted')],['rainbow',T('🌈 קשת','🌈 Rainbow')],['gray',T('⚫ שחור לבן','⚫ Black & white')],['blur',T('🔍 מטושטש','🔍 Blurry')]].forEach(function(m){
        var on=modes.indexOf(m[0])>=0;p.append(btn(m[1],on,function(){var i=modes.indexOf(m[0]);if(i>=0)modes.splice(i,1);else modes.push(m[0]);applyModes();draw()}))});
      var n=document.createElement('div');n.style.cssText='opacity:.7;font-size:12px;margin-top:6px';n.textContent=T('חלק מהמצבים מתאימים רק למשחקי קנבס. הם מתאפסים כשסוגרים את הדף.','Some modes only suit canvas games. They reset when you close the page.');p.append(n)}}
  var admTab=ls('ag_admtab')||'wal';
  function adminPanel(){var p=ensurePanel();if(p.dataset.k==='adm'&&p.classList.contains('show')){p.classList.remove('show');return}p.dataset.k='adm';p.classList.add('show');draw();
    function nl(){return document.createElement('br')}
    function numRow(label,fn,ph){var inp=document.createElement('input');inp.type='number';inp.placeholder=ph||'0';inp.style.width='90px';p.append(document.createTextNode(label+' '),inp,btn(T('אישור','Go'),0,function(){var v=Math.floor(+inp.value);if(isFinite(v)){fn(v);draw()}}),nl())}
    function allIds(cb){fetch(AG.root+'games.json').then(function(r){return r.json()}).then(function(l){cb(l.map(function(g){return g.id}).filter(function(i){return i!=='boss'}),l)})}
    function setPlayed(n){allIds(function(ids){ls('ag_played',JSON.stringify(ids.slice(0,Math.max(0,n))));draw()})}
    function draw(){p.textContent='';p.append(head(T('⚙️ פאנל אדמין','⚙️ Admin panel')));
      var tabs=[['wal',T('💰 ארנק','💰 Wallet')],['game',T('🎮 משחק','🎮 Game')],['boss',T('👾 בוס','👾 Boss')],['troll',T('😈 טרולים','😈 Trolls')],['tools',T('🛠 כלים','🛠 Tools')]];
      var tb=document.createElement('div');tb.style.cssText='display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px';tabs.forEach(function(t){tb.append(btn(t[1],admTab===t[0],function(){admTab=t[0];ls('ag_admtab',t[0]);draw()}))});p.append(tb);
      if(admTab==='wal'){
        var w=document.createElement('div');w.style.cssText='font-weight:900;font-size:17px;margin:4px 0';w.textContent='🪙 '+AG.coins()+'   💎 '+AG.diamonds();p.append(w);
        [100,1000,10000,100000].forEach(function(n){p.append(btn('+'+n+' 🪙',0,function(){AG.add(n,0);draw()}))});p.append(nl());
        [1,10,100].forEach(function(n){p.append(btn('+'+n+' 💎',0,function(){AG.add(0,n);draw()}))});p.append(nl());
        numRow(T('הוסף מטבעות','Add coins'),function(v){AG.add(v,0)});numRow(T('הוסף יהלומים','Add diamonds'),function(v){AG.add(0,v)});
        p.append(btn(T('🧹 אפס ארנק','🧹 Reset wallet'),0,function(){AG.add(-AG.coins(),-AG.diamonds());draw()}))}
      else if(admTab==='game'){
        var inp=document.createElement('input');inp.type='number';inp.placeholder=T('שיא','best');inp.value=ls(KEY)||'';
        p.append(document.createTextNode(T('שיא במשחק: ','Game best: ')),inp,btn(T('שמור','Save'),0,function(){var v=Math.max(0,Math.floor(+inp.value||0));ls(KEY,String(v));draw()}),btn(T('אפס','Reset'),0,function(){try{localStorage.removeItem(KEY)}catch(e){}draw()}),nl());
        var sl=document.createElement('input');sl.type='range';sl.min='.25';sl.max='3';sl.step='.25';sl.value=scale;sl.style.cssText='width:150px;vertical-align:middle';var lab=document.createElement('span');lab.textContent=' ×'+scale;
        sl.oninput=function(){setScale(+sl.value);lab.textContent=' ×'+scale};p.append(document.createTextNode(T('מהירות: ','Speed: ')),sl,lab,nl());
        [['slow',T('🐢 איטי','🐢 Slow'),.6],['norm',T('🙂 רגיל','🙂 Normal'),1],['fast',T('🐇 מהיר','🐇 Fast'),1.5],['crazy',T('⚡ מטורף','⚡ Crazy'),2]].forEach(function(m){p.append(btn(m[1],scale===m[2],function(){setScale(m[2]);draw()}))});p.append(nl());
        p.append(btn(T('🔄 התחל משחק מחדש','🔄 Reload game'),0,function(){location.reload()}));
        allIds(function(ids,l){var sel=document.createElement('select');sel.style.cssText='max-width:180px;font:inherit;padding:4px;border-radius:8px';l.forEach(function(g){var o=document.createElement('option');o.value=g.url;o.textContent=g.name;sel.append(o)});p.append(nl(),document.createTextNode(T('קפוץ למשחק: ','Jump to: ')),sel,btn(T('לך','Go'),0,function(){location.href=AG.root+sel.value}))})}
      else if(admTab==='boss'){
        var pl=document.createElement('div');pl.style.cssText='font-weight:900;margin:4px 0';pl.textContent=T('משחקים שונים ששוחקו: ','Different games played: ')+AG.played()+'  ('+T('בוס 1: 20 · בוס 2: 40 · בוס 3: 60','boss 1: 20 · boss 2: 40 · boss 3: 60')+')';p.append(pl);
        [0,20,40,60].forEach(function(n){p.append(btn(T('קבע ','Set ')+n,0,function(){setPlayed(n)}))});p.append(btn(T('הכול','All'),0,function(){setPlayed(999)}),nl());
        var inf=AG.bossInfo?AG.bossInfo():{c1:+ls('boss_story')||0,c2:+ls('boss_story2')||0,c3:+ls('boss_story3')||0,n1:20,n2:10,n3:10};
        var st=document.createElement('div');st.style.margin='6px 0';st.textContent=T('סיפור – פרק 1: ','Story – ch1: ')+inf.c1+'/'+inf.n1+' · '+T('פרק 2: ','ch2: ')+inf.c2+'/'+inf.n2+' · '+T('פרק 3: ','ch3: ')+(inf.c3||0)+'/'+(inf.n3||10);p.append(st);
        [['boss_story',20,'boss_story_done'],['boss_story2',10,'boss_story_done2'],['boss_story3',10,'boss_story_done3']].forEach(function(c,i){p.append(btn(T('✔ סיים פרק ','✔ Finish ch')+(i+1),0,function(){ls(c[0],String(c[1]));ls(c[2],'1');draw()}),btn(T('↺ אפס פרק ','↺ Reset ch')+(i+1),0,function(){ls(c[0],'0');try{localStorage.removeItem(c[2])}catch(e){}draw()}),nl())});
        p.append(btn(T('👾 לדף הבוס','👾 Boss page'),0,function(){location.href=AG.root+'boss/'}))}
      else if(admTab==='troll'){
        var inRoom=window.AG&&AG.net&&AG.net.room;
        TROLLS.forEach(function(t){p.append(btn(t[1],0,function(){AG.troll(t[0]);if(inRoom&&ls('ag_tsend')!=='0')AG.net.broadcast({t:'troll',k:t[0]})}))});
        p.append(nl(),btn(T('📤 שלח גם לחברים בשרת: ','📤 Also send to room: ')+(ls('ag_tsend')==='0'?T('לא','no'):T('כן','yes')),0,function(){ls('ag_tsend',ls('ag_tsend')==='0'?'1':'0');draw()}),
          btn(T('📥 לקבל טרולים: ','📥 Receive trolls: ')+(ls('ag_notroll')==='1'?T('לא','no'):T('כן','yes')),0,function(){ls('ag_notroll',ls('ag_notroll')==='1'?'0':'1');draw()}))}
      else{
        p.append(btn(T('🛒 קבל את כל פריטי החנות','🛒 Unlock whole shop'),0,function(){var o=window.AG_SHOP?AG_SHOP.read():{own:{},until:{},eq:{}};(window.AG_SHOP?AG_SHOP.items:[]).forEach(function(i){if(i.k==='p')o.own[i.id]=1;else o.until[i.id]=Date.now()+3600000});if(window.AG_SHOP)AG_SHOP.write(o);toast(T('נפתח','Unlocked'))}),btn(T('🛒 אפס חנות','🛒 Reset shop'),0,function(){try{localStorage.removeItem('ag_shop')}catch(e){}location.reload()}),nl(),btn(T('⛶ מסך מלא','⛶ Fullscreen'),0,function(){var d=document.documentElement;(d.requestFullscreen||d.webkitRequestFullscreen||function(){}).call(d)}),
          btn(T('🗑 אפס שיאים ונתונים של כל המשחקים','🗑 Wipe ALL saved data'),0,function(){if(confirm(T('למחוק הכול?','Delete everything?'))){try{var keep=localStorage.getItem('ag_admin');localStorage.clear();if(keep)localStorage.setItem('ag_admin',keep)}catch(e){}location.reload()}}),nl(),
          btn(T('📋 העתק גיבוי נתונים','📋 Copy data backup'),0,function(){var o={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf('ag_adm')!==0)o[k]=localStorage.getItem(k)}}catch(e){}try{navigator.clipboard.writeText(JSON.stringify(o));toast(T('הועתק','Copied'))}catch(e){}}),
          btn(T('🚪 יציאה מאדמין','🚪 Log out'),0,function(){AG.adminLogout();location.reload()}))}}}
  function init(){if(!document.body)return;if(ID==='hub'){if(window.AG&&AG.isAdmin())mkBtn('⚙️',104,adminPanel,'admin');return}
    var left=EN?92:92;mkBtn('⚡',left,funPanel,'fun modes');
    if(window.AG&&AG.isAdmin())mkBtn('⚙️',left+80,adminPanel,'admin')}
  if(document.body)init();else addEventListener('DOMContentLoaded',init);
})();
