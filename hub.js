/* Shared helper for all games: wallet (coins/diamonds), admin code, "back to hub" button. */
(function(){
  'use strict';
  var HASH='a28e690a3b6d041970a632d16ad8d54a2ae463d1319f7990a490a5ffd8431884';
  var script=document.currentScript;
  var ROOT=new URL('./',script&&script.src?script.src:location.href).href;
  var K='ag_wallet',KA='ag_admin',subs=[];
  function rd(){try{var w=JSON.parse(localStorage.getItem(K)||'{}');return{c:Math.max(0,+w.c||0),d:Math.max(0,+w.d||0)}}catch(e){return{c:0,d:0}}}
  function wr(w){try{localStorage.setItem(K,JSON.stringify(w))}catch(e){}subs.forEach(function(f){try{f(w)}catch(e){}})}
  var AG={
    root:ROOT,
    coins:function(){return rd().c},
    diamonds:function(){return rd().d},
    add:function(c,d){var w=rd();w.c+=c||0;w.d+=d||0;wr(w)},
    spend:function(c,d){var w=rd();c=c||0;d=d||0;if(w.c<c||w.d<d)return false;w.c-=c;w.d-=d;wr(w);return true},
    onChange:function(f){subs.push(f)},
    isAdmin:function(){try{return localStorage.getItem(KA)===HASH}catch(e){return false}},
    tryAdmin:function(code){
      code=String(code||'').trim().toUpperCase();
      var data=new TextEncoder().encode('alon-games|'+code);
      if(!(window.crypto&&crypto.subtle))return Promise.resolve(false);
      return crypto.subtle.digest('SHA-256',data).then(function(b){
        var h=Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
        if(h===HASH){try{localStorage.setItem(KA,HASH)}catch(e){}return true}return false});
    },
    adminLogout:function(){try{localStorage.removeItem(KA)}catch(e){}}
  };
  window.AG=AG;
  /* back-to-hub button (not on the hub itself) */
  var isHub=(location.pathname.replace(/index\.html$/,'')===new URL(ROOT).pathname);
  if(!isHub){
    var a=document.createElement('a');a.href=ROOT;a.textContent='🏠';a.setAttribute('aria-label','חזרה לכל המשחקים');
    var BOT=/\/(chess|englishbot|impostor|game2048)\//.test(location.pathname);
    a.style.cssText='position:fixed;z-index:2147483000;'+(BOT?'bottom:max(8px,env(safe-area-inset-bottom));':'top:max(6px,env(safe-area-inset-top));')+'left:6px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,10,50,.55);border:1.5px solid rgba(255,255,255,.35);color:#fff;font-size:17px;text-decoration:none;opacity:.8;-webkit-tap-highlight-color:transparent';
    function put(){document.body.appendChild(a)}
    if(document.body)put();else addEventListener('DOMContentLoaded',put);
  }
})();
