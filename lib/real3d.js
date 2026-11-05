/* real3d.js — shared realism helpers for the 3D games.
   (c) Alon Maidenberg 2026. All textures are generated here in code.
   Needs three.min.js (r149) to be loaded first. */
(function(){
'use strict';
if(!window.THREE)return;
var T=THREE,R3={};

/* ---------- small canvas helpers ---------- */
function cvs(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function rngOf(seed){var s=seed||1;return function(){s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}}
R3.cvs=cvs;
var MAXA=4;
R3.tex=function(canvas,rx,ry,srgb){
  var t=new T.CanvasTexture(canvas);
  t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=MAXA;
  if(srgb!==false)t.encoding=T.sRGBEncoding;
  return t};
function grey(canvas){ // same image as a non-colour (roughness) map
  var t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=MAXA;return t}
R3.greyTex=grey;

/* ---------- renderer: tone mapping, colour space, soft shadows ---------- */
R3.upgrade=function(R,o){
  o=o||{};
  var small=Math.min(innerWidth,innerHeight)<740||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
  MAXA=R.capabilities&&R.capabilities.getMaxAnisotropy?R.capabilities.getMaxAnisotropy():4;
  // r149 defaults to legacy colour handling, which washes out plain colours
  if(T.ColorManagement)T.ColorManagement.legacyMode=false;
  R.outputEncoding=T.sRGBEncoding;
  R.toneMapping=T.ACESFilmicToneMapping;
  R.toneMappingExposure=o.exposure!==undefined?o.exposure:1.05;
  if(o.shadows!==false){R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap}
  R.setPixelRatio(Math.min(devicePixelRatio||1,small?1.5:2));
  R3.small=small;
  return R};

/* ---------- environment map, so metal and paint actually reflect ---------- */
var PRESET={
  day:{top:'#9fd4ff',mid:'#dbeeff',horizon:'#f3f0e2',ground:'#4e6a3a',sun:'#fffdf0',sunY:.26,sunX:.62},
  dusk:{top:'#2d2a6e',mid:'#8a5aa8',horizon:'#ff9a5c',ground:'#2a2030',sun:'#ffd9a0',sunY:.46,sunX:.5},
  night:{top:'#060a18',mid:'#101830',horizon:'#1d2a4a',ground:'#070a12',sun:'#dfe8ff',sunY:.18,sunX:.3},
  indoor:{top:'#cfd6ff',mid:'#8e86c8',horizon:'#3a2f5e',ground:'#140f22',sun:'#ffffff',sunY:.1,sunX:.5},
  space:{top:'#05060f',mid:'#0a0d1c',horizon:'#141a30',ground:'#04050a',sun:'#ffffff',sunY:.2,sunX:.7}
};
function envCanvas(kind){
  var p=PRESET[kind]||PRESET.day,c=cvs(1024,512),g=c.getContext('2d');
  var lg=g.createLinearGradient(0,0,0,512);
  lg.addColorStop(0,p.top);lg.addColorStop(.42,p.mid);lg.addColorStop(.5,p.horizon);lg.addColorStop(.56,p.ground);lg.addColorStop(1,p.ground);
  g.fillStyle=lg;g.fillRect(0,0,1024,512);
  var sx=p.sunX*1024,sy=p.sunY*512;
  var rg=g.createRadialGradient(sx,sy,2,sx,sy,190);
  rg.addColorStop(0,p.sun);rg.addColorStop(.12,'rgba(255,250,235,.75)');rg.addColorStop(1,'rgba(255,250,235,0)');
  g.fillStyle=rg;g.fillRect(sx-200,sy-200,400,400);
  if(kind==='day'||kind==='dusk'){ // soft clouds
    var rnd=rngOf(9);g.globalAlpha=kind==='dusk'?.2:.4;g.fillStyle='#ffffff';
    for(var i=0;i<34;i++){var x=rnd()*1024,y=rnd()*180+20,w=60+rnd()*170,h=12+rnd()*26;
      g.beginPath();g.ellipse(x,y,w,h,0,0,7);g.fill()}
    g.globalAlpha=1}
  if(kind==='night'||kind==='space'){
    var r2=rngOf(4);g.fillStyle='#fff';
    for(var k=0;k<420;k++){var X=r2()*1024,Y=r2()*250,s=r2()*1.5+.3;g.globalAlpha=.25+r2()*.75;g.fillRect(X,Y,s,s)}
    g.globalAlpha=1}
  if(kind==='indoor'){
    for(var j=0;j<7;j++){var lx=72+j*145;
      var r3=g.createRadialGradient(lx,56,3,lx,56,86);
      r3.addColorStop(0,'rgba(255,255,255,.95)');r3.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=r3;g.fillRect(lx-90,-34,180,180);
      g.fillStyle='rgba(255,255,255,.92)';g.fillRect(lx-36,45,72,22)}}
  return c}
R3.env=function(R,scene,kind){
  var t=new T.CanvasTexture(envCanvas(kind||'day'));
  t.mapping=T.EquirectangularReflectionMapping;t.encoding=T.sRGBEncoding;
  var pm=new T.PMREMGenerator(R);pm.compileEquirectangularShader();
  var rt=pm.fromEquirectangular(t);
  scene.environment=rt.texture;t.dispose();pm.dispose();
  return rt.texture};
/* big gradient sky dome; also sets a matching fog */
R3.sky=function(scene,kind,o){
  o=o||{};var p=PRESET[kind]||PRESET.day;
  var geo=new T.SphereGeometry(o.radius||600,32,20);
  var m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
    uniforms:{a:{value:new T.Color(p.top)},b:{value:new T.Color(p.mid)},c:{value:new T.Color(p.horizon)}},
    vertexShader:'varying float h;void main(){vec4 w=modelMatrix*vec4(position,1.);h=normalize(w.xyz).y;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform vec3 a,b,c;varying float h;void main(){float t=clamp(h,-1.,1.);vec3 col=t>0.?mix(b,a,pow(t,.65)):mix(b,c,pow(-t,.4));gl_FragColor=vec4(col,1.);}'});
  var sky=new T.Mesh(geo,m);sky.frustumCulled=false;
  sky.userData.noShadow=true;sky.castShadow=false;sky.receiveShadow=false;sky.__r3s=1;
  scene.add(sky);
  if(o.fog!==false)scene.fog=new T.Fog(new T.Color(p.horizon).getHex(),o.fogNear||60,o.fogFar||420);
  scene.background=new T.Color(p.mid);
  return sky};
/* key light with shadows + hemisphere fill */
R3.sun=function(scene,o){
  o=o||{};
  var hemi=new T.HemisphereLight(o.skyColor||0xcfe4ff,o.groundColor||0x4a4030,o.ambient!==undefined?o.ambient:.45);
  scene.add(hemi);
  var key=new T.DirectionalLight(o.color||0xfff6e8,o.intensity!==undefined?o.intensity:1.25);
  var pos=o.position||[60,90,40];key.position.set(pos[0],pos[1],pos[2]);
  if(o.target){key.target.position.set(o.target[0],o.target[1],o.target[2]);scene.add(key.target)}
  if(o.shadow!==false){
    key.castShadow=true;
    var ms=R3.small?1024:(o.mapSize||2048);key.shadow.mapSize.set(ms,ms);
    var r=o.shadowRadius||60,cm=key.shadow.camera;
    cm.left=-r;cm.right=r;cm.top=r;cm.bottom=-r;cm.near=o.near||1;cm.far=o.far||400;
    key.shadow.bias=o.bias!==undefined?o.bias:-.0006;key.shadow.normalBias=o.normalBias!==undefined?o.normalBias:.03}
  scene.add(key);
  return {hemi:hemi,key:key}};

/* ---------- generated textures ---------- */
R3.asphalt=function(seed){
  var c=cvs(512,512),g=c.getContext('2d'),r=rngOf(seed||3),i;
  g.fillStyle='#3a3b3f';g.fillRect(0,0,512,512);
  for(i=0;i<26000;i++){var x=r()*512,y=r()*512,s=.6+r()*2.2,v=r();
    g.fillStyle=v<.42?'rgba(22,22,25,'+(.15+r()*.5).toFixed(2)+')'
      :v<.8?'rgba(96,97,103,'+(.1+r()*.4).toFixed(2)+')'
      :'rgba(150,150,156,'+(.08+r()*.25).toFixed(2)+')';
    g.fillRect(x,y,s,s)}
  for(i=0;i<16;i++){ // patches and cracks
    g.strokeStyle='rgba(18,18,20,'+(.1+r()*.22).toFixed(2)+')';g.lineWidth=.6+r()*1.8;
    g.beginPath();var px=r()*512,py=r()*512;g.moveTo(px,py);
    for(var k=0;k<7;k++){px+=(r()-.5)*120;py+=(r()-.5)*120;g.lineTo(px,py)}g.stroke()}
  for(i=0;i<9;i++){var ox=r()*512,oy=r()*512,or_=30+r()*90;
    var rg=g.createRadialGradient(ox,oy,2,ox,oy,or_);
    rg.addColorStop(0,'rgba(70,71,76,.3)');rg.addColorStop(1,'rgba(70,71,76,0)');
    g.fillStyle=rg;g.beginPath();g.arc(ox,oy,or_,0,7);g.fill()}
  return c};
R3.grass=function(seed){
  var c=cvs(512,512),g=c.getContext('2d'),r=rngOf(seed||11),i;
  g.fillStyle='#4e8a3c';g.fillRect(0,0,512,512);
  for(i=0;i<14;i++){var ox=r()*512,oy=r()*512,or_=50+r()*140;
    var rg=g.createRadialGradient(ox,oy,4,ox,oy,or_);
    rg.addColorStop(0,'rgba('+(r()<.5?'96,140,62':'62,108,48')+',.5)');rg.addColorStop(1,'rgba(80,120,56,0)');
    g.fillStyle=rg;g.beginPath();g.arc(ox,oy,or_,0,7);g.fill()}
  for(i=0;i<30000;i++){var x=r()*512,y=r()*512,h=1.4+r()*3.4;
    var sh=r();g.strokeStyle=sh<.33?'rgba(42,88,34,.5)':sh<.7?'rgba(96,152,60,.45)':'rgba(132,180,78,.4)';
    g.lineWidth=.7;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*1.6,y-h);g.stroke()}
  return c};
