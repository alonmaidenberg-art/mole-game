/* Alon's characters: one original character per player, drawn the same way on every page.
   (c) Alon Maidenberg 2026 - please do not copy.
   A character is a short code: one letter per part, in the order of CATS below. */
(function(){
  'use strict';
  if(window.AGAv)return;
  var EN=window.AG_LANG==='en',T=function(h,e){return EN?e:h};
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
  var PI=Math.PI;

  /* ---------- the parts. c = coins, d = diamonds (first ones are free) ---------- */
  var CATS=[
    {id:'body',e:'🫧',n:T('גוף','Body'),o:[
      {k:'round',n:T('עגול','Round')},{k:'egg',n:T('ביצה','Egg')},{k:'cube',n:T('רובוט','Robot')},
      {k:'cat',n:T('חתלתול','Kitty'),c:120},{k:'drop',n:T('טיפה','Drop'),c:120},{k:'ghost',n:T('רוח','Ghost'),c:200},{k:'star',n:T('כוכב','Star'),d:3}]},
    {id:'col',e:'🎨',n:T('צבע','Colour'),o:[
      {k:'#3fc1ff'},{k:'#ff6b8b'},{k:'#7be36b'},{k:'#ffc93c'},{k:'#a67bff'},{k:'#ff8a3d'},
      {k:'#2fd6b5',c:60},{k:'#ff4fd8',c:60},{k:'#e8edf5',c:60},{k:'#3a3f55',c:80},{k:'#c0342f',c:80},
      {k:'rainbow',n:T('קשת','Rainbow'),c:300},{k:'gold',n:T('זהב','Gold'),d:4},{k:'galaxy',n:T('גלקסיה','Galaxy'),d:5}]},
    {id:'eyes',e:'👀',n:T('עיניים','Eyes'),o:[
      {k:'big',n:T('גדולות','Big')},{k:'dots',n:T('נקודות','Dots')},{k:'happy',n:T('שמחות','Happy')},
      {k:'angry',n:T('כועסות','Angry'),c:60},{k:'sleepy',n:T('עייפות','Sleepy'),c:60},{k:'hearts',n:T('לבבות','Hearts'),c:120},
      {k:'stars',n:T('כוכבים','Stars'),c:150},{k:'cyclops',n:T('עין אחת','One eye'),c:150},{k:'glitch',n:T('גליץ׳','Glitch'),d:3}]},
    {id:'mouth',e:'👄',n:T('פה','Mouth'),o:[
      {k:'smile',n:T('חיוך','Smile')},{k:'grin',n:T('צחוק','Laugh')},{k:'o',n:T('וואו','Wow')},
      {k:'tongue',n:T('לשון','Tongue'),c:50},{k:'flat',n:T('רציני','Serious'),c:50},{k:'cat',n:T('חתולי','Kitty'),c:80},
      {k:'fangs',n:T('ניבים','Fangs'),c:120},{k:'stache',n:T('שפם','Moustache'),c:150}]},
    {id:'head',e:'🎩',n:T('ראש','Head'),o:[
      {k:'none',n:T('בלי','None')},{k:'cap',n:T('כובע מצחייה','Cap')},{k:'beanie',n:T('כובע צמר','Beanie'),c:80},
      {k:'party',n:T('כובע מסיבה','Party hat'),c:100},{k:'phones',n:T('אוזניות','Headphones'),c:150},{k:'antenna',n:T('אנטנה','Antenna'),c:120},
      {k:'horns',n:T('קרניים','Horns'),c:180},{k:'propeller',n:T('מדחף','Propeller'),c:220},{k:'tophat',n:T('צילינדר','Top hat'),c:250},
      {k:'halo',n:T('הילה','Halo'),d:3},{k:'crown',n:T('כתר','Crown'),d:6}]},
    {id:'face',e:'🕶️',n:T('פנים','Face'),o:[
      {k:'none',n:T('בלי','None')},{k:'blush',n:T('סומק','Blush')},{k:'freckles',n:T('נמשים','Freckles'),c:40},
      {k:'glasses',n:T('משקפיים','Glasses'),c:100},{k:'shades',n:T('משקפי שמש','Shades'),c:160},{k:'band',n:T('סרט נינג׳ה','Ninja band'),c:160},
      {k:'mask',n:T('מסכת גיבור','Hero mask'),c:200},{k:'patch',n:T('רטייה','Eye patch'),c:200}]},
    {id:'hold',e:'✋',n:T('ביד','Holding'),o:[
      {k:'none',n:T('כלום','Nothing')},{k:'paddle',n:T('מחבט','Paddle')},{k:'bball',n:T('כדורסל','Basketball'),c:80},
      {k:'pad',n:T('שלט','Controller'),c:150},{k:'bowl',n:T('כדור באולינג','Bowling ball'),c:120},{k:'cue',n:T('מקל סנוקר','Snooker cue'),c:120},
      {k:'wand',n:T('שרביט','Wand'),c:200},{k:'trophy',n:T('גביע','Trophy'),d:4}]},
    {id:'bg',e:'🖼️',n:T('רקע','Background'),o:[
      {k:'sky',n:T('שמיים','Sky')},{k:'mint',n:T('מנטה','Mint')},{k:'peach',n:T('אפרסק','Peach')},
      {k:'sunset',n:T('שקיעה','Sunset'),c:80},{k:'neon',n:T('ניאון','Neon'),c:150},{k:'space',n:T('חלל','Space'),c:200},
      {k:'confetti',n:T('קונפטי','Confetti'),c:200},{k:'glitchbg',n:T('עולם הגליץ׳','Glitch world'),d:3}]}
  ];
  var ABC='0123456789abcdefghijklmnopqrstuvwxyz';
  function dec(code){code=String(code||'');var o={};CATS.forEach(function(c,i){var n=ABC.indexOf(code.charAt(i));o[c.id]=n>=0&&n<c.o.length?n:0});return o}
  function enc(o){return CATS.map(function(c){return ABC.charAt(Math.max(0,Math.min(c.o.length-1,o[c.id]|0)))}).join('')}
  function pick(o,id){var c=CATS.filter(function(x){return x.id===id})[0];return c.o[o[id]|0].k}
  function free(op){return !op.c&&!op.d}
  function owned(cat,i){var op=CATS.filter(function(x){return x.id===cat})[0].o[i];if(!op||free(op))return true;try{return !!JSON.parse(ls('ag_av_own')||'{}')[cat+':'+i]}catch(e){return false}}
  function own(cat,i){var m={};try{m=JSON.parse(ls('ag_av_own')||'{}')}catch(e){}m[cat+':'+i]=1;ls('ag_av_own',JSON.stringify(m))}
  function mine(){var c=ls('ag_av');return c&&c.length>=CATS.length?c:null}
  function setMine(code){ls('ag_av',code);try{dispatchEvent(new Event('ag-avatar'))}catch(e){}}

  /* ---------- drawing (everything in a 100 x 100 box) ---------- */
  function hex(c){c=c.replace('#','');return[parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)]}
  function mix(c,t,a){var p=hex(c),q=hex(t);return'rgb('+p.map(function(v,i){return Math.round(v+(q[i]-v)*a)}).join(',')+')'}
  var GEO={round:{ey:50,top:24,w:32},egg:{ey:46,top:18,w:28},cube:{ey:48,top:22,w:32},cat:{ey:54,top:30,w:30},drop:{ey:58,top:30,w:30},ghost:{ey:48,top:20,w:28},star:{ey:54,top:22,w:22}};
  function bodyPath(x,sh){x.beginPath();
    if(sh==='round')x.arc(50,56,32,0,PI*2);
    else if(sh==='egg')x.ellipse(50,55,28,37,0,0,PI*2);
    else if(sh==='cube'){if(x.roundRect)x.roundRect(18,24,64,62,13);else x.rect(18,24,64,62)}
    else if(sh==='cat'){x.moveTo(24,42);x.lineTo(23,17);x.lineTo(42,30);x.lineTo(58,30);x.lineTo(77,17);x.lineTo(76,42);x.arc(50,60,30,-.6,PI+.6,false);x.closePath()}
    else if(sh==='drop'){x.moveTo(50,12);x.bezierCurveTo(64,30,80,42,80,62);x.arc(50,62,30,0,PI,false);x.bezierCurveTo(20,42,36,30,50,12);x.closePath()}
    else if(sh==='ghost'){x.moveTo(22,52);x.arc(50,50,28,PI,0,false);x.lineTo(78,86);for(var i=0;i<4;i++){x.quadraticCurveTo(74-i*14,94,71-i*14,86);x.quadraticCurveTo(67-i*14,80,64-i*14,86)}x.lineTo(22,86);x.closePath()}
    else if(sh==='star'){for(var k=0;k<10;k++){var r=k%2?20:40,a=-PI/2+k*PI/5;x.lineTo(50+Math.cos(a)*r*1.05,58+Math.sin(a)*r)}x.closePath()}
  }
  function bodyFill(x,col,t){
    if(col==='rainbow'){var g=x.createLinearGradient(15,20,85,90);['#ff5d5d','#ffb13d','#ffe94d','#5fe36b','#46b8ff','#9a6bff'].forEach(function(c,i){g.addColorStop(i/5,c)});return g}
    if(col==='gold'){var q=x.createLinearGradient(20,18,80,92);q.addColorStop(0,'#fff6b0');q.addColorStop(.35,'#ffd23f');q.addColorStop(.7,'#e0a106');q.addColorStop(1,'#ffe680');return q}
    if(col==='galaxy'){var s=x.createRadialGradient(40,40,4,50,56,44);s.addColorStop(0,'#7b5cff');s.addColorStop(.6,'#2b1a6b');s.addColorStop(1,'#120a33');return s}
    var r=x.createRadialGradient(38,36,4,50,56,46);r.addColorStop(0,mix(col,'#ffffff',.45));r.addColorStop(.55,col);r.addColorStop(1,mix(col,'#000000',.22));return r}
  function edge(col){return col==='rainbow'?'#6a3fb5':col==='gold'?'#a87400':col==='galaxy'?'#0b0620':mix(col,'#000000',.38)}
  function drawBody(x,o,t){var sh=pick(o,'body'),col=pick(o,'col');
    x.save();x.fillStyle='rgba(0,0,0,.18)';x.beginPath();x.ellipse(50,93,24,4.5,0,0,PI*2);x.fill();x.restore();
    bodyPath(x,sh);x.fillStyle=bodyFill(x,col,t);x.fill();
    if(col==='galaxy'){x.save();bodyPath(x,sh);x.clip();for(var i=0;i<26;i++){var sx=(i*37.7)%70+15,sy=(i*53.3)%72+18,tw=.5+.5*Math.sin(t*3+i);x.fillStyle='rgba(255,255,255,'+(.35+.6*tw)+')';x.fillRect(sx,sy,i%5?1.2:2,i%5?1.2:2)}x.restore()}
    x.lineWidth=2.6;x.strokeStyle=edge(col);bodyPath(x,sh);x.stroke();
    // shine
    x.save();bodyPath(x,sh);x.clip();x.fillStyle='rgba(255,255,255,.28)';x.beginPath();x.ellipse(36,36,10,6,-.6,0,PI*2);x.fill();
    // belly
    x.fillStyle='rgba(255,255,255,.16)';x.beginPath();x.ellipse(50,80,18,11,0,0,PI*2);x.fill();x.restore();
    if(sh==='cube'){x.fillStyle=edge(col);[[24,30],[76,30],[24,80],[76,80]].forEach(function(p){x.beginPath();x.arc(p[0],p[1],1.6,0,PI*2);x.fill()})}
    if(sh==='cat'){x.fillStyle='rgba(255,170,190,.7)';x.beginPath();x.moveTo(27,38);x.lineTo(27,23);x.lineTo(38,31);x.fill();x.beginPath();x.moveTo(73,38);x.lineTo(73,23);x.lineTo(62,31);x.fill()}
  }
  function circ(x,cx,cy,r,f){x.beginPath();x.arc(cx,cy,r,0,PI*2);x.fillStyle=f;x.fill()}
  function starP(x,cx,cy,r){x.beginPath();for(var k=0;k<10;k++){var rr=k%2?r*.45:r,a=-PI/2+k*PI/5;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}x.closePath()}
  function heartP(x,cx,cy,s){x.beginPath();x.moveTo(cx,cy+s*.9);x.bezierCurveTo(cx-s*1.4,cy-s*.1,cx-s*.7,cy-s*1.1,cx,cy-s*.35);x.bezierCurveTo(cx+s*.7,cy-s*1.1,cx+s*1.4,cy-s*.1,cx,cy+s*.9);x.closePath()}
  function drawEyes(x,o,t,blink,look){var k=pick(o,'eyes'),g=GEO[pick(o,'body')],ey=g.ey,L=[39,ey],R=[61,ey],lx=(look||0)*1.6;
    x.lineCap='round';x.lineJoin='round';
    if(blink&&k!=='glitch'){x.strokeStyle='#1b1430';x.lineWidth=2.6;(k==='cyclops'?[[50,ey]]:[L,R]).forEach(function(p){x.beginPath();x.moveTo(p[0]-5,p[1]+1);x.quadraticCurveTo(p[0],p[1]+4,p[0]+5,p[1]+1);x.stroke()});return}
    if(k==='big'||k==='angry'){[L,R].forEach(function(p){circ(x,p[0],p[1],7.8,'#fff');x.lineWidth=1.4;x.strokeStyle='rgba(0,0,0,.25)';x.stroke();circ(x,p[0]+1+lx,p[1]+1,4.6,'#1b1430');circ(x,p[0]+2.6+lx,p[1]-1.2,1.7,'#fff')});
      if(k==='angry'){x.strokeStyle='#1b1430';x.lineWidth=3;x.beginPath();x.moveTo(31,ey-12);x.lineTo(45,ey-7);x.moveTo(69,ey-12);x.lineTo(55,ey-7);x.stroke()}}
    else if(k==='dots'){[L,R].forEach(function(p){circ(x,p[0]+lx*.6,p[1],4,'#1b1430');circ(x,p[0]+1.3+lx*.6,p[1]-1.3,1.3,'#fff')})}
    else if(k==='happy'){x.strokeStyle='#1b1430';x.lineWidth=3;[L,R].forEach(function(p){x.beginPath();x.moveTo(p[0]-5.5,p[1]+2);x.quadraticCurveTo(p[0],p[1]-6,p[0]+5.5,p[1]+2);x.stroke()})}
    else if(k==='sleepy'){[L,R].forEach(function(p){circ(x,p[0],p[1],6.5,'#fff');x.save();x.beginPath();x.arc(p[0],p[1],6.6,0,PI*2);x.clip();x.fillStyle=edge('#888888');x.globalAlpha=.55;x.fillRect(p[0]-8,p[1]-8,16,8.5);x.restore();circ(x,p[0]+lx*.5,p[1]+2.4,3,'#1b1430');x.strokeStyle='#1b1430';x.lineWidth=2;x.beginPath();x.moveTo(p[0]-7,p[1]);x.lineTo(p[0]+7,p[1]);x.stroke()})}
    else if(k==='hearts'){[L,R].forEach(function(p){heartP(x,p[0],p[1],5.6+Math.sin(t*6)*.5);x.fillStyle='#ff3b6b';x.fill();x.lineWidth=1.2;x.strokeStyle='#a3123a';x.stroke()})}
    else if(k==='stars'){[L,R].forEach(function(p){starP(x,p[0],p[1],7.2);x.fillStyle='#ffe14d';x.fill();x.lineWidth=1.3;x.strokeStyle='#b58300';x.stroke()})}
    else if(k==='cyclops'){circ(x,50,ey,11.5,'#fff');x.lineWidth=1.6;x.strokeStyle='rgba(0,0,0,.25)';x.stroke();circ(x,51+lx*1.4,ey+1,6.4,'#2a8a6a');circ(x,51+lx*1.4,ey+1,3.6,'#1b1430');circ(x,54+lx*1.4,ey-2.5,2.2,'#fff')}
    else if(k==='glitch'){var j=Math.sin(t*23)>.75?2.5:0;[L,R].forEach(function(p,i){x.fillStyle='#ff2bd6';x.fillRect(p[0]-6+j,p[1]-5,10,10);x.fillStyle='#22f0ff';x.fillRect(p[0]-4-j,p[1]-3,10,10);x.fillStyle='#120a2a';x.fillRect(p[0]-3,p[1]-2,7,7);x.fillStyle='#fff';x.fillRect(p[0]+1,p[1]-2,2,2)})}
  }
  function drawMouth(x,o,t){var k=pick(o,'mouth'),g=GEO[pick(o,'body')],my=g.ey+15,dk='#3a1626';x.lineCap='round';x.lineJoin='round';
    if(k==='smile'){x.strokeStyle='#1b1430';x.lineWidth=2.8;x.beginPath();x.moveTo(42,my-1);x.quadraticCurveTo(50,my+7,58,my-1);x.stroke()}
    else if(k==='grin'||k==='tongue'){x.beginPath();x.moveTo(40,my-2);x.quadraticCurveTo(50,my-1,60,my-2);x.quadraticCurveTo(58,my+11,50,my+11);x.quadraticCurveTo(42,my+11,40,my-2);x.fillStyle=dk;x.fill();
      x.save();x.clip();if(k==='grin'){x.fillStyle='#fff';x.fillRect(38,my-3,24,4)}else{circ(x,51,my+11,6,'#ff7a95')}x.restore();x.lineWidth=2;x.strokeStyle='#1b1430';x.stroke()}
    else if(k==='o'){x.beginPath();x.ellipse(50,my+3,4.2,5.4,0,0,PI*2);x.fillStyle=dk;x.fill();x.lineWidth=1.8;x.strokeStyle='#1b1430';x.stroke()}
    else if(k==='flat'){x.strokeStyle='#1b1430';x.lineWidth=2.8;x.beginPath();x.moveTo(44,my+2);x.lineTo(56,my+2);x.stroke()}
    else if(k==='cat'){x.strokeStyle='#1b1430';x.lineWidth=2.4;x.beginPath();x.moveTo(42,my);x.quadraticCurveTo(46,my+5,50,my);x.quadraticCurveTo(54,my+5,58,my);x.stroke()}
    else if(k==='fangs'){x.strokeStyle='#1b1430';x.lineWidth=2.6;x.beginPath();x.moveTo(41,my-1);x.quadraticCurveTo(50,my+5,59,my-1);x.stroke();x.fillStyle='#fff';[[44.5,my+1.6],[55.5,my+1.6]].forEach(function(p){x.beginPath();x.moveTo(p[0]-2.4,p[1]-.8);x.lineTo(p[0]+2.4,p[1]-.8);x.lineTo(p[0],p[1]+5);x.closePath();x.fill();x.lineWidth=1;x.stroke()})}
    else if(k==='stache'){x.strokeStyle='#1b1430';x.lineWidth=2.2;x.beginPath();x.moveTo(45,my+4);x.quadraticCurveTo(50,my+7,55,my+4);x.stroke();x.fillStyle='#4a2b17';x.beginPath();x.moveTo(50,my-3);x.bezierCurveTo(44,my-6,37,my-3,35,my+2);x.bezierCurveTo(40,my,45,my+1,50,my-1);x.bezierCurveTo(55,my+1,60,my,65,my+2);x.bezierCurveTo(63,my-3,56,my-6,50,my-3);x.fill()}
  }
  function drawFace(x,o,t){var k=pick(o,'face'),g=GEO[pick(o,'body')],ey=g.ey;
    if(k==='blush'||k==='freckles'){if(k==='blush'){x.fillStyle='rgba(255,90,130,.42)';[[30,ey+9],[70,ey+9]].forEach(function(p){x.beginPath();x.ellipse(p[0],p[1],5.5,3.2,0,0,PI*2);x.fill()})}else{x.fillStyle='rgba(140,70,30,.65)';[[29,ey+8],[33,ey+11],[27,ey+12],[71,ey+8],[67,ey+11],[73,ey+12]].forEach(function(p){x.beginPath();x.arc(p[0],p[1],1.1,0,PI*2);x.fill()})}}
    else if(k==='glasses'){x.strokeStyle='#2a2440';x.lineWidth=2.4;x.beginPath();x.arc(39,ey,9.5,0,PI*2);x.moveTo(70.5,ey);x.arc(61,ey,9.5,0,PI*2);x.moveTo(48.5,ey-1);x.quadraticCurveTo(50,ey-3,51.5,ey-1);x.stroke();x.fillStyle='rgba(180,230,255,.18)';x.fill()}
    else if(k==='shades'){x.fillStyle='#14121c';[[28,ey-6],[52,ey-6]].forEach(function(p){x.beginPath();if(x.roundRect)x.roundRect(p[0],p[1],20,12,4);else x.rect(p[0],p[1],20,12);x.fill()});x.fillRect(46,ey-4,8,2.5);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(31,ey-4,6,2);x.fillRect(55,ey-4,6,2)}
    else if(k==='band'){x.fillStyle='#e8343a';x.fillRect(18,ey-15,64,7);x.strokeStyle='#e8343a';x.lineWidth=3.2;var w=Math.sin(t*5)*3;x.beginPath();x.moveTo(80,ey-12);x.quadraticCurveTo(88,ey-14+w,94,ey-6+w);x.moveTo(80,ey-11);x.quadraticCurveTo(86,ey-8-w,90,ey+1-w);x.stroke();x.fillStyle='#ffd23f';x.beginPath();x.arc(50,ey-11.5,2.2,0,PI*2);x.fill()}
    else if(k==='mask'){x.fillStyle='#1e2a6b';x.beginPath();x.moveTo(26,ey-4);x.quadraticCurveTo(38,ey-12,50,ey-5);x.quadraticCurveTo(62,ey-12,74,ey-4);x.quadraticCurveTo(72,ey+8,61,ey+7);x.quadraticCurveTo(54,ey+6,50,ey+2);x.quadraticCurveTo(46,ey+6,39,ey+7);x.quadraticCurveTo(28,ey+8,26,ey-4);x.fill()}
    else if(k==='patch'){x.strokeStyle='#14121c';x.lineWidth=1.8;x.beginPath();x.moveTo(22,ey-13);x.lineTo(78,ey+4);x.stroke();x.fillStyle='#14121c';x.beginPath();x.ellipse(61,ey,8.5,7.5,0,0,PI*2);x.fill()}
  }
  function drawHead(x,o,t){var k=pick(o,'head'),g=GEO[pick(o,'body')],ty=g.top,hw=g.w;
    if(k==='cap'){x.fillStyle='#e8343a';x.beginPath();x.arc(50,ty+8,19,PI,0);x.closePath();x.fill();x.fillStyle='#b81f25';x.beginPath();x.ellipse(36,ty+8,16,4,0,0,PI*2);x.fill();circ(x,50,ty-11,2.6,'#fff')}
    else if(k==='beanie'){x.fillStyle='#3a7bd5';x.beginPath();x.arc(50,ty+9,20,PI,0);x.closePath();x.fill();x.fillStyle='#2b5fa8';x.fillRect(29,ty+4,42,7);x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=1.2;for(var i=0;i<6;i++){x.beginPath();x.moveTo(33+i*7,ty+4);x.lineTo(33+i*7,ty+11);x.stroke()}circ(x,50,ty-12,5.5,'#fff')}
    else if(k==='party'){x.save();x.beginPath();x.moveTo(37,ty+6);x.lineTo(50,ty-24);x.lineTo(63,ty+6);x.closePath();x.fillStyle='#a855f7';x.fill();x.clip();x.strokeStyle='#ffd23f';x.lineWidth=3.2;for(var s=0;s<5;s++){x.beginPath();x.moveTo(30,ty+4-s*7);x.lineTo(70,ty-6-s*7);x.stroke()}x.restore();circ(x,50,ty-25,3.6,'#ff5d8f')}
    else if(k==='phones'){x.strokeStyle='#2a2440';x.lineWidth=4;x.beginPath();x.arc(50,g.ey,hw+2,PI*1.08,PI*1.92);x.stroke();[[50-hw-1,g.ey],[50+hw+1,g.ey]].forEach(function(p){x.fillStyle='#2a2440';x.beginPath();if(x.roundRect)x.roundRect(p[0]-5,p[1]-8,10,16,4);else x.rect(p[0]-5,p[1]-8,10,16);x.fill();x.fillStyle='#22f0ff';x.fillRect(p[0]-2,p[1]-4,4,8)})}
    else if(k==='antenna'){x.strokeStyle='#2a2440';x.lineWidth=2.4;x.beginPath();x.moveTo(50,ty+2);x.quadraticCurveTo(46,ty-8,50,ty-15);x.stroke();var p=.6+.4*Math.sin(t*4);x.save();x.shadowColor='#7dffb0';x.shadowBlur=8*p;circ(x,50,ty-17,4.4,'#58f29b');x.restore()}
    else if(k==='horns'){x.fillStyle='#e8343a';x.strokeStyle='#8f1018';x.lineWidth=1.4;[-1,1].forEach(function(s){x.beginPath();x.moveTo(50+s*10,ty+6);x.quadraticCurveTo(50+s*14,ty-6,50+s*22,ty-12);x.quadraticCurveTo(50+s*20,ty+2,50+s*20,ty+8);x.closePath();x.fill();x.stroke()})}
    else if(k==='propeller'){x.fillStyle='#ffd23f';x.beginPath();x.arc(50,ty+8,17,PI,0);x.closePath();x.fill();x.fillStyle='#3fc1ff';x.beginPath();x.arc(50,ty+8,17,PI,PI*1.5);x.lineTo(50,ty+8);x.closePath();x.fill();x.fillStyle='#e8343a';x.beginPath();x.arc(50,ty+8,17,PI*1.5,0);x.lineTo(50,ty+8);x.closePath();x.fill();
      x.strokeStyle='#2a2440';x.lineWidth=1.8;x.beginPath();x.moveTo(50,ty-9);x.lineTo(50,ty-14);x.stroke();var sp=Math.cos(t*14);x.fillStyle='#e8343a';x.beginPath();x.ellipse(50,ty-15,15*Math.abs(sp)+1,2.6,0,0,PI*2);x.fill();circ(x,50,ty-15,2,'#2a2440')}
    else if(k==='tophat'){x.fillStyle='#17141f';x.beginPath();x.ellipse(50,ty+5,21,4.5,0,0,PI*2);x.fill();x.fillRect(37,ty-20,26,25);x.beginPath();x.ellipse(50,ty-20,13,3,0,0,PI*2);x.fill();x.fillStyle='#e8343a';x.fillRect(37,ty-3,26,5)}
    else if(k==='halo'){var b=Math.sin(t*2.5)*1.5;x.save();x.shadowColor='#fff3a0';x.shadowBlur=10;x.strokeStyle='#ffe14d';x.lineWidth=3.4;x.beginPath();x.ellipse(50,ty-9+b,15,4.5,0,0,PI*2);x.stroke();x.restore()}
    else if(k==='crown'){x.fillStyle='#ffd23f';x.strokeStyle='#a87400';x.lineWidth=1.6;x.beginPath();x.moveTo(34,ty+6);x.lineTo(34,ty-12);x.lineTo(42,ty-3);x.lineTo(50,ty-16);x.lineTo(58,ty-3);x.lineTo(66,ty-12);x.lineTo(66,ty+6);x.closePath();x.fill();x.stroke();circ(x,50,ty-1,2.8,'#e8343a');circ(x,41,ty+1,2,'#3fc1ff');circ(x,59,ty+1,2,'#58f29b')}
  }
  function drawHold(x,o,t){var k=pick(o,'hold');if(k==='none')return;var col=pick(o,'col'),hx=84,hy=70,sw=Math.sin(t*2)*2;
    x.save();x.translate(0,sw*.3);
    if(k==='paddle'){x.save();x.translate(hx,hy);x.rotate(-.5);x.fillStyle='#c98a4a';x.fillRect(-2.5,0,5,14);x.beginPath();x.ellipse(0,-9,10,11,0,0,PI*2);x.fillStyle='#e8343a';x.fill();x.lineWidth=1.6;x.strokeStyle='#8f1018';x.stroke();x.restore();circ(x,hx+12,hy-24+sw,2.8,'#fff')}
    else if(k==='bball'){circ(x,hx+2,hy-6,10,'#f07b26');x.strokeStyle='#5a2a08';x.lineWidth=1.3;x.beginPath();x.arc(hx+2,hy-6,10,0,PI*2);x.moveTo(hx-8,hy-6);x.lineTo(hx+12,hy-6);x.moveTo(hx+2,hy-16);x.lineTo(hx+2,hy+4);x.moveTo(hx-4,hy-14);x.quadraticCurveTo(hx+3,hy-6,hx-4,hy+2);x.moveTo(hx+8,hy-14);x.quadraticCurveTo(hx+1,hy-6,hx+8,hy+2);x.stroke()}
    else if(k==='pad'){x.save();x.translate(hx,hy-4);x.rotate(-.25);x.fillStyle='#3a3f55';x.beginPath();x.moveTo(-12,-5);x.quadraticCurveTo(0,-8,12,-5);x.quadraticCurveTo(16,6,12,9);x.quadraticCurveTo(8,10,5,4);x.lineTo(-5,4);x.quadraticCurveTo(-8,10,-12,9);x.quadraticCurveTo(-16,6,-12,-5);x.fill();x.fillStyle='#fff';x.fillRect(-9,-2,6,2);x.fillRect(-7,-4,2,6);[['#58f29b',8,-3],['#ff5d8f',10,0],['#3fc1ff',6,0],['#ffd23f',8,2]].forEach(function(b){circ(x,b[1],b[2],1.2,b[0])});x.restore()}
    else if(k==='bowl'){circ(x,hx+2,hy-4,10.5,'#3a2a8a');circ(x,hx-1,hy-8,1.6,'#120a33');circ(x,hx+4,hy-9,1.6,'#120a33');circ(x,hx+2,hy-4,1.6,'#120a33');circ(x,hx-2,hy-10,3,'rgba(255,255,255,.3)')}
    else if(k==='cue'){x.strokeStyle='#c98a4a';x.lineWidth=3;x.beginPath();x.moveTo(hx+8,hy+18);x.lineTo(hx-6,hy-34);x.stroke();x.strokeStyle='#2a2440';x.lineWidth=3.4;x.beginPath();x.moveTo(hx+8,hy+18);x.lineTo(hx+5,hy+8);x.stroke();x.strokeStyle='#3fc1ff';x.lineWidth=3;x.beginPath();x.moveTo(hx-5.6,hy-32.5);x.lineTo(hx-6,hy-34);x.stroke()}
    else if(k==='wand'){x.strokeStyle='#5b3a8a';x.lineWidth=2.6;x.beginPath();x.moveTo(hx+4,hy+8);x.lineTo(hx-2,hy-16);x.stroke();x.save();x.shadowColor='#fff3a0';x.shadowBlur=8;starP(x,hx-3,hy-20,7);x.fillStyle='#ffe14d';x.fill();x.restore();for(var i=0;i<3;i++){var a=t*3+i*2.1;circ(x,hx-3+Math.cos(a)*11,hy-20+Math.sin(a)*11,1.2,'#fff')}}
    else if(k==='trophy'){x.fillStyle='#ffd23f';x.strokeStyle='#a87400';x.lineWidth=1.4;x.beginPath();x.moveTo(hx-8,hy-20);x.lineTo(hx+10,hy-20);x.quadraticCurveTo(hx+10,hy-6,hx+1,hy-4);x.quadraticCurveTo(hx-8,hy-6,hx-8,hy-20);x.fill();x.stroke();x.fillRect(hx-1,hy-4,4,6);x.fillRect(hx-5,hy+2,12,4);x.beginPath();x.arc(hx-9,hy-15,4,PI*.5,PI*1.5);x.moveTo(hx+11,hy-19);x.arc(hx+11,hy-15,4,-PI*.5,PI*.5);x.stroke()}
    // little hand
    circ(x,hx-1,hy+1,4.6,col.charAt(0)==='#'?col:col==='gold'?'#ffd23f':col==='rainbow'?'#46b8ff':'#4a32a8');x.lineWidth=1.6;x.strokeStyle=edge(col.charAt(0)==='#'?col:'#7b5cff');x.stroke();
    x.restore()}
  function drawBg(x,o,t){var k=pick(o,'bg'),g;
    if(k==='sky'){g=x.createLinearGradient(0,0,0,100);g.addColorStop(0,'#bfe9ff');g.addColorStop(1,'#7cc8f2')}
    else if(k==='mint'){g=x.createLinearGradient(0,0,0,100);g.addColorStop(0,'#d6fff0');g.addColorStop(1,'#8fe3c4')}
    else if(k==='peach'){g=x.createLinearGradient(0,0,0,100);g.addColorStop(0,'#ffe8d6');g.addColorStop(1,'#ffb59a')}
    else if(k==='sunset'){g=x.createLinearGradient(0,0,0,100);g.addColorStop(0,'#ffcf6b');g.addColorStop(.55,'#ff7591');g.addColorStop(1,'#5b2a7a')}
    else if(k==='neon'||k==='glitchbg'||k==='space'){g='#0d0a24'}
    else if(k==='confetti'){g='#fff4d6'}
    x.fillStyle=g;x.fillRect(0,0,100,100);
    if(k==='sunset'){circ(x,50,74,22,'rgba(255,240,170,.75)')}
    if(k==='neon'){x.strokeStyle='rgba(255,43,214,.55)';x.lineWidth=1;var off=(t*12)%10;for(var i=0;i<12;i++){x.beginPath();x.moveTo(0,70+i*3+((off/10)*3));x.lineTo(100,70+i*3+((off/10)*3));x.stroke()}x.strokeStyle='rgba(34,240,255,.5)';for(var j=-6;j<=6;j++){x.beginPath();x.moveTo(50+j*4,70);x.lineTo(50+j*22,100);x.stroke()}}
    if(k==='space'){for(var s=0;s<30;s++){var tw=.4+.6*Math.abs(Math.sin(t*1.5+s));x.fillStyle='rgba(255,255,255,'+tw+')';x.fillRect((s*41.3)%100,(s*67.1)%100,s%6?1:1.8,s%6?1:1.8)}circ(x,84,18,7,'#ff9a5a');x.strokeStyle='rgba(255,220,180,.7)';x.lineWidth=1.4;x.beginPath();x.ellipse(84,18,12,3,-.3,0,PI*2);x.stroke()}
    if(k==='confetti'){var cs=['#ff5d8f','#3fc1ff','#ffd23f','#58f29b','#a855f7'];for(var c=0;c<26;c++){var yy=((c*29.7)+t*14*(1+c%3))%110-6;x.save();x.translate((c*37.3)%100,yy);x.rotate(t*2+c);x.fillStyle=cs[c%5];x.fillRect(-1.6,-.8,3.2,1.6);x.restore()}}
    if(k==='glitchbg'){for(var r=0;r<14;r++){var yy2=(r*7.3+Math.floor(t*8)*3.1)%100,ww=10+(r*13)%40;x.fillStyle=r%2?'rgba(255,43,214,.35)':'rgba(34,240,255,.35)';x.fillRect((r*31+Math.floor(t*6)*17)%100-10,yy2,ww,2+(r%3))}}
  }
  /* draw a character. opts: {bg:true,round:true,blink:false,t:seconds,look:-1..1} */
  function draw(ctx,code,cx,cy,size,opts){opts=opts||{};var o=typeof code==='string'||!code?dec(code||mine()||'00000000'):code,t=opts.t||0;
    ctx.save();ctx.translate(cx-size/2,cy-size/2);ctx.scale(size/100,size/100);
    if(opts.round){ctx.beginPath();ctx.arc(50,50,50,0,PI*2);ctx.clip()}
    if(opts.bg!==false)drawBg(ctx,o,t);
    var bob=opts.still?0:Math.sin(t*2.2)*1.6;ctx.translate(0,bob);
    if(opts.round){ctx.translate(50,54);ctx.scale(.86,.86);ctx.translate(-50,-54)}
    drawBody(ctx,o,t);drawFace(ctx,o,t);drawEyes(ctx,o,t,opts.blink,opts.look);if(pick(o,'face')==='shades'||pick(o,'face')==='mask'||pick(o,'face')==='patch')drawFace(ctx,o,t);drawMouth(ctx,o,t);drawHead(ctx,o,t);drawHold(ctx,o,t);
    ctx.restore()}
  var cache={};
  function url(code,size){code=code||mine()||'00000000';size=size||64;var key=code+'|'+size;if(cache[key])return cache[key];
    var c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),code,size/2,size/2,size,{round:true,still:true});return cache[key]=c.toDataURL('image/png')}
  window.AGAv={CATS:CATS,dec:dec,enc:enc,draw:draw,url:url,mine:mine,setMine:setMine,owned:owned,own:own,free:free,pick:pick};
})();
