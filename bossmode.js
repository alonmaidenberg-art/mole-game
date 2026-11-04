/* Glitch story mode: the boss teleports you between games for one-on-one battles. (c) Alon Maidenberg 2026 - please do not copy. */
(function(){
  'use strict';
  var Q=new URLSearchParams(location.search),EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
  var ROOT=(window.AG&&AG.root)||new URL('../',location.href).href;
  function S(g,t,n,d){return {g:g,t:t,n:n,d:d||''}}
  var CH=[
   {id:1,key:'boss_story',emo:'👾',he:'הגליץ׳',en:'Glitch',st:[
     S('race3d','w'),S('meteors','s',120),S('superhoops','w'),S('lanes','s',120),S('hockey','w'),S('whack','s',150),S('fighter','w'),S('stackup','s',10),S('superfootball','w'),S('munchmaze','s',500),
     S('race3d','w',0,'h'),S('blackhole','s',500),S('superhoops','w',0,'h'),S('froghop','s',40),S('hockey','w',0,'h'),S('mergefruit','s',120),S('fighter','w',0,'h'),S('bricksmash','s',300),S('superfootball','w',0,'h'),S('fighter','w',0,'h')],
    pi:[['חה חה חה! אתם עדיין חושבים שתנצחו אותי?','Ha ha ha! You still think you can beat me?'],['הקוד שלי חזק יותר מכל משחק שלכם!','My code is stronger than any of your games!'],['בואו נראה אתכם מתמודדים עם זה, חה חה!',"Let's see you handle this, ha ha!"],['אין סיכוי שתנצחו אותי כאן!',"There's no way you'll beat me here!"],['אני הגליץ׳ – אני נמצא בכל משחק!',"I'm Glitch – I'm in every game!"],['הפעם אני אשבש לכם הכול!',"This time I'll scramble everything!"]],
    pw:[['לא ייתכן! עוד סיבוב ותראו…','Impossible! One more round and you will see…'],['תקלה! זו תקלה בקוד!',"A glitch! It's a bug in the code!"],['אוף, ניצחתם… אבל אני עוד כאן!',"Ugh, you won… but I'm still here!"],['אל תתלהבו, זה רק בגלל באג!',"Don't get excited, it's just a bug!"]],
    pl:[['חה חה חה! הפסדתם! נסו שוב!','Ha ha ha! You lost! Try again!'],['הקוד שלי ניצח, כמו תמיד!','My code won, as always!'],['אפילו הבאג הזה היה יותר טוב ממכם!','Even this bug was better than you!'],['איזה פספוס, חה חה!','What a miss, ha ha!']],
    sp:{0:['חה חה חה! אני הגליץ׳! כבר השתלטתי על כל המשחקים, ואין סיכוי שתנצחו אותי! נתחיל במירוץ – אני מהיר יותר מכל מכונית!','Ha ha ha! I am Glitch! I already took over all the games and there is no way you can beat me! Starting with a race – I am faster than any car!'],
        9:['זה היה רק החימום! מעכשיו אני מקשה עליכם בכל משחק!','That was only the warm-up! From now on I make every game harder!'],
        19:['זה הסוף! הקרב הסופי – מי שמנצח משתלט על כל המשחקים. ואני אנצח, חה חה חה!','This is the end! The final fight – the winner takes over every game. And I will win, ha ha ha!']},
    fin:['לא!!! הקוד שלי מתמוטט… נ-נ-נצחת… המשחקים חופשיים…','Noooo!!! My code is collapsing… y-y-you won… the games are free…']},
   {id:2,key:'boss_story2',emo:'🦖',he:'הדינוזאור הענק',en:'The Giant Dino',st:[
     S('dino','s',200),S('meteors','s',250),S('lanes','s',250),S('dino','s',350),S('froghop','s',70),S('bricksmash','s',500),S('dino','s',500),S('munchmaze','s',1000),S('dino','s',700),S('dino','s',900)],
    pi:[['ROAAAR! אני הדינוזאור הענק! ברחתי מהמשחק שלכם ועכשיו אני שולט!','ROAAAR! I am the Giant Dino! I escaped your game and now I rule!'],['אתם קטנים מדי בשבילי!','You are too small for me!'],['אני אדרוך עליכם!',"I'll stomp on you!"]],
    pw:[['ROAR?! איך עשיתם את זה?!','ROAR?! How did you do that?!'],['הזנב שלי נתקע… רק בגלל זה!','My tail got stuck… only because of that!']],
    pl:[['ROAAAR! נדרסתם!','ROAAAR! You got stomped!'],['קטנים מדי, חה חה… ‏ROAR!','Too small, ha ha… ROAR!']],
    sp:{0:['ROAAAR! אני הדינוזאור הענק! אחרי הגליץ׳ אתם חושבים שזה נגמר? אני אדרוך על כל המשחקים שלכם!','ROAAAR! I am the Giant Dino! After Glitch you think it is over? I will stomp on all your games!'],
        9:['ROAAAAR!!! הקרב האחרון! מי שמנצח – שולט בכל העולם הפרהיסטורי!','ROAAAAR!!! The last battle! Whoever wins rules the whole prehistoric world!']},
    fin:['ROAR… אני… מתכווץ… נצחתם… אני חוזר לשבת בעמוד המשחק…','ROAR… I am… shrinking… you won… I go back to sit in the game…']},
   {id:3,key:'boss_story3',emo:'🐲',he:'הדרקון הקוסמי',en:'The Cosmic Dragon',st:[
     S('race3d','w',0,'h'),S('meteors','s',300),S('hockey','w',0,'h'),S('lanes','s',300),S('superhoops','w',0,'h'),S('froghop','s',90),S('fighter','w',0,'h'),S('bricksmash','s',600),S('superfootball','w',0,'h'),S('fighter','w',0,'h')],
    pi:[['GRAAAH! אני הדרקון הקוסמי! אכלתי את הגליץ׳ ואת הדינוזאור לארוחת בוקר!','GRAAAH! I am the Cosmic Dragon! I ate Glitch and the Dino for breakfast!'],['הלהבות שלי שורפות כל משחק!','My flames burn every game!'],['אין לכם לאן לברוח, אני בכל הגלקסיה!','Nowhere to run, I am all over the galaxy!']],
    pw:[['GRAAH?! הלהבה שלי כבתה?!','GRAAH?! My flame went out?!'],['מזל מוחלט… אבל אני עוד לא גמרתי!','Pure luck… but I am not done!']],
    pl:[['GRAAAH! נשרפתם! נסו שוב!','GRAAAH! You got burned! Try again!'],['אפילו כוכב לכת היה מחזיק יותר!','Even a planet would last longer!']],
    sp:{0:['GRAAAH! אני הדרקון הקוסמי, הבוס האמיתי! הגליץ׳ והדינוזאור היו רק החימום. קרב אחרי קרב – אני אשרוף אתכם!','GRAAAH! I am the Cosmic Dragon, the real boss! Glitch and the Dino were just the warm-up. Battle after battle – I will burn you!'],
        9:['GRAAAAH!!! הקרב האחרון בגלקסיה! מי שמנצח שולט בכל היקום!','GRAAAAH!!! The last battle in the galaxy! The winner rules the universe!']},
    fin:['GRAAAH… הלהבה שלי… כבה… נצחתם את הבוס האחרון… היקום שלכם!','GRAAAH… my flame… is out… you beat the final boss… the universe is yours!']}
  ];
  var GAMEN={race3d:'מירוץ מכוניות',superhoops:'כדורסל',hockey:'הוקי אוויר',fighter:'לחימה',superfootball:'כדורגל',meteors:'גשם מטאורים',lanes:'שלושה נתיבים',whack:'פוגעים בבועות',stackup:'מגדל גבוה',munchmaze:'מבוך הנשנשן',blackhole:'חור שחור',froghop:'צפרדע קופצת',mergefruit:'איחוד פירות',bricksmash:'שובר לבנים',dino:'דינוזאור'};
  var ENG={race3d:'Car race',superhoops:'Basketball',hockey:'Air hockey',fighter:'Fighting',superfootball:'Football',meteors:'Meteor Shower',lanes:'Three Lanes',whack:'Pop Targets',stackup:'Tall Tower',munchmaze:'Munch Maze',blackhole:'Black Hole',froghop:'Jumping Frog',mergefruit:'Fruit Merge',bricksmash:'Brick Breaker',dino:'Dino'};
  function gname(g){return (EN?ENG:GAMEN)[g]||g}
  function pick(a,i){var p=a[i%a.length];return EN?p[1]:p[0]}
  function stGoal(s){return s.t==='w'?(EN?'Win in '+gname(s.g):'נצחו ב'+gname(s.g)):(EN?'Reach '+s.n+' points in '+gname(s.g):'הגיעו ל-'+s.n+' נקודות ב'+gname(s.g))}
  function say(ch,i,kind){var c=CH[ch];if(kind==='a'&&c.sp[i])return EN?c.sp[i][1]:c.sp[i][0];return pick(kind==='a'?c.pi:kind==='w'?c.pw:c.pl,i+(kind==='l'?Math.floor(Math.random()*9):0))}
  var TAUNTS=EN?['Ha ha ha!','No way you can beat me!','I control the code!','Bye bye, little winner!','Is it a bug or is it you?','GLITCH!']:['חה חה חה!','אין סיכוי שתנצחו אותי!','אני שולט בקוד!','ביי ביי, מנצח קטן!','זה באג או שאתם?','חה חה! ‏GLITCH!','אני הגליץ׳ – שום דבר לא עוצר אותי!'];
  var DTAUNTS=EN?['ROAAAR!','You are too small!','Stomp stomp!','I am huge!']:['ROAAAR!','אתם קטנים מדי!','דום דום!','אני ענק!'];
  var EFF=['invert','rainbow','gray','blur'];
  var CHN=Math.max(0,Math.min(CH.length-1,(+Q.get('ch')||1)-1));
  function prog(c){c=c===undefined?CHN:c;return Math.min(CH[c].st.length,+ls(CH[c].key)||0)}
  function el(t,c,x){var e=document.createElement(t);if(c)e.style.cssText=c;if(x!==undefined)e.textContent=x;return e}
  function btn(tx,fn,bg){var b=el('button','margin:6px;padding:12px 18px;border-radius:14px;border:0;font:900 17px system-ui,Arial;background:'+(bg||'#ffd23f')+';color:#222;cursor:pointer',tx);b.onclick=fn;return b}

  function teleport(url,label){
    var c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147483646;background:#000';c.width=320;c.height=180;document.body.appendChild(c);
    var x=c.getContext('2d'),n=0,t=el('div','position:fixed;z-index:2147483647;left:0;right:0;top:42%;text-align:center;color:#7fffd4;font:900 26px system-ui,Arial;text-shadow:0 0 12px #0f8;padding:0 20px',label);document.body.appendChild(t);
    var iv=setInterval(function(){for(var i=0;i<260;i++){x.fillStyle='hsl('+Math.floor(Math.random()*360)+',90%,'+(20+Math.random()*50)+'%)';x.fillRect(Math.random()*320,Math.random()*180,20+Math.random()*80,2+Math.random()*10)}
      if(++n>26){clearInterval(iv);location.href=url}},50);
  }
  function overlay(){
    var o=el('div','position:fixed;inset:0;z-index:2147483000;background:radial-gradient(600px 400px at 50% 0,'+(['#4a1a7a','#1a6a2a','#7a2a0a'][CHN])+',#0a0618);color:#fff;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,Arial,sans-serif;overflow:auto');
    var card=el('div','max-width:460px;width:100%;text-align:center');o.appendChild(card);document.body.appendChild(o);return {o:o,card:card}}
  function type(node,text,done){node.textContent='';var i=0,iv=setInterval(function(){node.textContent=text.slice(0,++i);if(i>=text.length){clearInterval(iv);done&&done()}},24)}
  function url(ch,i){var s=CH[ch].st[i];return ROOT+s.g+'/?boss='+i+'&ch='+(ch+1)}

  function story(){
    if(!(window.AG&&(AG.played()>=20||AG.isAdmin()))){location.href=ROOT+'boss/';return}
    var ch=CHN,C=CH[ch],N=C.st.length,res=Q.get('res'),st=Math.min(+Q.get('st')||prog(ch),N-1),ui=overlay(),c=ui.card;
    if(res==='win')ls(C.key,String(Math.max(prog(ch),st+1)));
    var P=prog(ch),st_=document.createElement('style');st_.textContent='@keyframes agw{from{transform:translate(0,0) skew(0)}to{transform:translate(4px,-3px) skew(4deg)}}';document.head.appendChild(st_);
    c.appendChild(el('div','font-size:84px;filter:drop-shadow(0 0 20px #f0f);animation:agw .6s infinite alternate',C.emo));
    c.appendChild(el('h2','margin:6px 0',T('פרק ','Chapter ')+(CHN+1)+': '+(EN?C.en:C.he)));
    var bx=el('div','background:#ffffff18;border:2px solid #ff4dff66;border-radius:18px;padding:14px;font:700 19px/1.5 system-ui;min-height:96px;margin:10px 0'),acts=el('div','margin-top:8px');
    var cur=Math.min(res==='win'?P:st,N-1);
    c.append(el('div','opacity:.85;font-size:14px',T('קרב ','Battle ')+(cur+1)+'/'+N),el('div','height:8px;background:#ffffff22;border-radius:6px;margin:6px 0;overflow:hidden').appendChild(el('div','height:100%;background:#ffd23f;width:'+Math.round(P/N*100)+'%')).parentNode,bx,acts);
    var closeB=btn(T('⬅ חזרה לבוס','⬅ Back'),function(){location.href=ROOT+'boss/'},'#ddd');
    if(res==='win'&&P>=N){
      var k='boss_story_done'+(ch?ch+1:'');if(ls(k)!=='1'){ls(k,'1');if(window.AG)AG.add([300,500,800][ch],[5,8,12][ch])}
      type(bx,(EN?C.fin[1]:C.fin[0])+'\n\n'+[T('🎉 ניצחתם את הגליץ׳! קיבלתם 300 🪙 ו-5 💎. אבל… משהו גדול מתעורר בעמוד הדינוזאור…','🎉 You beat Glitch! +300 🪙 and 5 💎. But… something big is waking up in the dino game…'),T('🎉 ניצחתם את הדינוזאור הענק! קיבלתם 500 🪙 ו-8 💎. אבל… משהו נוצץ מופיע בשמיים…','🎉 You beat the Giant Dino! +500 🪙 and 8 💎. But… something glowing appears in the sky…'),T('🏆 ניצחתם את הדרקון הקוסמי, הבוס האחרון! קיבלתם 800 🪙 ו-12 💎. אתם אלופי היקום!','🏆 You beat the Cosmic Dragon, the final boss! +800 🪙 and 12 💎. You are champions of the universe!')][ch],function(){
        if(ch===0)acts.append(btn(T('🦖 לפרק 2: הדינוזאור הענק','🦖 Chapter 2: the Giant Dino'),function(){location.href=ROOT+'boss/?story=1&ch=2'},'#7fe3a0'));
        if(ch===1)acts.append(btn(T('🐲 לפרק 3: הדרקון הקוסמי','🐲 Chapter 3: the Cosmic Dragon'),function(){location.href=ROOT+'boss/?story=1&ch=3'},'#ff9a5a'));
        acts.append(btn(T('🔁 שחקו שוב מההתחלה','🔁 Play again'),function(){ls(C.key,'0');location.href=ROOT+'boss/?story=1&ch='+(ch+1)},'#ffd23f'),closeB)});return}
    var s=C.st[cur],line=res==='win'?say(ch,st,'w')+'\n\n'+T('הקרב הבא: ','Next battle: ')+stGoal(s):res==='lose'?say(ch,st,'l'):say(ch,cur,'a')+'\n\n'+T('אתגר: ','Challenge: ')+stGoal(s);
    var go=function(){teleport(url(ch,cur),'⚡ '+(ch?T('הדינוזאור משגר אתכם אל ','The Dino sends you to '):T('הגליץ׳ משגר אתכם אל ','Glitch is teleporting you to '))+gname(s.g)+' ⚡')};
    type(bx,line,function(){acts.append(btn(res==='win'?T('⚡ לקרב הבא!','⚡ Next battle!'):res==='lose'?T('🔁 נסו שוב','🔁 Try again'):T('⚡ קבלו את האתגר','⚡ Accept'),go),closeB)});
  }

  function inGame(){
    var ch=Math.max(0,(+Q.get('ch')||1)-1),C=CH[ch],idx=+Q.get('boss'),s=C&&C.st[idx];if(!s)return;
    var done=false,goal=stGoal(s);
    function bar(txt){var b=document.getElementById('ag-boss');if(!b){b=el('div','position:fixed;z-index:2147482800;left:50%;top:max(6px,env(safe-area-inset-top));transform:translateX(-50%);max-width:70vw;background:linear-gradient(135deg,'+(ch?'#1a7a2a,#6ac01a':'#6a1aa8,#c01ac0')+');color:#fff;border:2px solid #fff6;border-radius:16px;padding:6px 12px;font:800 13px system-ui,Arial;text-align:center;box-shadow:0 4px 16px #000a;pointer-events:none');b.id='ag-boss';document.body.appendChild(b)}b.textContent=txt}
    function init(){
      bar(C.emo+' '+say(ch,idx,'a').split('!')[0]+'! · '+goal);
      setTimeout(function(){bar(C.emo+' '+T('מטרה: ','Goal: ')+goal)},5000);
      if(s.d==='h'){var h=document.querySelector('#lv [data-v="3"],#cLv [data-v="3"],#diff [data-v="3"]');if(h)h.click()}
      function burst(){if(done)return;var cur=document.documentElement.getAttribute('data-m')||'',e=EFF[Math.floor(Math.random()*EFF.length)],tt=ch?DTAUNTS:TAUNTS;
        document.documentElement.setAttribute('data-m',(cur+' '+e).trim());bar(C.emo+' '+tt[Math.floor(Math.random()*tt.length)]);
        setTimeout(function(){document.documentElement.setAttribute('data-m',cur);bar(C.emo+' '+T('מטרה: ','Goal: ')+goal)},900);setTimeout(burst,9000+Math.random()*9000)}
      setTimeout(burst,8000);
      var end=document.getElementById('end'),eT=document.getElementById('eT'),eS=document.getElementById('eS');if(!end||!eT)return;
      new MutationObserver(function(){
        if(done||!end.classList.contains('show'))return;
        setTimeout(function(){if(done)return;var t=(eT.textContent||''),num=parseInt(((eS&&eS.textContent)||'').replace(/[^0-9]/g,''))||0;
          var win=s.t==='w'?(/ניצחת|you won|🥇|🏆/i.test(t)&&!/הפסדת/.test(t)):num>=s.n;done=true;
          var ui=overlay(),c=ui.card;ui.o.style.zIndex=2147483200;
          c.appendChild(el('div','font-size:72px',win?'😖':'😈'));
          c.appendChild(el('div','background:#ffffff18;border:2px solid #ff4dff66;border-radius:18px;padding:14px;font:700 19px/1.5 system-ui;margin:10px 0',(win?say(ch,idx,'w'):say(ch,idx,'l'))+(s.t==='s'&&!win?'\n('+num+'/'+s.n+')':'')));
          var back=function(r){location.href=ROOT+'boss/?story=1&ch='+(ch+1)+'&st='+idx+'&res='+r};
          c.appendChild(btn(win?T('➡ להמשך הסיפור','➡ Continue'):T('📖 חזרה לסיפור','📖 Back to story'),function(){back(win?'win':'lose')}));
          if(!win)c.appendChild(btn(T('🔁 נסו שוב כאן','🔁 Retry'),function(){location.reload()},'#ddd'));
        },900)}).observe(end,{attributes:true,attributeFilter:['class']});
    }
    if(document.body)init();else addEventListener('DOMContentLoaded',init);
    var cv=document.createElement('canvas');cv.width=320;cv.height=180;cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147483646;background:#000;pointer-events:none';
    function arrive(){document.body.appendChild(cv);var x=cv.getContext('2d'),n=0,iv=setInterval(function(){x.clearRect(0,0,320,180);if(n<14){x.globalAlpha=1-n/14;for(var i=0;i<200;i++){x.fillStyle='hsl('+Math.floor(Math.random()*360)+',90%,50%)';x.fillRect(Math.random()*320,Math.random()*180,20+Math.random()*60,2+Math.random()*8)}}if(++n>14){clearInterval(iv);cv.remove()}},50)}
    if(document.body)arrive();else addEventListener('DOMContentLoaded',arrive);
  }
  window.AG=window.AG||{};window.AG.bossStory=function(ch){location.href=ROOT+'boss/?story=1'+(ch>1?'&ch='+ch:'')};
  window.AG.bossInfo=function(){return {c1:+ls('boss_story')||0,c2:+ls('boss_story2')||0,c3:+ls('boss_story3')||0,n1:CH[0].st.length,n2:CH[1].st.length,n3:CH[2].st.length,done1:ls('boss_story_done')==='1',done2:ls('boss_story_done2')==='1'}};
  if(Q.get('boss')!==null)inGame();
  else if(Q.get('story')!==null){var go=function(){story()};if(document.body)go();else addEventListener('DOMContentLoaded',go)}
})();