R3.wood=function(seed,tones){
  var Wc=512,Hc=1024,c=cvs(Wc,Hc),g=c.getContext('2d'),r=rngOf(seed||7);
  var pal=tones||['#d6a263','#cd9856','#c99250','#d9a86b','#c68d4a'],planks=10,pw=Wc/planks;
  for(var i=0;i<planks;i++){var x=i*pw;
    g.fillStyle=pal[i%pal.length];g.fillRect(x,0,pw,Hc);
    for(var k=0;k<22;k++){var gx=x+r()*pw,amp=.6+r()*1.8;
      g.strokeStyle='rgba(96,58,20,'+(.035+r()*.09).toFixed(3)+')';g.lineWidth=.4+r()*1.5;
      g.beginPath();g.moveTo(gx,0);
      for(var y=0;y<=Hc;y+=48)g.lineTo(gx+Math.sin(y*.0075+k*1.7)*amp,y);
      g.stroke()}
    g.fillStyle='rgba(58,32,10,.4)';g.fillRect(x,0,1.2,Hc)}
  return c};
R3.concrete=function(seed){
  var c=cvs(512,512),g=c.getContext('2d'),r=rngOf(seed||5),i;
  g.fillStyle='#8d8e8c';g.fillRect(0,0,512,512);
  for(i=0;i<20000;i++){var x=r()*512,y=r()*512,s=.6+r()*2;
    g.fillStyle='rgba('+(r()<.5?'120,121,119':'70,71,70')+','+(.05+r()*.3).toFixed(2)+')';g.fillRect(x,y,s,s)}
  for(i=0;i<10;i++){var ox=r()*512,oy=r()*512,or_=40+r()*110;
    var rg=g.createRadialGradient(ox,oy,3,ox,oy,or_);
    rg.addColorStop(0,'rgba(60,61,60,.22)');rg.addColorStop(1,'rgba(60,61,60,0)');
    g.fillStyle=rg;g.beginPath();g.arc(ox,oy,or_,0,7);g.fill()}
  return c};
