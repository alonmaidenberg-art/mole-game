/* Player accounts: log in with your secret code on any computer (school, a friend's…)
   and get your coins, diamonds, character and records. Logging out wipes them from
   that computer, so the next person can't use them.
   (c) Alon Maidenberg 2026 - please do not copy. */
(function(){
  'use strict';
  if(window.AGAcct)return;
  var EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  var sc=document.currentScript,ROOT=new URL('./',sc&&sc.src?sc.src:location.href).href,API=ROOT+'api/account';
  // per-computer settings that are NOT part of the account
  var SKIP=/^(ag_acct|ag_room|ag_party|ag_mqtt|ag_admin|ag_mini|ag_adm|ag_nofs|ag_scale|ag_lang)$/;
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
  function keys(){var a=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&!SKIP.test(k))a.push(k)}}catch(e){}return a.sort()}
  function dump(){var o={};keys().forEach(function(k){var v=ls(k);if(v!=null&&v.length<20000)o[k]=v});return o}
  function apply(d){keys().forEach(function(k){ls(k,null)});Object.keys(d||{}).forEach(function(k){if(!SKIP.test(k))ls(k,String(d[k]))})}
  function me(){try{var a=JSON.parse(ls('ag_acct')||'null');return a&&a.code?a:null}catch(e){return null}}
  function setMe(a){ls('ag_acct',a?JSON.stringify(a):null);fire()}
  var subs=[];function fire(){subs.forEach(function(f){try{f()}catch(e){}})}
  function call(o,keep){return fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(o),keepalive:!!keep,cache:'no-store'}).then(function(r){return r.json().then(function(j){j._s=r.status;return j},function(){return{error:'net',_s:r.status}})},function(){return{error:'net',_s:0}})}
  function err(j){return j.error==='not-configured'?T('השמירה בענן עוד לא הופעלה באתר.','Cloud saving is not switched on for this site yet.'):
    j.error==='nouser'||j.error==='code'?T('הקוד לא נכון. בדקו שהעתקתם את כל 8 התווים.','That code is wrong. Check all 8 characters.'):
    j.error==='slow'?T('יותר מדי ניסיונות. נסו שוב בעוד 10 דקות.','Too many tries. Try again in 10 minutes.'):
    j.error==='big'?T('יש יותר מדי נתונים לשמירה.','Too much data to save.'):T('אין חיבור לאינטרנט. נסו שוב.','No connection. Try again.')}
  var lastSent=null,saving=false,status='';
  function save(force,keep){var a=me();if(!a)return Promise.resolve(null);var d=dump(),s=JSON.stringify(d);
    if(!force&&s===lastSent)return Promise.resolve({ok:true,same:1});if(saving&&!keep)return Promise.resolve(null);saving=true;
    return call({action:'save',code:a.code,base:a.v,data:d,force:!!force},keep).then(function(j){saving=false;
      if(j.ok){lastSent=s;a.v=j.v;a.t=j.t;setMe(a);status='ok'}
      else if(j.error==='newer'){ // played on another computer since: take that copy
        apply(j.d);a.v=j.v;a.t=j.t;setMe(a);lastSent=JSON.stringify(dump());status='ok';location.reload()}
      else if(j.error==='nouser'){setMe(null)}
      else status='off';fire();return j})}
  function check(){var a=me();if(!a)return;call({action:'peek',code:a.code}).then(function(j){
    if(j.ok&&j.v>a.v){call({action:'load',code:a.code}).then(function(k){if(k.ok){apply(k.d);a.v=k.v;a.t=k.t;setMe(a);location.reload()}})}
    else if(j.ok){lastSent=null;status='ok';fire()}else if(j.error==='nouser')setMe(null)})}
  var AGAcct={
    me:me,status:function(){return status},onChange:function(f){subs.push(f)},
    create:function(){return call({action:'create',data:dump()}).then(function(j){if(j.ok){setMe({code:j.code,v:j.v,t:j.t});lastSent=JSON.stringify(dump());status='ok'}else j.msg=err(j);return j})},
    login:function(code){return call({action:'load',code:code}).then(function(j){if(j.ok){apply(j.d);setMe({code:j.code,v:j.v,t:j.t});lastSent=JSON.stringify(dump())}else j.msg=err(j);return j})},
    logout:function(){return save(true).then(function(j){if(j&&!j.ok&&j.error!=='nouser')return{error:j.error,msg:err(j)};apply({});setMe(null);return{ok:true}})},
    save:save
  };
  window.AGAcct=AGAcct;
  if(me()){check();setInterval(function(){save(false)},15000);
    addEventListener('pagehide',function(){save(false,true)});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save(false,true);else check()})}

  /* ---------- the account window ---------- */
  var ov=null;
  function el(t,css,txt){var e=document.createElement(t);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e}
  function btn(txt,fn,bg,col){var b=el('button','display:block;width:100%;border:0;border-radius:16px;padding:13px;margin-top:10px;font:900 18px system-ui,Arial;cursor:pointer;color:'+(col||'#06322b')+';background:'+(bg||'linear-gradient(180deg,#5ff7d6,#1fc9a6)')+';box-shadow:0 4px 0 rgba(0,0,0,.18)',txt);b.type='button';b.onclick=fn;return b}
  function close(){if(ov){ov.remove();ov=null}}
  function open(view){close();ov=el('div','position:fixed;inset:0;z-index:2147483300;background:rgba(10,5,30,.72);display:flex;align-items:center;justify-content:center;padding:16px;direction:'+(EN?'ltr':'rtl'));
    ov.onclick=function(e){if(e.target===ov)close()};
    var c=el('div','width:100%;max-width:380px;max-height:92vh;overflow:auto;background:#fff;color:#0b4553;border-radius:26px;padding:20px;text-align:center;font-family:system-ui,Arial,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.4);position:relative');
    var x=el('button','position:absolute;top:10px;'+(EN?'right':'left')+':12px;border:0;background:#eef6f5;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;color:#0b4553','✖');x.onclick=close;c.appendChild(x);
    ov.appendChild(c);document.body.appendChild(ov);(VIEWS[view]||VIEWS.home)(c)}
  function head(c,em,t,sub){c.appendChild(el('div','font-size:46px;line-height:1',em));c.appendChild(el('h2','margin:8px 0 4px;font-size:24px;color:#0b4553',t));if(sub)c.appendChild(el('p','margin:0 0 6px;opacity:.8;font-size:15px;line-height:1.5',sub))}
  function codeBox(code){var w=el('div','margin:12px 0 4px;background:#fff7d6;border:3px dashed #ffb800;border-radius:18px;padding:12px');
    w.appendChild(el('div','font:900 34px ui-monospace,Menlo,Consolas,monospace;letter-spacing:4px;direction:ltr;color:#2a1c00',code));
    var cp=el('button','margin-top:8px;border:0;border-radius:12px;padding:8px 14px;font:800 14px system-ui;background:#ffd23f;color:#2a1c00;cursor:pointer',T('📋 העתק','📋 Copy'));cp.type='button';
    cp.onclick=function(){try{navigator.clipboard.writeText(code).then(function(){cp.textContent=T('✔ הועתק','✔ Copied')})}catch(e){}};w.appendChild(cp);return w}
  function nm(){return (ls('ag_name')||'').trim()}
  var VIEWS={
    home:function(c){var a=me();
      if(a){head(c,'☁️',T('מחובר','Logged in')+(nm()?': '+nm():''),T('ההתקדמות שלך נשמרת בענן כל כמה שניות.','Your progress is saved to the cloud every few seconds.'));
        var hid=el('div','margin-top:6px');var sh=btn(T('🔑 הצג את הקוד שלי','🔑 Show my code'),function(){hid.innerHTML='';hid.appendChild(codeBox(a.code));sh.remove()},'#eef6f5','#0b4553');c.appendChild(sh);c.appendChild(hid);
        var st=el('p','min-height:20px;margin:10px 0 0;font-weight:800;font-size:14px;color:#13a37a',status==='off'?T('⚠️ אין חיבור – נשמור כשיחזור','⚠️ Offline – will save when back'):T('✔ הכול שמור','✔ All saved'));c.appendChild(st);
        c.appendChild(btn(T('🚪 התנתק','🚪 Log out'),function(){this.disabled=true;this.textContent=T('שומר…','Saving…');var me_=this;AGAcct.logout().then(function(j){if(j.ok){close();location.reload()}else{st.style.color='#d33';st.textContent=j.msg;me_.disabled=false;me_.textContent=T('🚪 התנתק','🚪 Log out')}})},'linear-gradient(180deg,#ff8a8a,#e5484d)','#fff'));
        c.appendChild(el('p','opacity:.65;font-size:12.5px;margin:10px 0 0;line-height:1.5',T('במחשב של בית ספר או של מישהו אחר – תמיד להתנתק בסוף. ההתנתקות מוחקת את ההתקדמות שלך מהמחשב הזה (היא נשארת שמורה בענן).','On a school or shared computer, always log out at the end. Logging out removes your progress from that computer (it stays safe in the cloud).')));return}
      head(c,'👤',T('חשבון','Account'),T('עם חשבון אפשר להיכנס מכל מחשב – בבית, בבית ספר או אצל חבר – ולקבל את המטבעות, היהלומים, הדמות והשיאים שלך.','With an account you can play on any computer – at home, at school or at a friend\'s – and get your coins, diamonds, character and records.'));
      c.appendChild(btn(T('🆕 צור חשבון חדש','🆕 Create a new account'),function(){VIEWS.go(c,'create')}));
      c.appendChild(btn(T('🔑 יש לי קוד – התחבר','🔑 I have a code – log in'),function(){VIEWS.go(c,'login')},'#ffd23f','#2a1c00'))},
    go:function(c,v){c.innerHTML='';var x=el('button','position:absolute;top:10px;'+(EN?'right':'left')+':12px;border:0;background:#eef6f5;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;color:#0b4553','✖');x.onclick=close;c.appendChild(x);VIEWS[v](c)},
    create:function(c){head(c,'🆕',T('חשבון חדש','New account'),T('ניצור לך קוד סודי. הוא הסיסמה שלך – רק איתו אפשר להיכנס לחשבון.','We\'ll make you a secret code. It is your password – only with it can you get into your account.'));
      if(!nm()){var i=el('input','width:100%;margin-top:10px;padding:12px;border-radius:14px;border:2px solid #cfe9e5;font:800 18px system-ui;text-align:center;color:#0b4553');i.placeholder=T('איך קוראים לך?','What\'s your name?');i.maxLength=14;c.appendChild(i);c._i=i}
      var m=el('p','min-height:20px;margin:8px 0 0;font-weight:800;color:#d33');
      var go=btn(T('✨ צור לי קוד','✨ Make my code'),function(){if(c._i){var v=c._i.value.trim();if(v.length<2){m.textContent=T('כתבו שם (לפחות 2 אותיות)','Type a name (2+ letters)');return}ls('ag_name',v.slice(0,14))}
        go.disabled=true;go.textContent=T('יוצר…','Creating…');AGAcct.create().then(function(j){if(!j.ok){m.textContent=j.msg;go.disabled=false;go.textContent=T('✨ צור לי קוד','✨ Make my code');return}VIEWS.go(c,'made')})});
      c.appendChild(go);c.appendChild(m);c.appendChild(btn(T('חזרה','Back'),function(){VIEWS.go(c,'home')},'#eef6f5','#0b4553'))},
    made:function(c){var a=me();head(c,'🎉',T('החשבון מוכן!','Your account is ready!'),T('זה הקוד הסודי שלך. כתבו אותו על דף או צלמו אותו – בלי הקוד אי אפשר להיכנס, ואין דרך לשחזר אותו.','This is your secret code. Write it on paper or take a photo – without it you can\'t log in, and it can\'t be recovered.'));
      c.appendChild(codeBox(a.code));c.appendChild(el('p','margin:8px 0 0;font-size:14px;font-weight:800;color:#d33',T('🤫 לא לתת את הקוד לאף אחד – מי שיש לו את הקוד יכול להשתמש במטבעות שלך.','🤫 Don\'t share the code – anyone with it can use your coins.')));
      c.appendChild(btn(T('✔ רשמתי, סיימנו','✔ Written down, done'),function(){close()}))},
    login:function(c){head(c,'🔑',T('התחברות','Log in'),T('הכניסו את הקוד הסודי שלכם (8 תווים).','Enter your secret code (8 characters).'));
      var i=el('input','width:100%;margin-top:10px;padding:12px;border-radius:14px;border:2px solid #cfe9e5;font:900 26px ui-monospace,Menlo,Consolas,monospace;letter-spacing:3px;text-align:center;text-transform:uppercase;direction:ltr;color:#0b4553');i.placeholder='XXXX-XXXX';i.maxLength=9;i.autocomplete='off';i.autocapitalize='characters';i.spellcheck=false;c.appendChild(i);
      var m=el('p','min-height:20px;margin:8px 0 0;font-weight:800;color:#d33');
      var has=keys().some(function(k){return /_best|ag_wallet|ag_av$/.test(k)});
      if(has)c.appendChild(el('p','margin:8px 0 0;font-size:13px;opacity:.75;line-height:1.5',T('שימו לב: ההתקדמות שכבר יש במחשב הזה תוחלף בזו של החשבון.','Note: the progress already on this computer will be replaced by the account\'s.')));
      var go=btn(T('התחבר','Log in'),function(){var v=i.value;if(v.replace(/[^A-Za-z0-9]/g,'').length!==8){m.textContent=T('הקוד צריך להיות 8 תווים','The code has 8 characters');return}
        go.disabled=true;go.textContent=T('מתחבר…','Logging in…');AGAcct.login(v).then(function(j){if(!j.ok){m.textContent=j.msg;go.disabled=false;go.textContent=T('התחבר','Log in');return}close();location.reload()})});
      i.addEventListener('keydown',function(e){if(e.key==='Enter')go.click()});
      c.appendChild(go);c.appendChild(m);c.appendChild(btn(T('חזרה','Back'),function(){VIEWS.go(c,'home')},'#eef6f5','#0b4553'));setTimeout(function(){i.focus()},50)}
  };
  AGAcct.open=open;
})();
