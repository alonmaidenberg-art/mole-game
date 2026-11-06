/* Online rooms for all games (peer-to-peer, WebRTC). (c) Alon Maidenberg 2026 - please do not copy.
   Room = host + guests. Signalling goes through a public pub/sub topic (ntfy.sh), game data goes directly between browsers. */
(function(){
  'use strict';
  var EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
  function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){}return null}
  var SIG=ls('ag_sig')||'https://ntfy.sh';
  var ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun.cloudflare.com:3478']},
    {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]};
  if(ls('ag_ice')==='local')ICE={iceServers:[]};
  var ID=location.pathname.replace(/\/index\.html$/,'').replace(/\/+$/,'').split('/').pop()||'hub';
  var GAMES={};try{GAMES=JSON.parse(ss('ag_gnames')||'{}')}catch(e){}
  function rid(n){var s='',c='abcdefghijklmnopqrstuvwxyz0123456789';for(var i=0;i<n;i++)s+=c[Math.floor(Math.random()*c.length)];return s}
  function rcode(){var s='',c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(var i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s}
  function myName(){return (ls('ag_name')||'').trim()||T('שחקן','Player')+' '+(1+Math.floor(Math.random()*99))}

  var st=null,room=null,subs=[],gameH=null,pendingChal=null,es=null,seen={},chunks={};
  function emit(){subs.forEach(function(f){try{f(net)}catch(e){}});renderBtn();if(panelOpen)renderPanel()}
  function save(){ss('ag_room',room?JSON.stringify({code:room.code,host:room.host,gid:room.gid,name:room.name}):null)}

  /* ---------- signalling ---------- */
  function post(topic,obj){
    var s=JSON.stringify(obj),id=rid(6),n=Math.ceil(s.length/2800);
    for(var i=0;i<n;i++){
      var m=JSON.stringify({c:id,i:i,n:n,d:s.slice(i*2800,(i+1)*2800)});
      fetch(SIG+'/'+topic,{method:'POST',body:m}).catch(function(){});
    }
  }
  function listen(topic,fn){
    if(es){try{es.close()}catch(e){}}
    es=new EventSource(SIG+'/'+topic+'/sse?since=40s');
    es.onmessage=function(ev){
      try{var o=JSON.parse(ev.data);if(o.event!=='message')return;if(seen[o.id])return;seen[o.id]=1;
        var m=JSON.parse(o.message);var b=chunks[m.c]||(chunks[m.c]={n:m.n,p:{},k:0});if(!b.p[m.i]){b.p[m.i]=m.d;b.k++}
        if(b.k===b.n){var s='';for(var i=0;i<b.n;i++)s+=b.p[i];delete chunks[m.c];var age=o.time?Date.now()/1000-o.time:0;fn(JSON.parse(s),age)}}catch(e){}};
  }
  function topic(code){return 'agr-'+code.toLowerCase()+'-v1'}
  function gather(pc){return new Promise(function(res){
    if(pc.iceGatheringState==='complete')return res();
    var t=setTimeout(res,3000);pc.addEventListener('icegatheringstatechange',function(){if(pc.iceGatheringState==='complete'){clearTimeout(t);res()}})})}

  /* ---------- room ---------- */
  var net={
    get room(){return room},get connected(){return !!room&&(room.host||(room.link&&room.link.dc&&room.link.dc.readyState==='open'))},
    get members(){return room?room.members:[]},get me(){return room?room.gid:null},
    on:function(f){subs.push(f)},
    create:function(){leave(true);room={code:rcode(),host:true,gid:'h'+rid(5),name:myName(),members:[],links:{}};room.members=[{gid:room.gid,name:room.name}];save();startHost();emit();return room.code},
    join:function(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==5)return false;leave(true);room={code:code,host:false,gid:'g'+rid(5),name:myName(),members:[],link:null};save();startGuest();emit();return true},
    leave:function(){leave(false)},
    send:function(to,msg){msg.from=room.gid;msg.to=to;route(msg)},
    say:function(t){if(!room)return;bubble(room.name,t);net.broadcast({t:'chat',m:t})},
    broadcast:function(msg){msg.from=room.gid;msg.to='*';route(msg)},
    challenge:function(to,game){pendingChal={to:to,game:game};net.send(to,{t:'chal',game:game,gname:GAMES[game]||game,fname:room.name})},
    cancelChal:function(){pendingChal=null},
    /* a game registers here to learn when a match starts */
    game:function(id,h){gameH={id:id,h:h};GAMES[id]=h.name||id;ss('ag_gnames',JSON.stringify(GAMES));tryResume();renderBtn()},
    matchSend:function(msg){if(match)net.send(match.peer,Object.assign({t:'m'},{d:msg}))},
    get match(){return match},
    endMatch:function(){if(match){try{net.send(match.peer,{t:'end'})}catch(e){}}match=null;ss('ag_vs',null);emit()}
  };
  var match=null;
  function leave(keepUI){
    if(es){try{es.close()}catch(e){}es=null}
    if(room){try{if(room.host)Object.keys(room.links).forEach(function(k){try{room.links[k].pc.close()}catch(e){}});else if(room.link)room.link.pc.close()}catch(e){}}
    clearInterval(hbT);room=null;match=null;pendingChal=null;save();ss('ag_vs',null);if(!keepUI)emit()}

  var hbT=null;
  function startHost(){
    listen(topic(room.code),function(m,age){
      if(!room||!room.host)return;
      if(m.t==='hello'&&m.g!==room.gid){if(age>12)return;offerTo(m)}
      else if(m.t==='answer'&&m.to===room.gid){var L=room.links[m.from];if(L&&L.n===m.n&&L.pc.signalingState==='have-local-offer')L.pc.setRemoteDescription({type:'answer',sdp:m.sdp}).catch(function(){})}
    });
    clearInterval(hbT);hbT=setInterval(function(){if(room&&room.host){pruneMembers()}},4000);
  }
  function offerTo(h){
    var old=room.links[h.g];if(old&&old.n===h.n)return;if(old){try{old.pc.close()}catch(e){}}
    var pc=new RTCPeerConnection(ICE),dc=pc.createDataChannel('ag'),L={pc:pc,dc:dc,n:h.n,name:h.name,gid:h.g};room.links[h.g]=L;
    dc.onopen=function(){setMember(h.g,h.name);sendMembers()};
    dc.onmessage=function(e){try{onMsg(JSON.parse(e.data))}catch(x){}};
    dc.onclose=function(){if(room&&room.links[h.g]===L){delete room.links[h.g];dropMember(h.g);sendMembers()}};
    pc.createOffer().then(function(o){return pc.setLocalDescription(o)}).then(function(){return gather(pc)}).then(function(){
      post(topic(room.code),{t:'offer',to:h.g,from:room.gid,n:h.n,sdp:pc.localDescription.sdp})}).catch(function(){});
  }
  function bubble(n,t){var d=document.createElement('div');d.textContent=n+': '+t;d.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%) translateY(-10px);z-index:2147483300;background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(220,255,248,.9));color:#0b4553;border-radius:18px;padding:8px 16px;font:900 17px system-ui,Arial;box-shadow:0 8px 24px rgba(10,120,130,.3);opacity:0;transition:all .3s;max-width:90vw;text-align:center;pointer-events:none';document.body.appendChild(d);requestAnimationFrame(function(){d.style.opacity='1';d.style.transform='translateX(-50%) translateY(0)'});setTimeout(function(){d.style.opacity='0'},2600);setTimeout(function(){d.remove()},3000)}
  function setMember(g,n){var f=room.members.filter(function(m){return m.gid===g})[0];if(f)f.name=n;else room.members.push({gid:g,name:n})}
  function dropMember(g){room.members=room.members.filter(function(m){return m.gid!==g})}
  function pruneMembers(){var ch=false;room.members=room.members.filter(function(m){if(m.gid===room.gid)return true;var L=room.links[m.gid];var ok=L&&L.dc.readyState==='open';if(!ok)ch=true;return ok});if(ch){sendMembers()}}
  function sendMembers(){var l=room.members.map(function(m){return{gid:m.gid,name:m.name}});Object.keys(room.links).forEach(function(k){var d=room.links[k].dc;if(d.readyState==='open')d.send(JSON.stringify({t:'members',list:l,from:room.gid,to:k}))});emit()}

  function startGuest(){
    var n=rid(6),pc=null,tries=0,total=0,offerAt=0,lastHello=0;
    function connect(){
      if(!room||room.host)return;
      if(room.link&&room.link.dc&&room.link.dc.readyState==='open')return;
      var now=Date.now(),cs=room.link&&room.link.pc&&(room.link.pc.connectionState||room.link.pc.iceConnectionState);
      // an offer arrived and the connection is still being built: give it time instead of starting over
      if(offerAt&&now-offerAt<15000&&cs!=='failed'&&cs!=='closed')return;
      // no answer for a while, or it failed: start a fresh attempt
      if(offerAt||tries>=4){n=rid(6);tries=0;offerAt=0}
      // slow down after many tries so the free signalling service doesn't block us
      if(now-lastHello<(total>12?8000:3000))return;
      tries++;total++;lastHello=now;post(topic(room.code),{t:'hello',g:room.gid,n:n,name:room.name});
    }
    listen(topic(room.code),function(m,age){
      if(!room||room.host)return;
      if(m.t==='offer'&&m.to===room.gid&&m.n===n&&!(age>20)){offerAt=Date.now();
        if(room.link){try{room.link.pc.close()}catch(e){}}
        pc=new RTCPeerConnection(ICE);room.link={pc:pc,dc:null};
        pc.ondatachannel=function(e){var dc=e.channel;room.link.dc=dc;
          dc.onopen=function(){dc.send(JSON.stringify({t:'name',from:room.gid,to:'h',name:room.name}));emit();tryResume()};
          dc.onmessage=function(ev){try{onMsg(JSON.parse(ev.data))}catch(x){}};
          dc.onclose=function(){if(room){room.members=[];emit()}}};
        pc.setRemoteDescription({type:'offer',sdp:m.sdp}).then(function(){return pc.createAnswer()}).then(function(a){return pc.setLocalDescription(a)}).then(function(){return gather(pc)}).then(function(){
          post(topic(room.code),{t:'answer',to:m.from,from:room.gid,n:n,sdp:pc.localDescription.sdp})}).catch(function(){});
      }
    });
    clearInterval(hbT);hbT=setInterval(function(){connect()},1000);connect();
  }

  /* ---------- messaging ---------- */
  function route(msg){
    var s=JSON.stringify(msg);
    if(room.host){
      if(msg.to==='*'){Object.keys(room.links).forEach(function(k){var d=room.links[k].dc;if(d.readyState==='open')d.send(s)})}
      else if(msg.to===room.gid||msg.to==='h')onMsg(msg);
      else{var L=room.links[msg.to];if(L&&L.dc.readyState==='open')L.dc.send(s)}
    }else if(room.link&&room.link.dc&&room.link.dc.readyState==='open')room.link.dc.send(s);
  }
  function onMsg(m){
    if(!room)return;
    if(room.host&&m.to&&m.to!==room.gid&&m.to!=='h'){route(m);if(m.to!=='*')return;}
    if(m.t==='name'&&room.host){setMember(m.from,m.name);sendMembers();return}
    if(m.t==='members'){room.members=m.list;emit();return}
    if(m.t==='chal')return showChal(m);
    if(m.t==='party')return showParty(m);
    if(m.t==='pscore'){if(party&&party.game===m.game){party.s[m.from]={name:m.name,score:m.score,txt:m.txt};renderParty()}return}
    if(m.t==='ready'&&pendingChal&&pendingChal.to===m.from&&gameH&&gameH.id===m.game){pendingChal=null;begin(m.from,0);return}
    if(m.t==='m'&&match&&m.from===match.peer){if(gameH&&gameH.h.msg)gameH.h.msg(m.d);return}
    if(m.t==='end'&&match&&m.from===match.peer){var h=gameH&&gameH.h;match=null;ss('ag_vs',null);emit();if(h&&h.end)h.end();return}
    if(m.t==='declined'&&pendingChal&&pendingChal.to===m.from){pendingChal=null;toast(T('דחו את האתגר','Challenge declined'));emit();return}
    if(m.t==='chat'){var cn=(room.members.filter(function(x){return x.gid===m.from})[0]||{}).name||'?';bubble(cn,String(m.m||'').slice(0,40));return}
    if(m.t==='troll'){if(window.AG&&AG.troll)AG.troll(m.k,true);return}
    if(m.t==='rtc'&&gameH&&gameH.h.rtc)gameH.h.rtc(m)
  }
  function begin(peer,role,nm){
    var pn=(room.members.filter(function(x){return x.gid===peer})[0]||{}).name||nm||'?';
    match={peer:peer,role:role,name:pn};ss('ag_vs',null);emit();if(gameH&&gameH.h.start)gameH.h.start(role,pn)}
  function tryResume(){
    if(!gameH||!room||match)return;
    var v=null;try{v=JSON.parse(ss('ag_vs')||'null')}catch(e){}
    if(v&&v.game===gameH.id&&net.connected){ss('ag_vs',null);net.send(v.peer,{t:'ready',game:v.game});begin(v.peer,1,v.name)}
  }

  /* ---------- UI ---------- */
  var tEl=null;
  function toast(t,btns){
    if(tEl)tEl.remove();tEl=document.createElement('div');
    tEl.style.cssText='position:fixed;z-index:2147483640;left:50%;top:12%;transform:translateX(-50%);background:#2e66a0;color:#fff;border:2px solid #ffd23f;border-radius:18px;padding:12px 16px;font:700 16px system-ui,Arial,sans-serif;text-align:center;box-shadow:0 8px 30px #000a;max-width:90vw';
    tEl.textContent=t;(btns||[]).forEach(function(b){var x=document.createElement('button');x.textContent=b[0];x.style.cssText='margin:8px 4px 0;padding:8px 14px;border-radius:12px;border:0;font:800 15px system-ui,Arial;background:'+(b[2]||'#ffd23f')+';color:#222;cursor:pointer';x.onclick=function(){tEl.remove();tEl=null;b[1]()};tEl.appendChild(x)});
    document.body.appendChild(tEl);if(!btns)setTimeout(function(){if(tEl){tEl.remove();tEl=null}},2600)}
  function showChal(m){
    toast('🎮 '+m.fname+T(' מזמין אותך ל',' invites you to ')+m.gname,[[T('הצטרף','Join'),function(){
      ss('ag_vs',JSON.stringify({peer:m.from,game:m.game,name:m.fname}));
      var u=new URL(m.game+'/',AG.root).href;if(m.game===ID&&gameH){tryResume()}else location.href=u}],[T('לא עכשיו','Not now'),function(){net.send(m.from,{t:'declined'})},'#ddd']])}

  var btn=null,panel=null,panelOpen=false,BOT=/\/(chess|englishbot|impostor|game2048)\//.test(location.pathname);
  function renderBtn(){
    if(!btn)return;btn.style.background=net.connected?'#1fa84f':(room?'#d68a1f':'rgba(0,0,0,.45)');
    btn.title=room?room.code:''}
  function el(t,css,tx){var e=document.createElement(t);if(css)e.style.cssText=css;if(tx!==undefined)e.textContent=tx;return e}
  function b(tx,fn,bg){var x=el('button','margin:3px;padding:8px 12px;border-radius:12px;border:0;font:800 14px system-ui,Arial;background:'+(bg||'#ffd23f')+';color:#222;cursor:pointer',tx);x.onclick=fn;return x}
  function renderPanel(){
    if(!panel)return;panel.textContent='';
    panel.appendChild(el('h3','margin:4px 0 8px;font-size:16px','🌐 '+T('משחק אונליין','Play online')));
    if(!room){
      panel.appendChild(b(T('➕ צור שרת','➕ Create room'),function(){net.create()}));
      var inp=el('input','width:110px;padding:8px;border-radius:10px;border:2px solid #fff4;background:#fff1;color:#fff;font:800 16px system-ui;text-transform:uppercase;letter-spacing:3px;text-align:center');inp.maxLength=5;inp.placeholder=T('קוד','CODE');
      panel.appendChild(el('div','margin-top:8px')).append(inp,b(T('הכנס','Join'),function(){if(!net.join(inp.value))inp.style.borderColor='#f55'},'#7fe3a0'));
      panel.appendChild(el('div','opacity:.7;font-size:12px;margin-top:8px',T('צרו שרת וקבלו קוד, או הכניסו קוד של חבר. אחר כך אפשר לאתגר אותו במשחקים לשניים.','Create a room to get a code, or enter a friend\'s code. Then challenge them in two-player games.')));
      return}
    var c=el('div','font:900 28px system-ui;letter-spacing:6px;text-align:center;background:#fff2;border-radius:12px;padding:6px',room.code);panel.appendChild(c);
    panel.appendChild(el('div','text-align:center;font-size:12px;opacity:.75;margin:4px 0',net.connected?T('מחובר ✔','Connected ✔'):T('מתחבר…','Connecting…')));
    var cr=el('div','display:flex;flex-wrap:wrap;gap:4px;margin:6px 0');['👍','😂','😮','🔥','👏','😡','GG','🙏'].concat([T('בואו!','Come on!'),T('עוד משחק?','Another?'),T('סבבה','Cool')]).forEach(function(q){var cb=el('button','border:0;border-radius:12px;padding:6px 10px;font:800 14px system-ui;cursor:pointer;background:#fff;color:#0b4553',q);cb.onclick=function(){net.say(q)};cr.appendChild(cb)});panel.appendChild(cr);
    panel.appendChild(el('div','font-weight:800;margin-top:6px',T('בשרת:','In the room:')));
    room.members.forEach(function(m){
      var r=el('div','display:flex;align-items:center;justify-content:space-between;padding:4px 2px');r.appendChild(el('span','',(m.gid===room.gid?'⭐ ':'👤 ')+m.name));
      if(m.gid!==room.gid&&gameH&&!match)r.appendChild(b('⚔ '+T('אתגר','Challenge'),function(){net.challenge(m.gid,gameH.id);toast(T('נשלחה הזמנה – מחכים…','Invite sent – waiting…'));panelOpen=false;panel.style.display='none'},'#ff9a3a'));
      panel.appendChild(r)});
    if(isScoreGame()&&!gameH)panel.appendChild(b(T('🎉 מסיבה: כולם משחקים את זה','🎉 Party: everyone plays this'),function(){net.partyStart();panelOpen=false;panel.style.display='none'},'#7fe3a0'));
    if(!gameH)panel.appendChild(el('div','opacity:.7;font-size:12px;margin-top:6px',T('כנסו למשחק לשניים ואתגרו מכאן: שחמט, איקס עיגול, 4 בשורה, הוקי אוויר, לחימה, כדורסל, סופר כדורגל וסופר כדורסל.','Open a two-player game and challenge from here: chess, tic-tac-toe, connect 4, air hockey, fighting, basketball, super football and super hoops.')));
    if(match){panel.appendChild(el('div','margin-top:6px;color:#7fe3a0',T('משחקים נגד ','Playing against ')+match.name));panel.appendChild(b(T('⏹ סיים משחק','⏹ End match'),function(){net.endMatch()},'#ff7a7a'))}
    panel.appendChild(b(T('🚪 עזוב שרת','🚪 Leave room'),function(){net.leave()},'#ddd'))}
  function init(){
    if(!document.body)return;
    var isHub=ID==='hub';
    btn=document.createElement('button');btn.type='button';btn.textContent='🌐';btn.setAttribute('aria-label','online');
    btn.style.cssText='position:fixed;z-index:2147483000;'+(isHub?'':(BOT?'bottom:max(8px,env(safe-area-inset-bottom));':'top:max(6px,env(safe-area-inset-top));'))+(isHub?'top:8px;left:56px;':'left:132px;')+'width:34px;height:34px;border-radius:50%;border:0;font-size:17px;color:#fff;cursor:pointer;background:rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent';
    panel=el('div','position:fixed;z-index:2147483600;left:8px;right:8px;'+(BOT?'bottom:52px':'top:48px')+';max-width:320px;max-height:80vh;overflow:auto;background:rgba(20,12,50,.97);color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:18px;padding:12px;font:600 14px system-ui,Arial,sans-serif;display:none');
    btn.onclick=function(){panelOpen=!panelOpen;panel.style.display=panelOpen?'block':'none';if(panelOpen)renderPanel()};
    document.body.append(btn,panel);renderBtn();resumeParty();
    var s=null;try{s=JSON.parse(ss('ag_room')||'null')}catch(e){}
    if(s&&s.code){room={code:s.code,host:s.host,gid:s.gid,name:s.name,members:[],links:{},link:null};if(s.host){room.members=[{gid:room.gid,name:room.name}];startHost()}else startGuest();emit()}
  }


  /* ---------- party: everybody in the room plays the same game and compares scores ---------- */
  var party=null,partyEl=null;
  function isScoreGame(){return !!(document.getElementById('end')&&document.getElementById('eS'))}
  function gtitle(){return (document.title||ID).split(' – ')[0]}
  net.partyStart=function(){if(!room||!isScoreGame())return;party={game:ID,s:{}};ss('ag_party',JSON.stringify({game:ID}));net.broadcast({t:'party',game:ID,gname:gtitle(),fname:room.name});watchEnd();renderParty();toast(T('🎉 נשלחה הזמנה למסיבה לכולם','🎉 Party invite sent to everyone'))};
  function showParty(m){
    if(party&&party.game===m.game&&m.game===ID)return;
    toast('🎉 '+m.fname+T(' פותח מסיבה ב',' started a party in ')+m.gname,[[T('הצטרף','Join'),function(){ss('ag_party',JSON.stringify({game:m.game}));if(m.game===ID){party={game:ID,s:{}};watchEnd();renderParty()}else location.href=new URL(m.game+'/',AG.root).href}],[T('לא עכשיו','Not now'),function(){},'#ddd']])}
  var watching=false;
  function watchEnd(){
    if(watching)return;var end=document.getElementById('end');if(!end)return;watching=true;
    new MutationObserver(function(){if(!party||!end.classList.contains('show'))return;
      setTimeout(function(){var eS=document.getElementById('eS'),tx=(eS&&eS.textContent||'').trim(),sc=parseFloat(tx.replace(/[^0-9.\-]/g,''));if(isNaN(sc))sc=0;
        if(!room)return;party.s[room.gid]={name:room.name,score:sc,txt:tx};net.broadcast({t:'pscore',game:ID,score:sc,txt:tx,name:room.name});renderParty()},400)}).observe(end,{attributes:true,attributeFilter:['class']})}
  function renderParty(){
    if(!party)return;if(!partyEl){partyEl=el('div','position:fixed;z-index:2147483100;right:8px;top:48px;min-width:140px;max-width:46vw;background:rgba(20,12,50,.92);color:#fff;border:2px solid #ffd23f;border-radius:14px;padding:8px 10px;font:700 13px system-ui,Arial;direction:'+(EN?'ltr':'rtl'));document.body.appendChild(partyEl)}
    partyEl.textContent='';partyEl.appendChild(el('div','font-weight:900;margin-bottom:4px','🎉 '+T('מסיבה','Party')));
    var rows=Object.keys(party.s).map(function(k){return party.s[k]}).sort(function(a,b){return b.score-a.score});
    if(!rows.length)partyEl.appendChild(el('div','opacity:.75',T('משחקים… התוצאות יופיעו בסוף כל סיבוב','Playing… scores appear after each round')));
    rows.forEach(function(r,i){partyEl.appendChild(el('div','',(i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'')+r.name+': '+r.txt))});
    var x=el('button','position:absolute;left:4px;top:2px;background:none;border:0;color:#fff;font-size:14px;cursor:pointer','✖');x.onclick=function(){party=null;ss('ag_party',null);partyEl.remove();partyEl=null};partyEl.appendChild(x)}
  function resumeParty(){var v=null;try{v=JSON.parse(ss('ag_party')||'null')}catch(e){}if(v&&v.game===ID&&isScoreGame()){party={game:ID,s:{}};watchEnd();renderParty()}}

  /* ---------- remote play for real-time two-player games: host runs the game, guest sees the video and sends keys ---------- */
  net.remote=function(id,cfg){
    var pc=null,dc=null,vid=null,ui=null,peer=null,held={},hostPad=null;
    function cleanup(){if(hostPad){hostPad.forEach(function(e){e.remove()});hostPad=null}try{if(pc)pc.close()}catch(e){}pc=dc=null;if(ui){ui.remove();ui=null}for(var k in held)delete held[k]}
    function key(c,d){if(dc&&dc.readyState==='open')dc.send(JSON.stringify({c:c,d:d}))}
    function padUI(list,send){
      var held={},L=el('div','position:fixed;left:10px;bottom:34px;z-index:2147482400;display:flex;gap:8px'),R=el('div','position:fixed;right:10px;bottom:34px;z-index:2147482400;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:50vw');
      list.forEach(function(p){var x=el('button','width:60px;height:60px;border-radius:50%;border:0;font:800 20px system-ui;background:rgba(255,255,255,.28);color:#fff;touch-action:none;-webkit-user-select:none',p.l);
        function dn(e){e.preventDefault();held[p.c]=1;send(p.c,1);x.style.background='rgba(255,210,63,.6)'}function up(){if(!held[p.c])return;held[p.c]=0;send(p.c,0);x.style.background='rgba(255,255,255,.28)'}
        x.addEventListener('pointerdown',dn);['pointerup','pointerleave','pointercancel'].forEach(function(v){x.addEventListener(v,up)});(p.side==='R'?R:L).appendChild(x)});
      document.body.append(L,R);return [L,R]}
    function host(){
      cfg.start();
      if(cfg.pad1&&(matchMedia('(pointer:coarse)').matches||ls('ag_pad')==='1'))hostPad=padUI(cfg.pad1,function(c,d){window.dispatchEvent(new KeyboardEvent(d?'keydown':'keyup',{code:c,key:c,bubbles:true}))});
      setTimeout(function(){
        var cv=document.querySelector(cfg.canvas||'#cv');if(ls('ag_dbg'))console.log('rtc host cv',!!cv);if(!cv||!cv.captureStream){toast(T('המשחק לא תומך בשידור','Streaming not supported'));return}
        pc=new RTCPeerConnection(ICE);dc=pc.createDataChannel('k');
        dc.onmessage=function(e){try{var m=JSON.parse(e.data);window.dispatchEvent(new KeyboardEvent(m.d?'keydown':'keyup',{code:m.c,key:m.c,bubbles:true}))}catch(x){}};
        var s=cv.captureStream(30);s.getTracks().forEach(function(t){pc.addTrack(t,s)});
        pc.createOffer().then(function(o){return pc.setLocalDescription(o)}).then(function(){return gather(pc)}).then(function(){
          net.send(match.peer,{t:'rtc',k:'offer',sdp:pc.localDescription.sdp})}).catch(function(e){console.log('rtc err',e&&e.message)});
      },900);
    }
    function guest(){
      ui=el('div','position:fixed;inset:0;z-index:2147482500;background:#000;display:flex;align-items:center;justify-content:center');
      vid=document.createElement('video');vid.autoplay=true;vid.muted=true;vid.playsInline=true;vid.style.cssText='width:100%;height:100%;object-fit:contain';ui.appendChild(vid);
      var msg=el('div','position:absolute;color:#fff;font:700 18px system-ui;text-align:center',T('מתחברים לשידור של ','Connecting to ')+(match.name));ui.appendChild(msg);vid.onplaying=function(){msg.remove()};
      var pad=cfg.pad||[];
      var L=el('div','position:absolute;left:10px;bottom:34px;display:flex;gap:8px'),R=el('div','position:absolute;right:10px;bottom:34px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:50vw');
      pad.forEach(function(p){var x=el('button','width:64px;height:64px;border-radius:50%;border:0;font:800 22px system-ui;background:rgba(255,255,255,.28);color:#fff;touch-action:none;-webkit-user-select:none',p.l);
        function dn(e){e.preventDefault();held[p.c]=1;key(p.c,1);x.style.background='rgba(255,210,63,.6)'}function up(e){if(!held[p.c])return;held[p.c]=0;key(p.c,0);x.style.background='rgba(255,255,255,.28)'}
        x.addEventListener('pointerdown',dn);['pointerup','pointerleave','pointercancel'].forEach(function(v){x.addEventListener(v,up)});(p.side==='R'?R:L).appendChild(x)});
      ui.append(L,R);document.body.appendChild(ui);
      var km=cfg.keys||{};
      function kb(e,d){var c=km[e.code]||(cfg.pad||[]).filter(function(p){return p.c===e.code})[0]&&e.code;if(!c)return;e.preventDefault();if(!!held[c]===!!d)return;held[c]=d;key(c,d)}
      addEventListener('keydown',function(e){if(ui)kb(e,1)},true);addEventListener('keyup',function(e){if(ui)kb(e,0)},true);
    }
    net.game(id,{name:cfg.name,
      start:function(role){cleanup();if(role===0)host();else guest()},
      rtc:function(m){
        if(m.k==='offer'&&ui){
          pc=new RTCPeerConnection(ICE);pc.ontrack=function(e){vid.srcObject=e.streams[0];vid.play().catch(function(){})};
          pc.ondatachannel=function(e){dc=e.channel};
          pc.setRemoteDescription({type:'offer',sdp:m.sdp}).then(function(){return pc.createAnswer()}).then(function(a){return pc.setLocalDescription(a)}).then(function(){return gather(pc)}).then(function(){
            net.send(match.peer,{t:'rtc',k:'answer',sdp:pc.localDescription.sdp})}).catch(function(){});
        }else if(m.k==='answer'&&pc&&pc.signalingState==='have-local-offer')pc.setRemoteDescription({type:'answer',sdp:m.sdp}).catch(function(){});
      },
      end:function(){cleanup();toast(T('המשחק הסתיים','The match ended'))}});
  };
  window.AG=window.AG||{};window.AG.net=net;
  if(document.body)init();else addEventListener('DOMContentLoaded',init);
})();