R3.sand=function(seed){
  var c=cvs(512,512),g=c.getContext('2d'),r=rngOf(seed||13),i;
  g.fillStyle='#d9c08a';g.fillRect(0,0,512,512);
  for(i=0;i<24000;i++){var x=r()*512,y=r()*512;
    g.fillStyle='rgba('+(r()<.5?'196,170,118':'240,226,186')+','+(.1+r()*.4).toFixed(2)+')';
    g.fillRect(x,y,.7+r()*1.6,.7+r()*1.6)}
  return c};
R3.metalBrushed=function(seed,base){
  var c=cvs(512,512),g=c.getContext('2d'),r=rngOf(seed||17);
  g.fillStyle=base||'#9aa0a8';g.fillRect(0,0,512,512);
  for(var i=0;i<5000;i++){var y=r()*512;
    g.strokeStyle='rgba('+(r()<.5?'255,255,255':'60,64,70')+','+(.02+r()*.1).toFixed(3)+')';
    g.lineWidth=.5+r()*1.3;g.beginPath();g.moveTo(0,y);g.lineTo(512,y+(r()-.5)*3);g.stroke()}
  return c};

/* ---------- materials ---------- */
R3.paint=function(color,o){o=o||{};return new T.MeshPhysicalMaterial({
  color:color,roughness:o.roughness!==undefined?o.roughness:.34,metalness:o.metalness!==undefined?o.metalness:.05,
  clearcoat:o.clearcoat!==undefined?o.clearcoat:.9,clearcoatRoughness:o.clearcoatRoughness!==undefined?o.clearcoatRoughness:.08,
  envMapIntensity:o.envMapIntensity!==undefined?o.envMapIntensity:.4})};
