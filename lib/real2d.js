/* real2d.js — sharpness and shading helpers for the 2D canvas games.
   (c) Alon Maidenberg 2026. */
(function(){
'use strict';
var R2={};

/* Keep a canvas rendering at the screen's real pixel density.
   Without this an 800px canvas stretched across a 1920px screen shows its pixels. */
R2.sharp=function(canvas,ctx,W,H,onResize){
  function apply(){
    var r=canvas.getBoundingClientRect();
    var cw=r.width||canvas.clientWidth||W,ch=r.height||canvas.clientHeight||H;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var bw=Math.max(1,Math.round(cw*dpr)),bh=Math.max(1,Math.round(ch*dpr));
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}
    ctx.setTransform(bw/W,0,0,bh/H,0,0);
    ctx.imageSmoothingEnabled=true;
    if(ctx.imageSmoothingQuality)ctx.imageSmoothingQuality='high';
    if(onResize)onResize(bw/W,bh/H);
  }
  apply();
  addEventListener('resize',apply);
  if(window.ResizeObserver){try{new ResizeObserver(apply).observe(canvas)}catch(e){}}
  setTimeout(apply,60);setTimeout(apply,400);
  return apply};

/* ---------- shading helpers ---------- */
R2.round=function(g,x,y,w,h,r){
  r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
  g.beginPath();
  if(g.roundRect){g.roundRect(x,y,w,h,r);return}
  g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};

R2.shadow=function(g,blur,color,ox,oy){
  g.shadowBlur=blur;g.shadowColor=color||'rgba(0,0,0,.45)';
  g.shadowOffsetX=ox||0;g.shadowOffsetY=oy===undefined?blur*.35:oy};
R2.noShadow=function(g){g.shadowBlur=0;g.shadowColor='transparent';g.shadowOffsetX=0;g.shadowOffsetY=0};

/* a shaded sphere: highlight, body, rim light and contact shadow */
R2.ball=function(g,x,y,r,col,opt){
  opt=opt||{};
  if(opt.shadow!==false){
    g.save();g.globalAlpha=opt.shadowAlpha||.3;g.fillStyle='#000';
    g.beginPath();g.ellipse(x,y+r*.92,r*.92,r*.3,0,0,7);g.fill();g.restore()}
  var grd=g.createRadialGradient(x-r*.36,y-r*.42,r*.06,x,y,r);
  grd.addColorStop(0,opt.hi||R2.lighten(col,.55));
  grd.addColorStop(.55,col);
  grd.addColorStop(1,opt.lo||R2.darken(col,.42));
  g.fillStyle=grd;g.beginPath();g.arc(x,y,r,0,7);g.fill();
  if(opt.rim!==false){
    g.save();g.globalAlpha=.35;g.strokeStyle=R2.lighten(col,.7);g.lineWidth=Math.max(1,r*.09);
    g.beginPath();g.arc(x,y,r*.93,Math.PI*.15,Math.PI*.85);g.stroke();g.restore()}
  if(opt.gloss!==false){
    g.save();g.globalAlpha=.5;g.fillStyle='#fff';
    g.beginPath();g.ellipse(x-r*.34,y-r*.4,r*.26,r*.17,-.6,0,7);g.fill();g.restore()}};

/* a rounded block with bevel and inner shading */
R2.block=function(g,x,y,w,h,r,col,opt){
  opt=opt||{};
  var grd=g.createLinearGradient(x,y,x,y+h);
  grd.addColorStop(0,R2.lighten(col,.3));grd.addColorStop(.5,col);grd.addColorStop(1,R2.darken(col,.3));
  if(opt.shadow!==false){g.save();R2.shadow(g,Math.max(4,h*.25),'rgba(0,0,0,.35)',0,Math.max(2,h*.1))}
  g.fillStyle=grd;R2.round(g,x,y,w,h,r===undefined?Math.min(w,h)*.22:r);g.fill();
  if(opt.shadow!==false)g.restore();
  g.save();g.globalAlpha=.5;g.strokeStyle=R2.lighten(col,.6);g.lineWidth=Math.max(1,Math.min(w,h)*.06);
  R2.round(g,x+g.lineWidth/2,y+g.lineWidth/2,w-g.lineWidth,h*.5,(r===undefined?Math.min(w,h)*.22:r)*.8);
  g.stroke();g.restore()};

R2.glow=function(g,x,y,r,color,alpha){
  var grd=g.createRadialGradient(x,y,0,x,y,r);
  grd.addColorStop(0,color);grd.addColorStop(1,'rgba(0,0,0,0)');
  g.save();g.globalAlpha=alpha===undefined?.5:alpha;g.globalCompositeOperation='lighter';
  g.fillStyle=grd;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.restore()};

R2.vignette=function(g,W,H,strength){
  var grd=g.createRadialGradient(W/2,H*.46,Math.min(W,H)*.28,W/2,H*.5,Math.max(W,H)*.78);
  grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,'rgba(0,0,0,'+(strength===undefined?.34:strength)+')');
  g.fillStyle=grd;g.fillRect(0,0,W,H)};

