/* loader.js — animated loading screen + page transitions
   © 2026 Alon Maidenberg */
(function(){
'use strict';

/* ── CONFIG ── */
var DARK='#0a0620', NEON1='#ff3dff', NEON2='#00f5ff', GOLD='#ffd23f';
var MIN_MS=3800; // minimum show time

/* ── CREATE OVERLAY ── */
var ov=document.createElement('div');
ov.id='ag-loader';
ov.style.cssText='position:fixed;inset:0;z-index:99999;background:'+DARK+';display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;transition:opacity .5s ease';

var cv=document.createElement('canvas');
cv.style.cssText='width:min(480px,96vw);height:auto;max-height:60vh';
var W=600,H=320;
cv.width=W;cv.height=H;

var title=document.createElement('div');
title.style.cssText='font-family:system-ui,-apple-system,sans-serif;font-weight:900;font-size:clamp(22px,5vw,34px);color:#fff;margin-top:16px;letter-spacing:1px;text-shadow:0 0 20px '+NEON1;
title.textContent='משחקי אלון';

var bar=document.createElement('div');
bar.style.cssText='width:min(300px,80vw);height:6px;background:rgba(255,255,255,.12);border-radius:3px;margin-top:14px;overflow:hidden';
var fill=document.createElement('div');
fill.style.cssText='height:100%;width:0%;background:linear-gradient(90deg,'+NEON1+','+NEON2+');border-radius:3px;transition:width .2s ease';
bar.appendChild(fill);

ov.appendChild(cv);ov.appendChild(title);ov.appendChild(bar);
document.documentElement.appendChild(ov);

var ctx=cv.getContext('2d');
var t=0;

/* ── PARTICLES ── */
var particles=[];
for(var i=0;i<18;i++){
  particles.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.5+.5,c:[NEON1,NEON2,'#a855f7','#22d3ee','#4ade80'][Math.floor(Math.random()*5)],a:Math.random()});
}