R3.glass=function(o){o=o||{};return new T.MeshPhysicalMaterial({
  color:o.color!==undefined?o.color:0x0d1420,roughness:o.roughness!==undefined?o.roughness:.06,metalness:0,
  clearcoat:1,clearcoatRoughness:.03,envMapIntensity:o.envMapIntensity!==undefined?o.envMapIntensity:1.6,
  transparent:o.opacity!==undefined,opacity:o.opacity!==undefined?o.opacity:1})};
R3.rubber=function(o){o=o||{};return new T.MeshStandardMaterial({
  color:o.color!==undefined?o.color:0x14151a,roughness:.88,metalness:0,envMapIntensity:.25})};
R3.chrome=function(o){o=o||{};return new T.MeshStandardMaterial({
  color:o.color!==undefined?o.color:0xdfe3e8,roughness:o.roughness!==undefined?o.roughness:.16,metalness:1,envMapIntensity:1.4})};
R3.emissive=function(color,strength){return new T.MeshStandardMaterial({
  color:0x111111,emissive:color,emissiveIntensity:strength===undefined?2:strength,roughness:.4})};

/* every Lambert/Phong material created from now on becomes a properly shaded
   Standard one, so meshes a game spawns while playing are covered too */
R3.autoMaterials=function(o){
  o=o||{};
  ['MeshLambertMaterial','MeshPhongMaterial'].forEach(function(n){
    var Orig=T[n];if(!Orig||Orig.__r3)return;
    function Patched(params){
      var p={},k;params=params||{};
      for(k in params)p[k]=params[k];
      delete p.shininess;delete p.specular;delete p.reflectivity;delete p.combine;
      if(p.roughness===undefined)p.roughness=o.roughness!==undefined?o.roughness:.74;
      if(p.metalness===undefined)p.metalness=o.metalness!==undefined?o.metalness:.04;
      if(p.envMapIntensity===undefined)p.envMapIntensity=o.envMapIntensity!==undefined?o.envMapIntensity:.5;
      return new T.MeshStandardMaterial(p)}
    Patched.__r3=1;T[n]=Patched})};

/* give every mesh added to the scene sensible shadow flags, now and later */
R3.shadowAll=function(){
  if(T.Object3D.prototype.__r3add)return;
  var add=T.Object3D.prototype.add;
  T.Object3D.prototype.add=function(){
    for(var i=0;i<arguments.length;i++){
      var ob=arguments[i];
      if(ob&&ob.traverse)ob.traverse(function(m){
        if(!m.isMesh||m.__r3s||(m.userData&&m.userData.noShadow))return;
        m.__r3s=1;
        var g=m.geometry,flat=g&&g.type==='PlaneGeometry',
            huge=g&&g.boundingSphere===null&&false;
        if(m.material&&m.material.side===T.BackSide){m.castShadow=false;m.receiveShadow=false;return}
        m.castShadow=!flat;m.receiveShadow=true})}
    return add.apply(this,arguments)};
  T.Object3D.prototype.__r3add=1};

/* ---------- upgrade an existing scene built with flat materials ---------- */
R3.autoShade=function(root,o){
  o=o||{};var n=0;
  root.traverse(function(ob){
    if(!ob.isMesh)return;
    var mats=Array.isArray(ob.material)?ob.material:[ob.material];
    var out=mats.map(function(m){
      if(!m||(!m.isMeshLambertMaterial&&!m.isMeshPhongMaterial))return m;
      var s=new T.MeshStandardMaterial({
        color:m.color?m.color.clone():new T.Color(0xffffff),
        map:m.map||null,vertexColors:!!m.vertexColors,side:m.side,
        transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,
        roughness:o.roughness!==undefined?o.roughness:.72,
        metalness:o.metalness!==undefined?o.metalness:.04,
        envMapIntensity:o.envMapIntensity!==undefined?o.envMapIntensity:.6});
      if(m.emissive){s.emissive=m.emissive.clone();s.emissiveIntensity=m.emissiveIntensity||1}
      n++;m.dispose&&m.dispose();return s});
    ob.material=Array.isArray(ob.material)?out:out[0];
    if(o.shadows!==false){
      var cast=o.cast?o.cast(ob):true,recv=o.receive?o.receive(ob):true;
      ob.castShadow=!!cast;ob.receiveShadow=!!recv}
  });
  return n};

window.R3=R3;
})();
