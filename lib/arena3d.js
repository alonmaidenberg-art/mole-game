/* Small helper layer on top of three.js for the 3D sports games. Global: A3 */
(function(){
'use strict';
var A3={};window.A3=A3;
A3.mat=function(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))};
A3.basic=function(c,o){return new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}))};
A3.stage=function(canvas,o){
  o=o||{};var r=new THREE.WebGLRenderer({canvas:canvas,antialias:true});r.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
  var sc=new THREE.Scene(),cv=document.createElement('canvas');cv.width=2;cv.height=256;var g=cv.getContext('2d'),gr=g.createLinearGradient(0,0,0,256),cols=o.sky||['#2b2f8f','#5cabd8','#ffb36b'];
  cols.forEach(function(c,i){gr.addColorStop(i/(cols.length-1),c)});g.fillStyle=gr;g.fillRect(0,0,2,256);sc.background=new THREE.CanvasTexture(cv);
  sc.fog=new THREE.Fog(o.fog||0x8a55d8,o.fogNear||60,o.fogFar||190);
  var cam=new THREE.PerspectiveCamera(o.fov||50,1,.1,500);
  sc.add(new THREE.HemisphereLight(0xdfe8ff,0x8a6a4a,.62));var d=new THREE.DirectionalLight(0xffffff,.7);d.position.set(14,30,12);sc.add(d);
  function resize(){var w=innerWidth,h=innerHeight;r.setSize(w,h,false);canvas.style.width=w+'px';canvas.style.height=h+'px';cam.aspect=w/h;cam.updateProjectionMatrix()}
  addEventListener('resize',resize);resize();
  return {r:r,sc:sc,cam:cam,resize:resize,render:function(){r.render(sc,cam)}};
};
/* ---- humanoid ---- */
A3.human=function(o){
  var g=new THREE.Group(),skin=o.skin||0xf0c8a0,body=new THREE.Group();body.position.y=1;g.add(body);
  function M(geo,col){return new THREE.Mesh(geo,A3.mat(col))}
  function limb(len,rad,col,z,y,sc){var p=new THREE.Group();p.position.set(0,y,z);var m=M(new THREE.CapsuleGeometry(rad,len,4,8),col);m.position.y=-len/2-rad*.6;p.add(m);body.add(p);return p}
  var legL=limb(.5,.1,skin,-.13,-.05),legR=limb(.5,.1,skin,.13,-.05);
  [legL,legR].forEach(function(l){var s=M(new THREE.BoxGeometry(.32,.12,.17),0xffffff);s.position.set(.05,-.78,0);l.add(s)});
  var shorts=M(new THREE.BoxGeometry(.4,.26,.42),o.col);shorts.position.set(0,.02,0);body.add(shorts);
  var torso=M(new THREE.CapsuleGeometry(.2,.36,4,10),o.col);torso.position.set(0,.42,0);torso.scale.set(.72,1,1.2);body.add(torso);
  var stripe=M(new THREE.BoxGeometry(.02,.28,.2),0xffffff);stripe.position.set(.15,.46,0);body.add(stripe);
  var armL=limb(.42,.07,skin,-.3,.62),armR=limb(.42,.07,skin,.3,.62);
  var head=M(new THREE.SphereGeometry(.17,14,12),skin);head.position.set(0,.93,0);body.add(head);
  var hair=M(new THREE.SphereGeometry(.18,12,8,0,Math.PI*2,0,Math.PI*.55),o.hair||0x2a1a10);hair.position.set(-.015,.95,0);body.add(hair);
  [-.06,.06].forEach(function(z){var e=M(new THREE.BoxGeometry(.03,.04,.03),0x111111);e.position.set(.16,.96,z);body.add(e)});
  var cape=new THREE.Group();cape.position.set(-.14,.66,0);var cm=new THREE.Mesh(new THREE.PlaneGeometry(.6,1),new THREE.MeshLambertMaterial({color:o.cape||0xe0222a,side:THREE.DoubleSide}));cm.rotation.y=Math.PI/2;cm.position.y=-.5;cape.add(cm);cape.visible=false;body.add(cape);
  var ice=new THREE.Mesh(new THREE.BoxGeometry(.9,2.1,.9),new THREE.MeshLambertMaterial({color:0x9fe8ff,transparent:true,opacity:.55}));ice.position.y=1;ice.visible=false;g.add(ice);
  var aura=new THREE.Mesh(new THREE.SphereGeometry(1.25,16,12),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:.22}));aura.position.y=1.1;aura.visible=false;g.add(aura);
  var sh=new THREE.Mesh(new THREE.CircleGeometry(.5,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35}));sh.rotation.x=-Math.PI/2;sh.position.y=.03;
  var H={group:g,shadow:sh,cape:cape,ice:ice,aura:aura,body:body};
  H.pose=function(t,s){var sw=Math.sin(t*13)*.95*s.run;
    legL.rotation.z=s.air?-.8:sw;legR.rotation.z=s.air?.5:-sw;
    var a=s.shoot?-2.9:s.carry?-1.0:-sw*.8,b=s.shoot?-2.9:s.carry?-1.0:sw*.8;if(s.fly){a=b=-3.1}if(s.climb){a=-2.9;b=-2.9}if(s.stun){a=b=.3}
    armL.rotation.z=a;armR.rotation.z=b;
    body.rotation.z=s.fly?-1.25:s.dash?-.5:s.crouch?.2:0;body.position.y=1+(s.run&&!s.air?Math.abs(Math.sin(t*13))*.05:0)+(s.fly?.3:0);
    cape.rotation.z=-(.25+(s.fly||s.cape?.7:.1)+Math.sin(t*9)*.12)};
  return H};
