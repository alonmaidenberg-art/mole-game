/* Glitch story mode: the boss teleports you between games for one-on-one battles. (c) Alon Maidenberg 2026 - please do not copy. */
(function(){
  'use strict';
  var Q=new URLSearchParams(location.search),EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
  var ROOT=(window.AG&&AG.root)||new URL('../',location.href).href;
  var ST=[
    {g:'race3d',n:'מירוץ מכוניות',goal:'סיימו במקום הראשון במירוץ',
     a:'חה חה חה! אני הגליץ׳! כבר השתלטתי על כל המשחקים, ואין סיכוי שתנצחו אותי! בואו נראה אתכם במירוץ – אני מהיר יותר מכל מכונית!',
     w:'מה?! זו הייתה תקלה! זה לא נחשב… אבל טוב, נמשיך!',l:'חה חה חה! השארתי אותך בעשן! נסו שוב, אם אתם מעיזים.'},
    {g:'superhoops',n:'כדורסל',goal:'נצחו בכדורסל',
     a:'אה, אתם עוד כאן? נראה אתכם בכדורסל! כל סל שלכם – אני אשבש לכם בקוד!',
     w:'סלים? איך הכנסתם סלים?! אני מחליף משחק!',l:'חה חה חה! אפילו הרשת צחקה עליכם!'},
    {g:'hockey',n:'הוקי אוויר',goal:'נצחו בהוקי אוויר',
     a:'הוקי אוויר? אני מהיר כמו חבילת נתונים! אין סיכוי שתבקיעו נגדי!',
     w:'הבקעתם 7?! אני אאבד חיבור… רגע, זה לא ייגמר ככה!',l:'חה חה חה! 7 שערים אצלי, אצלכם אפס!'},
    {g:'fighter',n:'קרב לחימה',goal:'נצחו בקרב',
     a:'עכשיו קרב אמיתי! אני גליץ׳ – אי אפשר לפגוע בי כי אני מופיע ונעלם!',
     w:'אוף! המכה האחרונה כאבה אפילו לפיקסלים שלי…',l:'חה חה חה! KO! נסו שוב כשתגדלו.'},
    {g:'superfootball',n:'כדורגל',goal:'נצחו בכדורגל',
     a:'כדורגל! אני הקבוצה היחידה במגרש, כי כל השאר נתקעו בבאג שלי!',
     w:'גול?! זה גול?! אני דורש בדיקת VAR!',l:'חה חה חה! שוב הפסדתם 5 אפס!'},
    {g:'race3d',n:'המירוץ האחרון',goal:'סיימו שוב במקום הראשון',
     a:'זה הסוף! המירוץ האחרון – מי שמנצח משתלט על כל המשחקים. ואני אנצח, חה חה חה!',
     w:'לא!!! הקוד שלי מתמוטט… נ-נ-נצחת… המשחקים חופשיים…',l:'חה חה חה! העולם שלי! נסו שוב אם יש לכם אומץ!'}
  ];
  var GAMEN={race3d:'מירוץ מכוניות',superhoops:'כדורסל',hockey:'הוקי אוויר',fighter:'לחימה',superfootball:'כדורגל'};
  var ENT=[
    {n:'Car race',goal:'Finish first in the race',a:"Ha ha ha! I'm Glitch! I've taken over all the games and there's no way you can beat me! Let's see you race – I'm faster than any car!",w:"What?! That was a glitch! It doesn't count… fine, let's go on!",l:"Ha ha ha! I left you in the dust! Try again if you dare."},
    {n:'Basketball',goal:'Win at basketball',a:"Oh, you're still here? Let's see you at basketball! Every basket you make, I'll scramble the code!",w:"Baskets? How did you score?! I'm switching games!",l:"Ha ha ha! Even the net laughed at you!"},
    {n:'Air hockey',goal:'Win at air hockey',a:"Air hockey? I'm as fast as a data packet! No way you'll score against me!",w:"You scored 7?! I'm losing connection… wait, this isn't over!",l:"Ha ha ha! Seven goals for me, zero for you!"},
    {n:'Fight',goal:'Win the fight',a:"Now a real fight! I'm Glitch – you can't hit me, I appear and disappear!",w:"Ugh! That last hit hurt even my pixels…",l:"Ha ha ha! KO! Try again when you grow up."},
    {n:'Football',goal:'Win at football',a:"Football! I'm the only team on the field, because everyone else is stuck in my bug!",w:"A goal?! That's a goal?! I demand a VAR check!",l:"Ha ha ha! Lost 5-0 again!"},
    {n:'The last race',goal:'Finish first again',a:"This is the end! The final race – the winner takes over all the games. And I will win, ha ha ha!",w:"Noooo!!! My code is collapsing… y-y-you won… the games are free…",l:"Ha ha ha! The world is mine! Try again if you have the guts!"}];
  var ENG={race3d:'Car race',superhoops:'Basketball',hockey:'Air hockey',fighter:'Fighting',superfootball:'Football'};
  if(EN){ST.forEach(function(s,i){s.a=ENT[i].a;s.w=ENT[i].w;s.l=ENT[i].l;s.goal=ENT[i].goal});GAMEN=ENG}

  var TAUNTS=EN?['Ha ha ha!','No way you can beat me!','I control the code!','Bye bye, little winner!','Is it a bug or is it you?','GLITCH!']:['חה חה חה!','אין סיכוי שתנצחו אותי!','אני שולט בקוד!','ביי ביי, מנצח קטן!','זה באג או שאתם?','חה חה! ‏GLITCH!','אני הגליץ׳ – שום דבר לא עוצר אותי!'];
  var EFF=['invert','rainbow','gray','blur'];
  function prog(){return Math.min(ST.length,+ls('boss_story')||0)}
  function el(t,c,x){var e=document.createElement(t);if(c)e.style.cssText=c;if(x!==undefined)e.textContent=x;return e}
  function btn(tx,fn,bg){var b=el('button','margin:6px;padding:12px 18px;border-radius:14px;border:0;font:900 17px system-ui,Arial;background:'+(bg||'#ffd23f')+';color:#222;cursor:pointer',tx);b.onclick=fn;return b}
  function gname(g){return GAMEN[g]||g}

  /* teleport animation, then navigate */
  function teleport(url,label){
    var c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147483646;background:#000';c.width=320;c.height=180;document.body.appendChild(c);
    var x=c.getContext('2d'),n=0,t=el('div','position:fixed;z-index:2147483647;left:0;right:0;top:42%;text-align:center;color:#7fffd4;font:900 26px system-ui,Arial;text-shadow:0 0 12px #0f8;padding:0 20px',label);document.body.appendChild(t);
    var iv=setInterval(function(){for(var i=0;i<260;i++){x.fillStyle='hsl('+Math.floor(Math.random()*360)+',90%,'+(20+Math.random()*50)+'%)';x.fillRect(Math.random()*320,Math.random()*180,20+Math.random()*80,2+Math.random()*10)}
      if(++n>26){clearInterval(iv);location.href=url}},50);
  }

  /* ---------- story page (inside /boss/) ---------- */
  function overlay(){
    var o=el('div','position:fixed;inset:0;z-index:2147483000;background:radial-gradient(600px 400px at 50% 0,#4a1a7a,#0a0618);color:#fff;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,Arial,sans-serif;overflow:auto');
    var card=el('div','max-width:460px;width:100%;text-align:center');o.appendChild(card);document.body.appendChild(o);return {o:o,card:card}}
  function type(node,text,done){node.textContent='';var i=0,iv=setInterval(function(){node.textContent=text.slice(0,++i);if(i>=text.length){clearInterval(iv);done&&done()}},28)}
  function story(){
    var st=Math.min(+Q.get('st')||prog(),ST.length-1),res=Q.get('res'),ui=overlay(),c=ui.card;
    if(res==='win'){var np=Math.max(prog(),st+1);ls('boss_story',String(np))}
    var P=prog();
    c.appendChild(el('div','font-size:84px;filter:drop-shadow(0 0 20px #f0f);animation:agw .6s infinite alternate','👾'));
    var st_=document.createElement('style');st_.textContent='@keyframes agw{from{transform:translate(0,0) skew(0)}to{transform:translate(4px,-3px) skew(4deg)}}';document.head.appendChild(st_);
    c.appendChild(el('h2','margin:6px 0',T('הגליץ׳ משתלט','Glitch takes over')));
    var say=el('div','background:#ffffff18;border:2px solid #ff4dff66;border-radius:18px;padding:14px;font:700 19px/1.5 system-ui;min-height:96px;margin:10px 0'),acts=el('div','margin-top:8px');
    c.append(el('div','opacity:.8;font-size:14px',T('קרב ','Battle ')+(Math.min(P,ST.length-1)+1)+'/'+ST.length),say,acts);
    var closeB=btn(T('⬅ חזרה לבוס','⬅ Back'),function(){location.href=location.pathname},'#ddd');
    if(res==='win'&&P>=ST.length){
      if(ls('boss_story_done')!=='1'){ls('boss_story_done','1');if(window.AG)AG.add(300,5)}
      type(say,ST[ST.length-1].w+'\n\n'+T('🎉 ניצחתם את הגליץ׳ וחילצתם את כל המשחקים! קיבלתם 300 🪙 ו-5 💎','🎉 You beat Glitch and freed all the games! +300 🪙 and 5 💎'));acts.append(btn(T('🔁 שחקו שוב מההתחלה','🔁 Play again'),function(){ls('boss_story','0');location.href=location.pathname+'?story=1'}),closeB);return}
    var s=ST[res==='win'?Math.min(P,ST.length-1):st];
    var line=res==='win'?ST[st].w:res==='lose'?ST[st].l:s.a;
    var go=function(){teleport(ROOT+s.g+'/?boss='+ST.indexOf(s),'⚡ '+T('הגליץ׳ משגר אתכם אל ','Glitch is teleporting you to ')+gname(s.g)+' ⚡')};
    type(say,(res==='win'?line+'\n\n'+(P<ST.length?T('הוא מתכונן לקרב הבא: ','Next battle: ')+gname(s.g):''):line),function(){
      if(res==='win')acts.append(btn(T('⚡ לקרב הבא!','⚡ Next battle!'),go),closeB);
      else if(res==='lose')acts.append(btn(T('🔁 נסו שוב','🔁 Try again'),go),closeB);
      else acts.append(btn(T('⚡ קבלו את האתגר: ','⚡ Accept: ')+gname(s.g),go),closeB)});
  }

  /* ---------- inside a game ---------- */
  function inGame(){
    var idx=+Q.get('boss'),s=ST[idx];if(!s)return;
    var done=false;
    function bar(txt){var b=document.getElementById('ag-boss');if(!b){b=el('div','position:fixed;z-index:2147482800;left:50%;top:max(6px,env(safe-area-inset-top));transform:translateX(-50%);max-width:70vw;background:linear-gradient(135deg,#6a1aa8,#c01ac0);color:#fff;border:2px solid #fff6;border-radius:16px;padding:6px 12px;font:800 13px system-ui,Arial;text-align:center;box-shadow:0 4px 16px #000a;pointer-events:none');b.id='ag-boss';document.body.appendChild(b)}b.textContent=txt}
    function init(){
      bar('👾 '+T('הגליץ׳: ','Glitch: ')+T('אין סיכוי שתנצחו אותי! ','No way you will beat me! ')+'· '+T(s.goal,'Win this game'));
      setTimeout(function(){bar('👾 '+T('מטרה: ','Goal: ')+T(s.goal,'Win this game'))},5000);
      function burst(){if(done)return;var cur=document.documentElement.getAttribute('data-m')||'',e=EFF[Math.floor(Math.random()*EFF.length)];
        document.documentElement.setAttribute('data-m',(cur+' '+e).trim());bar('👾 '+TAUNTS[Math.floor(Math.random()*TAUNTS.length)]);
        setTimeout(function(){document.documentElement.setAttribute('data-m',cur);bar('👾 '+T('מטרה: ','Goal: ')+T(s.goal,'Win this game'))},900);setTimeout(burst,9000+Math.random()*9000)}
      setTimeout(burst,8000);
      var end=document.getElementById('end'),eT=document.getElementById('eT');if(!end||!eT)return;
      new MutationObserver(function(){
        if(done||!end.classList.contains('show'))return;
        setTimeout(function(){if(done)return;var t=(eT.textContent||'');var win=/ניצחת|you won|🥇|🏆/i.test(t)&&!/הפסדת/.test(t);done=true;
          var ui=overlay(),c=ui.card;ui.o.style.zIndex=2147483200;
          c.appendChild(el('div','font-size:72px',win?'😖':'😈'));
          var line=el('div','background:#ffffff18;border:2px solid #ff4dff66;border-radius:18px;padding:14px;font:700 19px/1.5 system-ui;margin:10px 0',win?s.w:s.l);c.appendChild(line);
          var back=function(r){location.href=ROOT+'boss/?story=1&st='+idx+'&res='+r};
          c.appendChild(btn(win?T('➡ להמשך הסיפור','➡ Continue'):T('📖 חזרה לסיפור','📖 Back to story'),function(){back(win?'win':'lose')}));
          if(!win)c.appendChild(btn(T('🔁 נסו שוב כאן','🔁 Retry'),function(){location.reload()},'#ddd'));
        },900)}).observe(end,{attributes:true,attributeFilter:['class']});
    }
    if(document.body)init();else addEventListener('DOMContentLoaded',init);
    /* arrival glitch */
    var c=document.createElement('canvas');c.width=320;c.height=180;c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147483646;background:#000;pointer-events:none';
    function arrive(){document.body.appendChild(c);var x=c.getContext('2d'),n=0,iv=setInterval(function(){x.clearRect(0,0,320,180);if(n<14){x.globalAlpha=1-n/14;for(var i=0;i<200;i++){x.fillStyle='hsl('+Math.floor(Math.random()*360)+',90%,50%)';x.fillRect(Math.random()*320,Math.random()*180,20+Math.random()*60,2+Math.random()*8)}}if(++n>14){clearInterval(iv);c.remove()}},50)}
    if(document.body)arrive();else addEventListener('DOMContentLoaded',arrive);
  }
  window.AG=window.AG||{};window.AG.bossStory=function(){location.href=ROOT+'boss/?story=1'};
  if(Q.get('boss')!==null)inGame();
  else if(Q.get('story')!==null){var go=function(){story()};if(document.body)go();else addEventListener('DOMContentLoaded',go)}
})();