/* ── DRAW FUNCTIONS ── */
function drawCar(x,y,sc,flip){
  ctx.save();ctx.translate(x,y);ctx.scale(flip?-sc:sc,sc);
  // shadow
  ctx.save();ctx.scale(1,.3);ctx.beginPath();ctx.ellipse(0,110,52,16,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fill();ctx.restore();
  // body bottom
  ctx.beginPath();ctx.roundRect(-48,52,96,32,[8]);ctx.fillStyle='#e63946';ctx.fill();
  // body top (cabin)
  ctx.beginPath();ctx.moveTo(-30,52);ctx.lineTo(-38,18);ctx.lineTo(32,18);ctx.lineTo(44,52);ctx.closePath();ctx.fillStyle='#c1121f';ctx.fill();
  // windshield
  ctx.beginPath();ctx.moveTo(-24,50);ctx.lineTo(-30,24);ctx.lineTo(28,24);ctx.lineTo(36,50);ctx.closePath();ctx.fillStyle='rgba(0,245,255,.55)';ctx.fill();
  // lights front
  ctx.beginPath();ctx.roundRect(38,56,10,8,[3]);ctx.fillStyle='#ffd23f';ctx.fill();
  ctx.beginPath();ctx.roundRect(38,56,10,8,[3]);ctx.fillStyle='rgba(255,210,63,.5)';ctx.lineWidth=3;ctx.strokeStyle='#ffd23f';ctx.stroke();
  // lights back
  ctx.beginPath();ctx.roundRect(-48,56,8,8,[3]);ctx.fillStyle='#ff3d71';ctx.fill();
  // wheels
  [[28,80],[28-56,80]].forEach(function(w){
    ctx.beginPath();ctx.arc(w[0],w[1],16,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
    ctx.beginPath();ctx.arc(w[0],w[1],9,0,Math.PI*2);ctx.fillStyle='#555';ctx.fill();
    ctx.beginPath();ctx.arc(w[0],w[1],4,0,Math.PI*2);ctx.fillStyle='#888';ctx.fill();
  });
  // exhaust smoke puffs (behind car)
  var sm=Math.sin(t*.07);
  ctx.globalAlpha=.3+sm*.1;
  [1,2].forEach(function(i){
    ctx.beginPath();ctx.arc(-52-i*14,72+sm*4,6+i*2,0,Math.PI*2);ctx.fillStyle='#aaa';ctx.fill();
  });
  ctx.globalAlpha=1;
  ctx.restore();
}

function drawPacman(x,y,sc){
  ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  var mouth=Math.abs(Math.sin(t*.12))*.7;
  // body
  ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,32,mouth,Math.PI*2-mouth);ctx.closePath();ctx.fillStyle=GOLD;ctx.fill();
  // eye
  ctx.beginPath();ctx.arc(8,-14,5,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
  // dots trail
  ctx.restore();
}

function drawDots(startX,y,count){
  for(var i=0;i<count;i++){
    var alpha=((startX+i*28+t*.8)%W)/W;
    if(alpha>1)alpha=0;
    ctx.beginPath();ctx.arc(startX+i*28,y,5,0,Math.PI*2);
    ctx.fillStyle='rgba(255,210,63,'+(.3+alpha*.7)+')';ctx.fill();
  }
}

function drawBowlingBall(x,y,sc){
  ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  // shadow
  ctx.save();ctx.scale(1,.35);ctx.beginPath();ctx.ellipse(0,105,30,14,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fill();ctx.restore();
  // ball
  var gr=ctx.createRadialGradient(-10,-10,2,0,0,36);
  gr.addColorStop(0,'#5a2fc2');gr.addColorStop(.5,'#3b1f8c');gr.addColorStop(1,'#1a0a40');
  ctx.beginPath();ctx.arc(0,0,36,0,Math.PI*2);ctx.fillStyle=gr;ctx.fill();
  // shine
  ctx.beginPath();ctx.ellipse(-10,-12,10,6,-0.5,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fill();
  // finger holes
  [[-4,-4],[8,-4],[2,-14]].forEach(function(h){ctx.beginPath();ctx.arc(h[0],h[1],4,0,Math.PI*2);ctx.fillStyle='#0007';ctx.fill();});
  ctx.restore();
}

function drawPhone(x,y,sc,glitch){
  ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  // glitch offset
  var gx=glitch?(Math.random()-.5)*8:0;
  var gy=glitch?(Math.random()-.5)*4:0;
  ctx.translate(gx,gy);
  // phone body
  ctx.beginPath();ctx.roundRect(-28,-54,56,108,[10]);ctx.fillStyle='#1a1a2e';ctx.fill();
  ctx.beginPath();ctx.roundRect(-28,-54,56,108,[10]);ctx.strokeStyle='rgba(255,61,255,.7)';ctx.lineWidth=2;ctx.stroke();
  // screen
  ctx.beginPath();ctx.roundRect(-22,-48,44,96,[6]);ctx.fillStyle='#0d0d1a';ctx.fill();
  // screen content - game pixels
  if(glitch){
    ctx.fillStyle=NEON1;
    for(var i=0;i<6;i++){ctx.fillRect(-18+Math.random()*36,-44+Math.random()*88,Math.random()*12+4,4);}
    ctx.fillStyle=NEON2;
    for(var j=0;j<4;j++){ctx.fillRect(-18+Math.random()*36,-44+Math.random()*88,Math.random()*20+6,3);}
  } else {
    // normal screen: tiny game grid
    ctx.fillStyle='rgba(0,245,255,.6)';
    for(var r=0;r<8;r++){for(var c=0;c<4;c++){
      if((r+c+Math.floor(t*.03))%3!==0){ctx.fillRect(-18+c*11,-44+r*11,9,9);}
    }}
  }
  // camera
  ctx.beginPath();ctx.arc(0,-56,4,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
  ctx.beginPath();ctx.arc(0,-56,2,0,Math.PI*2);ctx.fillStyle='#333';ctx.fill();
  // home button dot
  ctx.beginPath();ctx.arc(0,56,5,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
}

function drawPingPong(x,y,sc){
  ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  // paddle handle
  ctx.beginPath();ctx.roundRect(-6,30,12,38,[4]);
  ctx.fillStyle='#8B4513';ctx.fill();
  // paddle blade (oval)
  ctx.beginPath();ctx.ellipse(0,10,26,34,0,0,Math.PI*2);
  var gr=ctx.createRadialGradient(-6,-8,2,0,0,32);
  gr.addColorStop(0,'#ff6b6b');gr.addColorStop(1,'#c0392b');
  ctx.fillStyle=gr;ctx.fill();
  // blade shine
  ctx.beginPath();ctx.ellipse(-8,-12,8,5,-.5,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.fill();
  // ball nearby
  var bx=40+Math.sin(t*.18)*12;
  var by=-20+Math.cos(t*.14)*10;
  ctx.beginPath();ctx.arc(bx,by,10,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  ctx.beginPath();ctx.arc(bx-3,by-3,3,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fill();
  ctx.restore();
}

function drawBasketball(x,y,r){
  ctx.save();ctx.translate(x,y);
  var gr=ctx.createRadialGradient(-r*.3,-r*.3,r*.05,0,0,r);
  gr.addColorStop(0,'#ff8c00');gr.addColorStop(.6,'#e65c00');gr.addColorStop(1,'#b34000');
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=gr;ctx.fill();
  // seams
  ctx.strokeStyle='#5a1a00';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  // vertical seam
  ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.5,-r*.5,r*.5,r*.5,0,r);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(-r*.5,-r*.5,-r*.5,r*.5,0,r);ctx.stroke();
  // horizontal seam
  ctx.beginPath();ctx.arc(0,0,r,-Math.PI*.15,Math.PI*.15);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,r,Math.PI-.15,Math.PI+.15);ctx.stroke();
  // shine
  ctx.beginPath();ctx.ellipse(-r*.28,-r*.32,r*.18,r*.1,-.6,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,.28)';ctx.fill();
  ctx.restore();
}

function drawPlaystation(x,y,sc){
  ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  // body
  ctx.beginPath();ctx.roundRect(-60,-28,120,56,[16]);
  ctx.fillStyle='#1a1a2e';ctx.fill();
  ctx.beginPath();ctx.roundRect(-60,-28,120,56,[16]);
  ctx.strokeStyle='rgba(0,245,255,.4)';ctx.lineWidth=1.5;ctx.stroke();
  // grips
  ctx.beginPath();ctx.roundRect(-60,8,28,30,[0,0,10,10]);ctx.fillStyle='#111428';ctx.fill();
  ctx.beginPath();ctx.roundRect(32,8,28,30,[0,0,10,10]);ctx.fillStyle='#111428';ctx.fill();
  // left analog
  ctx.beginPath();ctx.arc(-30,14,13,0,Math.PI*2);ctx.fillStyle='#222';ctx.fill();
  ctx.beginPath();ctx.arc(-30,14,8,0,Math.PI*2);ctx.fillStyle='#333';ctx.fill();
  // right analog
  ctx.beginPath();ctx.arc(14,14,13,0,Math.PI*2);ctx.fillStyle='#222';ctx.fill();
  ctx.beginPath();ctx.arc(14,14,8,0,Math.PI*2);ctx.fillStyle='#333';ctx.fill();
  // d-pad (left)
  [[-44,-10],[-44,2],[-52,-4],[-36,-4]].forEach(function(d){
    ctx.beginPath();ctx.roundRect(d[0]-4,d[1]-4,8,8,[2]);ctx.fillStyle='#2a2a4a';ctx.fill();
  });
  // action buttons ×△○□
  var btns=[{x:42,y:-4,c:'#2266cc'},{x:50,y:-12,c:'#cc2222'},{x:58,y:-4,c:'#22cc22'},{x:50,y:4,c:'#cc22cc'}];
  btns.forEach(function(b){
    ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fillStyle=b.c;ctx.fill();
  });
  // touchpad
  ctx.beginPath();ctx.roundRect(-14,-16,28,16,[4]);ctx.fillStyle='#222';ctx.fill();
  // PS button (center)
  ctx.beginPath();ctx.arc(0,2,7,0,Math.PI*2);ctx.fillStyle='#4fc3f7';ctx.fill();
  ctx.font='bold 7px system-ui';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('PS',0,2);ctx.textBaseline='alphabetic';
  ctx.restore();
}

function drawSpeedLines(x,y,facing){
  ctx.save();ctx.translate(x,y);
  var dir=facing<0?1:-1;
  ctx.strokeStyle='rgba(255,255,100,.18)';ctx.lineWidth=1.5;
  for(var i=0;i<6;i++){
    var ly=-20+i*8;var len=20+Math.random()*30;
    ctx.beginPath();ctx.moveTo(0,ly);ctx.lineTo(dir*len,ly);ctx.stroke();
  }
  ctx.restore();
}

/* ── ANIMATION LOOP ── */
var raf;
function frame(){
  t++;
  ctx.clearRect(0,0,W,H);

  // background
  ctx.fillStyle=DARK;ctx.fillRect(0,0,W,H);

  // grid lines
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  for(var gx=0;gx<W;gx+=40){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
  for(var gy=0;gy<H;gy+=40){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}

  // particles
  particles.forEach(function(p){
    p.x+=p.vx;p.y+=p.vy;p.a+=.01;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;
    if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=p.c;ctx.globalAlpha=.3+Math.sin(p.a)*.2;ctx.fill();
    ctx.globalAlpha=1;
  });

  // two rows of items
  var row1=H*.30, row2=H*.72;

  // ROW 1: Phone(left) + Ping Pong(mid) + PlayStation(right)  — floating
  // PHONE (left, glitching)
  var phoneX=W*.14+Math.sin(t*.04)*7;
  var phoneY=row1+Math.sin(t*.06)*5;
  var glitching=Math.sin(t*.11)>.7;
  if(glitching){
    ctx.save();ctx.fillStyle=NEON1;ctx.globalAlpha=.13;
    ctx.fillRect(phoneX-50,phoneY-18,100,7);
    ctx.fillStyle=NEON2;ctx.fillRect(phoneX-50,phoneY+2,80,5);
    ctx.globalAlpha=1;ctx.restore();
  }
  drawPhone(phoneX,phoneY,.78,glitching);
  ctx.font='bold 11px system-ui';ctx.fillStyle='rgba(255,61,255,.85)';ctx.textAlign='center';
  ctx.fillText('BOSS MODE',phoneX,phoneY+72);

  // PING PONG (center top, bobbing + spinning)
  var ppX=W*.5;
  var ppY=row1+Math.sin(t*.07)*8;
  ctx.save();ctx.translate(ppX,ppY);ctx.rotate(Math.sin(t*.05)*.35);
  drawPingPong(0,0,.95);ctx.restore();
  ctx.font='bold 11px system-ui';ctx.fillStyle='rgba(0,245,255,.8)';ctx.textAlign='center';
  ctx.fillText('פינג פונג',ppX,ppY+76);

  // PLAYSTATION (right, floating)
  var psX=W*.86+Math.sin(t*.05)*6;
  var psY=row1+Math.cos(t*.07)*6;
  drawPlaystation(psX,psY,.82);
  ctx.font='bold 11px system-ui';ctx.fillStyle='rgba(79,195,247,.9)';ctx.textAlign='center';
  ctx.fillText('🎮 שלט',psX,psY+44);

  // ROW 2: ground line
  ctx.beginPath();ctx.moveTo(0,row2+6);ctx.lineTo(W,row2+6);
  ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.stroke();

  // PAC-MAN running
  var pax=((t*3.0)%(W+120))-50;
  var pay=row2-30;
  drawDots(60,pay+5,9);
  drawPacman(pax,pay,.52);

  // CAR racing
  var carX=((t*2.2+180)%(W+200))-130;
  drawSpeedLines(carX-50,row2-48,1);
  drawCar(carX,row2-28,.46,false);

  // BASKETBALL bouncing
  var bkX=((t*1.4+400)%(W+120))-60;
  var bkBounce=Math.abs(Math.sin(t*.14))*40;
  var bkRot=t*.06;
  ctx.save();ctx.translate(bkX,row2-20-bkBounce);ctx.rotate(bkRot);
  drawBasketball(0,0,20);ctx.restore();
  // squish shadow on ground
  var sqsh=1-bkBounce/40*.6;
  ctx.save();ctx.translate(bkX,row2-2);ctx.scale(sqsh,.3);
  ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fill();ctx.restore();

  // BOWLING BALL rolling
  var bowlX=((t*1.8+600)%(W+120))-60;
  var bowlBounce=Math.abs(Math.sin(t*.08))*10;
  ctx.save();ctx.translate(bowlX,row2-26-bowlBounce);ctx.rotate(t*.05);
  drawBowlingBall(0,0,.48);ctx.restore();

  // neon glow on title area
  var grd=ctx.createLinearGradient(0,0,W,0);
  grd.addColorStop(0,'transparent');grd.addColorStop(.3,NEON1+'22');
  grd.addColorStop(.7,NEON2+'22');grd.addColorStop(1,'transparent');
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,30);

  raf=requestAnimationFrame(frame);
}

/* ── PROGRESS BAR ── */
var prog=0;
var progInterval=setInterval(function(){
  prog=Math.min(prog+(Math.random()*8+2),85);
  fill.style.width=prog+'%';
},120);

/* ── HIDE WHEN READY ── */
var ready=false,elapsed=false;
var startT=Date.now();

setTimeout(function(){elapsed=true;tryHide();},MIN_MS);

function markReady(){ready=true;tryHide();}

function tryHide(){
  if(!ready||!elapsed)return;
  clearInterval(progInterval);
  fill.style.width='100%';
  setTimeout(function(){
    ov.style.opacity='0';
    setTimeout(function(){ov.remove();cancelAnimationFrame(raf);},520);
  },300);
}

/* listen for page load */
if(document.readyState==='complete'){markReady();}
else{window.addEventListener('load',markReady,{once:true});}

frame();

/* ── PAGE TRANSITION ── */
var transCV=document.createElement('canvas');
transCV.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:99998;pointer-events:none;opacity:0';
document.documentElement.appendChild(transCV);
var tCtx=transCV.getContext('2d');
var transActive=false;

function burst(callback){
  if(transActive){callback&&callback();return;}
  transActive=true;
  transCV.width=window.innerWidth;
  transCV.height=window.innerHeight;
  transCV.style.opacity='1';
  var TW=transCV.width,TH=transCV.height;
  var cx=TW/2,cy=TH/2;
  var COLS=['#ff3dff','#00f5ff','#ffd23f','#ff3d71','#4ade80','#a855f7','#f97316'];
  var shards=[];
  var count=22;
  for(var i=0;i<count;i++){
    var ang=((Math.PI*2)/count)*i+Math.random()*.3;
    var spd=Math.max(TW,TH)*.012+Math.random()*.006;
    shards.push({x:cx,y:cy,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
      w:40+Math.random()*80,h:12+Math.random()*20,
      c:COLS[i%COLS.length],a:1,rot:ang});
  }
  var tf=0;
  var traf;
  function tframe(){
    tf++;
    tCtx.clearRect(0,0,TW,TH);
    if(tf<8){
      // white flash
      tCtx.fillStyle='rgba(255,255,255,'+(1-tf/8)+')';
      tCtx.fillRect(0,0,TW,TH);
    }
    var done=true;
    shards.forEach(function(s){
      s.x+=s.vx;s.y+=s.vy;s.vy+=.3;s.a-=.025;s.rot+=.08;
      if(s.a>0){done=false;}
      tCtx.save();tCtx.translate(s.x,s.y);tCtx.rotate(s.rot);
      tCtx.globalAlpha=Math.max(0,s.a);
      tCtx.fillStyle=s.c;
      tCtx.fillRect(-s.w/2,-s.h/2,s.w,s.h);
      tCtx.restore();
    });
    if(done||tf>60){
      transCV.style.opacity='0';
      transActive=false;
      cancelAnimationFrame(traf);
      return;
    }
    traf=requestAnimationFrame(tframe);
  }
  // navigate after a brief flash
  if(callback){setTimeout(callback,120);}
  tframe();
}

/* intercept game card clicks */
document.addEventListener('click',function(e){
  var link=e.target.closest('a[href]');
  if(!link)return;
  var href=link.getAttribute('href');
  if(!href||href.startsWith('http')||href.startsWith('#')||href.startsWith('mailto'))return;
  // internal link — do burst then navigate
  e.preventDefault();
  burst(function(){window.location.href=link.href;});
},true);

/* also trigger when going BACK to hub from a game */
window.addEventListener('pageshow',function(e){
  if(e.persisted){burst();}
});

})();
