/* Shop available in every game. (c) Alon Maidenberg 2026 - please do not copy. */
(function(){
  'use strict';
  var EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
  function rd(){try{var o=JSON.parse(ls('ag_shop')||'{}');o.own=o.own||{};o.until=o.until||{};o.eq=o.eq||{};return o}catch(e){return{own:{},until:{},eq:{}}}}
  function wr(o){ls('ag_shop',JSON.stringify(o))}
  var ITEMS=[
   {id:'x2',k:'t',e:'🪙',n:T('מטבעות כפולים','Double coins'),d:T('כל מטבע שתרוויחו שווה פי 2 – 15 דקות','Every coin you earn counts double – 15 min'),c:150,ms:15*60000},
   {id:'slow',k:'t',e:'🐢',n:T('האטה','Slow-mo'),d:T('המשחק רץ לאט יותר – קל יותר להגיב (60 שניות)','The game runs slower – easier to react (60 s)'),c:60,ms:60000},
   {id:'trail',k:'p',grp:'trail',fx:'trail',e:'✨',n:T('שובל נצנצים','Sparkle trail'),d:T('נצנצים אחרי האצבע/העכבר','Sparkles follow your finger/mouse'),c:200},
   {id:'burst',k:'p',grp:'click',fx:'burst',e:'🎆',n:T('זיקוקים בלחיצה','Click fireworks'),d:T('פיצוץ צבעוני בכל לחיצה','A colorful burst on every tap'),c:200},
   {id:'th_sun',k:'p',e:'🌅',n:T('ערכת שקיעה','Sunset theme'),d:T('צבעי שקיעה לכל האתר','Sunset colors across the site'),c:250,th:'sun'},
   {id:'th_night',k:'p',e:'🌙',n:T('ערכת לילה','Night theme'),d:T('מצב כהה ונעים לעיניים','A dark, eye-friendly mode'),c:250,th:'night'},
   {id:'th_candy',k:'p',e:'🍬',n:T('ערכת סוכריות','Candy theme'),d:T('ורוד ותכלת מתוקים','Sweet pink and sky blue'),c:250,th:'candy'},
   {id:'crown',k:'p',badge:'👑',e:'👑',n:T('כתר ללוח התוצאות','Leaderboard crown'),d:T('כתר ליד הכינוי שלכם בלוח','A crown next to your nickname'),dm:5}
  ];
  window.AG_SHOP={items:ITEMS,read:rd,write:wr};
  function isAdm(){return !!(window.AG&&AG.isAdmin&&AG.isAdmin())}
  try{fetch((window.AG&&AG.root?AG.root:'/')+'shop.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){(j.items||[]).forEach(function(n){var i=ITEMS.findIndex(function(x){return x.id===n.id});if(i>=0)ITEMS[i]=n;else ITEMS.push(n)});if(ov)draw()}).catch(function(){})}catch(e){}
  function deal(){var list=ITEMS.filter(function(i){return i.k==='p'&&!i.admin&&!rd().own[i.id]&&(i.c||0)>0});if(!list.length)return null;var d=Math.floor(Date.now()/86400000);return list[d%list.length]}
  function price(i){var dl=deal();return dl&&dl.id===i.id?Math.round(i.c*.6):i.c}
  function active(id){var o=rd();return (o.until[id]||0)>Date.now()}
  function owned(id){return !!rd().own[id]}
  function applyTheme(){var o=rd(),t='';ITEMS.forEach(function(i){if(i.th&&(o.own[i.id]||(i.admin&&isAdm()))&&o.eq.theme===i.th)t=i.th});if(t)document.documentElement.setAttribute('data-th',t);else document.documentElement.removeAttribute('data-th')}
  applyTheme();
  /* effects */
  var last=0,hue=0;
  function spark(x,y,big,kind){var d=document.createElement('div');var em=kind==='f'?['🔥','🔥','✨'][Math.floor(Math.random()*3)]:kind==='c'?['🎉','🎊','✨','⭐'][Math.floor(Math.random()*4)]:['✨','⭐','💫','🌟'][Math.floor(Math.random()*4)];
    var dx=(Math.random()-.5)*(big?200:40),dy=(Math.random()-.5)*(big?200:40)-(kind==='c'?60:10);
    if(kind==='r'){hue=(hue+28)%360;d.style.cssText='width:12px;height:12px;border-radius:50%;background:hsl('+hue+',95%,60%);box-shadow:0 0 10px hsl('+hue+',95%,60%);'}else{d.textContent=em;d.style.fontSize=(big?22:15)+'px'}
    d.style.cssText+='position:fixed;left:'+x+'px;top:'+y+'px;z-index:2147482500;pointer-events:none;transition:transform .8s ease-out,opacity .8s;opacity:1;transform:translate(-50%,-50%)';document.body.appendChild(d);
    requestAnimationFrame(function(){d.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px)) scale(.4) rotate('+(Math.random()*360)+'deg)';d.style.opacity='0'});setTimeout(function(){d.remove()},860)}
  function eqfx(grp){var o=rd(),id=o.eq[grp];if(id===undefined){id=grp==='trail'?(o.own.trail?'trail':''):(o.own.burst?'burst':'')}if(!id||(!o.own[id]&&!(isAdm()&&/^a_/.test(id))))return '';var it=ITEMS.filter(function(x){return x.id===id})[0];return it?it.fx:''}
  addEventListener('pointermove',function(e){var f=eqfx('trail');if(!f)return;var n=Date.now();if(n-last<60)return;last=n;spark(e.clientX,e.clientY,false,f==='rtrail'?'r':f==='ftrail'?'f':'s')},{passive:true});
  addEventListener('pointerdown',function(e){var f=eqfx('click');if(!f)return;for(var i=0;i<(f==='confetti'?14:9);i++)spark(e.clientX,e.clientY,true,f==='confetti'?'c':'s')},{passive:true});
  /* timed items */
  function tick(){var o=rd();if((o.until.slow||0)>Date.now()){if(window.AG&&AG.setScale&&!tick.s){tick.s=1;tick.prev=ls('ag_scale');AG.setScale(.5)}}else if(tick.s){tick.s=0;if(window.AG&&AG.setScale)AG.setScale(+tick.prev||1)}}
  setInterval(tick,1000);tick();
  if(window.AG)AG.coinMult=function(){return active('x3')?3:active('x2')?2:1};
  /* panel */
  var ov=null;
  function toast(t){var d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:2147483600;background:#0b4553;color:#fff;border-radius:14px;padding:10px 18px;font:800 16px system-ui,Arial;box-shadow:0 6px 20px rgba(0,0,0,.3)';document.body.appendChild(d);setTimeout(function(){d.remove()},2000)}
  function buy(it){var o=rd();if(it.k==='p'&&o.own[it.id])return;
    if(!window.AG)return;var pc=it.admin?0:price(it),pd=it.admin?0:(it.dm||0);if(AG.coins()<pc||AG.diamonds()<pd||!AG.spend(pc,pd)){toast(T('אין מספיק מטבעות','Not enough coins'));return}
    o=rd();if(it.k==='t'){o.until[it.id]=Math.max(o.until[it.id]||0,Date.now())+it.ms}else{o.own[it.id]=1;if(it.th)o.eq.theme=it.th;if(it.grp)o.eq[it.grp]=it.id;if(it.badge)o.eq.badge=it.badge}
    wr(o);applyTheme();tick();toast('✅ '+it.n);draw()}
  function refund(it){var o=rd();if(!o.own[it.id])return;
    // refund 70% of price
    var pc=Math.floor((it.c||0)*.7),pd=Math.floor((it.dm||0)*.7);
    if(window.AG&&pc)AG.add(pc,0);if(window.AG&&pd)AG.add(0,pd);
    delete o.own[it.id];
    // unequip if equipped
    if(it.th&&o.eq.theme===it.th)delete o.eq.theme;
    if(it.grp&&o.eq[it.grp]===it.id)delete o.eq[it.grp];
    if(it.badge&&o.eq.badge===it.badge)delete o.eq.badge;
    wr(o);applyTheme();toast(T('בוטל – הוחזרו ','Refunded ')+(pc?pc+' 🪙':'')+(pd?' '+pd+' 💎':''));draw()}
  function equip(it){var o=rd();if(it.th){o.eq.theme=o.eq.theme===it.th?'':it.th}else if(it.grp){o.eq[it.grp]=o.eq[it.grp]===it.id?'':it.id}else if(it.badge){o.eq.badge=o.eq.badge===it.badge?'':it.badge}else{o.eq[it.id]=o.eq[it.id]===0?1:0}wr(o);applyTheme();draw()}
  function draw(){if(!ov)return;var o=rd(),box=ov.firstChild;box.textContent='';
    var h=document.createElement('div');h.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px';
    var t=document.createElement('b');t.style.fontSize='22px';t.textContent='🛒 '+T('החנות','Shop');var w=document.createElement('span');w.style.cssText='font-weight:900;background:#fff;border-radius:999px;padding:4px 12px';w.textContent='🪙 '+(window.AG?AG.coins():0)+'  💎 '+(window.AG?AG.diamonds():0);
    var x=document.createElement('button');x.textContent='✕';x.style.cssText='border:0;background:#fff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;color:#0b4553';x.onclick=close;h.append(t,w,x);box.append(h);
    var g=document.createElement('div');g.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px';
    ITEMS.filter(function(it){return !it.admin||isAdm()}).forEach(function(it){var c=document.createElement('div');c.style.cssText='background:#fff;border-radius:16px;padding:10px;display:flex;gap:10px;align-items:center;box-shadow:0 3px 10px rgba(20,150,140,.15)';
      var e=document.createElement('div');e.style.cssText='font-size:32px;flex:none';e.textContent=it.e;
      var m=document.createElement('div');m.style.cssText='flex:1;min-width:0';var nm=document.createElement('div');nm.style.cssText='font-weight:900;color:#0b4553';nm.textContent=it.n;var ds=document.createElement('div');ds.style.cssText='font-size:12px;color:#2d6f7e;line-height:1.3';ds.textContent=it.d;m.append(nm,ds);
      var rem=it.k==='t'?Math.max(0,Math.ceil(((o.until[it.id]||0)-Date.now())/1000)):0;if(rem){var r=document.createElement('div');r.style.cssText='font-size:12px;font-weight:900;color:#d6892a';r.textContent='⏳ '+Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0');m.append(r)}
      var b=document.createElement('button');b.style.cssText='flex:none;border:0;border-radius:12px;padding:8px 10px;font:900 14px system-ui,Arial;cursor:pointer;background:#ffd23f;color:#4a3300';
      if(it.k==='p'&&(o.own[it.id]||it.admin)){var on=it.th?o.eq.theme===it.th:it.grp?o.eq[it.grp]===it.id:it.badge?o.eq.badge===it.badge:o.eq[it.id]!==0;b.textContent=on?T('✔ פעיל','✔ On'):T('הפעל','Equip');b.style.background=on?'#7de3c9':'#e6f7f4';b.onclick=function(){equip(it)};
        // refund button (not for admin items)
        if(o.own[it.id]&&!it.admin&&(it.c||it.dm)){var rb=document.createElement('button');rb.textContent=T('↩ בטל','↩ Undo');rb.title=T('החזר '+(Math.floor((it.c||0)*.7))+' 🪙 (70%)','Refund '+(Math.floor((it.c||0)*.7))+' 🪙 (70%)');rb.style.cssText='flex:none;border:0;border-radius:10px;padding:5px 8px;font:800 12px system-ui,Arial;cursor:pointer;background:#ffe0e0;color:#a00;margin-top:4px';rb.onclick=function(){if(confirm(T('לבטל את הרכישה ולקבל בחזרה '+Math.floor((it.c||0)*.7)+' 🪙?','Refund and get back '+Math.floor((it.c||0)*.7)+' 🪙?')))refund(it)};m.append(rb)}}
      else{var dl=deal(),isd=dl&&dl.id===it.id;b.textContent=(it.c?(isd?price(it)+' 🪙':it.c+' 🪙'):it.dm+' 💎');b.onclick=function(){buy(it)};if(isd){var tg=document.createElement('div');tg.textContent=T('מבצע היום -40%','Today -40%');tg.style.cssText='font-size:11px;font-weight:900;color:#fff;background:#ff3d71;border-radius:8px;padding:1px 6px;margin-top:3px;display:inline-block';m.append(tg)}}
      c.append(e,m,b);g.append(c)});
    box.append(g)}
  function close(){if(ov){ov.remove();ov=null}}
  function open(){if(ov){close();return}ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:2147483500;background:rgba(190,250,240,.92);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto;backdrop-filter:blur(6px)';
    var box=document.createElement('div');box.style.cssText='width:100%;max-width:640px;max-height:94vh;max-height:94dvh;overflow:auto;background:linear-gradient(180deg,#dffcf6,#fff);border:2px solid #fff;border-radius:22px;padding:14px;color:#0b4553;font-family:system-ui,Arial,sans-serif;box-shadow:0 10px 40px rgba(20,150,140,.35)';
    ov.append(box);ov.addEventListener('click',function(e){if(e.target===ov)close()});document.body.appendChild(ov);draw();
    ov.timer=setInterval(function(){if(!ov){return}draw()},1000)}
  function mk(){var b=document.createElement('button');b.type='button';b.textContent='🛒';b.setAttribute('aria-label','shop');
    var path=location.pathname.replace(/index\.html$/,''),isHub=window.AG&&AG.root&&path===new URL(AG.root).pathname;
    var BOT=/\/(chess|englishbot|impostor|game2048)\//.test(location.pathname);
    b.style.cssText='position:fixed;z-index:2147483000;'+(BOT?'bottom:max(8px,env(safe-area-inset-bottom));':'top:max(6px,env(safe-area-inset-top));')+'left:'+(isHub?152:252)+'px;width:34px;height:34px;border-radius:50%;border:2px solid #fff;font-size:17px;background:rgba(255,255,255,.92);cursor:pointer;box-shadow:0 3px 10px rgba(20,150,140,.25)';
    b.onclick=open;document.body.appendChild(b)}
  if(document.body)mk();else addEventListener('DOMContentLoaded',mk);
})();