/* ---- particles ---- */
A3.particles=function(sc,n){var list=[],geo=new THREE.BoxGeometry(.14,.14,.14);
  for(var i=0;i<n;i++){var m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true}));m.visible=false;sc.add(m);list.push({m:m,l:0,vx:0,vy:0,vz:0,g:0,life:1})}
  var idx=0;
  return {burst:function(p,col,cnt,sp,grav){for(var k=0;k<cnt;k++){var q=list[idx++%n];q.m.visible=true;q.m.position.copy(p);q.m.material.color.set(col);q.l=q.life=.5+Math.random()*.6;var a=Math.random()*6.28,e=(Math.random()-.3)*2,s=(sp||5)*(.3+Math.random());q.vx=Math.cos(a)*s;q.vz=Math.sin(a)*s;q.vy=e*s*.8+2;q.g=grav==null?-9:grav;q.m.scale.setScalar(.6+Math.random()*1.2)}},
   update:function(dt){for(var i=0;i<n;i++){var q=list[i];if(q.l<=0)continue;q.l-=dt;if(q.l<=0){q.m.visible=false;continue}q.vy+=q.g*dt;q.m.position.x+=q.vx*dt;q.m.position.y+=q.vy*dt;q.m.position.z+=q.vz*dt;q.m.material.opacity=q.l/q.life}}}};
/* ---- DOM popups projected from the 3D world ---- */
A3.pop=function(stage,text,pos,color){var el=document.createElement('div');el.className='a3pop';el.textContent=text;el.style.color=color||'#fff';var v=pos.clone().project(stage.cam);
  el.style.left=((v.x*.5+.5)*innerWidth)+'px';el.style.top=((-v.y*.5+.5)*innerHeight)+'px';document.body.appendChild(el);setTimeout(function(){el.remove()},1100)};
/* ---- touch controls: joystick + buttons. returns live state object ---- */
A3.touchUI=function(btns){var S={x:0,z:0},wrap=document.createElement('div');wrap.id='a3touch';
  var zone=document.createElement('div');zone.className='a3zone';var knob=document.createElement('div');knob.className='a3knob';zone.appendChild(knob);wrap.appendChild(zone);
  var id=null,cx=0,cy=0;function mv(e){var dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy),m=46;if(l>m){dx=dx/l*m;dy=dy/l*m}knob.style.transform='translate('+dx+'px,'+dy+'px)';S.x=dx/m;S.z=dy/m}
  zone.addEventListener('pointerdown',function(e){e.preventDefault();id=e.pointerId;var r=zone.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;zone.setPointerCapture(id);mv(e)});
  zone.addEventListener('pointermove',function(e){if(e.pointerId===id)mv(e)});
  function up(e){if(e.pointerId===id){id=null;S.x=S.z=0;knob.style.transform=''}}zone.addEventListener('pointerup',up);zone.addEventListener('pointercancel',up);
  var right=document.createElement('div');right.className='a3btns';wrap.appendChild(right);
  btns.forEach(function(b){var el=document.createElement('button');el.textContent=b[1];el.className='a3b '+(b[2]||'');S[b[0]]=0;function on(e){e.preventDefault();S[b[0]]=1;el.classList.add('on')}function off(e){e.preventDefault();S[b[0]]=0;el.classList.remove('on')}
    el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointerleave',off);el.addEventListener('pointercancel',off);right.appendChild(el)});
  document.body.appendChild(wrap);S.el=wrap;return S};
A3.css='.a3pop{position:fixed;z-index:20;transform:translate(-50%,-50%);font:900 26px system-ui;text-shadow:0 2px 0 #000,0 0 6px #000;pointer-events:none;animation:a3up 1.1s ease-out forwards;white-space:nowrap}@keyframes a3up{to{transform:translate(-50%,-190%);opacity:0}}#a3touch{position:fixed;left:0;right:0;bottom:0;height:46vh;z-index:9;pointer-events:none;display:none;direction:ltr}.a3zone{position:absolute;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.1);border:3px solid rgba(255,255,255,.3);pointer-events:auto;touch-action:none}.a3knob{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:rgba(255,255,255,.4);border:3px solid rgba(255,255,255,.7)}.a3btns{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));width:230px;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;pointer-events:none}.a3b{pointer-events:auto;width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,.55);background:rgba(20,12,60,.55);color:#fff;font-size:26px;font-weight:900;touch-action:none}.a3b.big{width:84px;height:84px;background:rgba(242,106,27,.6);font-size:34px}.a3b.on{background:rgba(255,160,40,.85)}';
var st=document.createElement('style');st.textContent=A3.css;document.head.appendChild(st);
})();