/* ---------- colour utilities ---------- */
function parse(c){
  if(typeof c==='number')return[(c>>16)&255,(c>>8)&255,c&255];
  c=String(c).trim();
  if(c[0]==='#'){
    if(c.length===4)return[parseInt(c[1]+c[1],16),parseInt(c[2]+c[2],16),parseInt(c[3]+c[3],16)];
    return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]}
  var m=c.match(/rgba?\(([^)]+)\)/);
  if(m){var p=m[1].split(',');return[+p[0],+p[1],+p[2]]}
  var hs=c.match(/hsla?\(([^)]+)\)/);
  if(hs){
    var q=hs[1].split(','),h=(parseFloat(q[0])%360+360)%360/360,
        sa=parseFloat(q[1])/100,l=parseFloat(q[2])/100;
    if(sa===0){var g0=Math.round(l*255);return[g0,g0,g0]}
    var v2=l<.5?l*(1+sa):l+sa-l*sa,v1=2*l-v2;
    function hue(t){t=t<0?t+1:t>1?t-1:t;
      if(t<1/6)return v1+(v2-v1)*6*t;
      if(t<1/2)return v2;
      if(t<2/3)return v1+(v2-v1)*(2/3-t)*6;
      return v1}
    return[Math.round(hue(h+1/3)*255),Math.round(hue(h)*255),Math.round(hue(h-1/3)*255)]}
  return[128,128,128]}
function clamp255(v){return v<0?0:v>255?255:v|0}
R2.lighten=function(c,t){var p=parse(c);return'rgb('+clamp255(p[0]+(255-p[0])*t)+','+clamp255(p[1]+(255-p[1])*t)+','+clamp255(p[2]+(255-p[2])*t)+')'};
R2.darken=function(c,t){var p=parse(c);return'rgb('+clamp255(p[0]*(1-t))+','+clamp255(p[1]*(1-t))+','+clamp255(p[2]*(1-t))+')'};
R2.alpha=function(c,a){var p=parse(c);return'rgba('+p[0]+','+p[1]+','+p[2]+','+a+')'};
R2.mix=function(a,b,t){var x=parse(a),y=parse(b);return'rgb('+clamp255(x[0]+(y[0]-x[0])*t)+','+clamp255(x[1]+(y[1]-x[1])*t)+','+clamp255(x[2]+(y[2]-x[2])*t)+')'};

/* ---------- generated 2D textures ---------- */
R2.noiseCanvas=function(w,h,base,amount,seed){
  var c=document.createElement('canvas');c.width=w;c.height=h;
  var g=c.getContext('2d'),s=seed||7;
  function rnd(){s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}
  g.fillStyle=base||'#888';g.fillRect(0,0,w,h);
  var n=Math.round(w*h*(amount===undefined?.5:amount));
  for(var i=0;i<n;i++){
    var x=rnd()*w,y=rnd()*h,v=rnd();
    g.fillStyle='rgba('+(v<.5?'0,0,0,':'255,255,255,')+(.02+rnd()*.09).toFixed(3)+')';
    g.fillRect(x,y,1,1)}
  return c};

window.R2=R2;
})();
