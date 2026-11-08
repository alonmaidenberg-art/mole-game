/* © 2026 Alon Maidenberg (אלון מידנברג). All rights reserved.
   The shared board: one JSONBin record holding the leaderboard, the register of
   players, the admin's orders and the shorts players have published.
   The access key is Read+Update only. Loaded by the lobby and by shorts/. */
(function(){
  'use strict';
  var BIN='6aeb5887ac6210605a6c4c6a',
      KEY='$2a$10$V.Rz3BoGAuOqV3rf.yhVUuM.u.gCBl5Qdg3FHw.2YSHkR.VIEFZH2',
      URL='https://api.jsonbin.io/v3/b/'+BIN;
  var BAD=/(fuck|shit|bitch|cunt|dick|porn|nazi|hitler|rape|sex|nigg|http|www|\.com|זונה|שרמוט|כוס|זין|מניאק|הומו|נאצי|היטלר|אנס|סקס)/i;

  function get(){
    return fetch(URL+'/latest',{cache:'no-store',headers:{'X-Access-Key':KEY,'X-Bin-Meta':'false'}})
      .then(function(r){if(!r.ok)throw r.status;return r.json()})
      .then(function(d){d=d&&d.record?d.record:d;if(!d||typeof d!=='object')d={};
        d.g=d.g||{};d.banned=d.banned||[];return d})}
  function put(b){
    return fetch(URL,{method:'PUT',headers:{'Content-Type':'application/json','X-Access-Key':KEY},
      body:JSON.stringify(b)}).then(function(r){if(!r.ok)throw r.status;return b})}

  /* a nickname fit to show to everyone, or '' */
  function clean(n){
    n=String(n||'').replace(/[\u0000-\u001f<>&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,14);
    return n.length>=2&&!BAD.test(n.replace(/[\s._-]/g,''))?n:''}
  /* free text fit to show to everyone, or '' */
  function cleanText(s,max){
    s=String(s||'').replace(/[\u0000-\u001f<>&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,max||60);
    return BAD.test(s.replace(/[\s._-]/g,''))?'':s}
  /* the same player with and without a shop badge is one player */
  function bare(n){n=String(n||'').trim();try{n=n.replace(/^[^\p{L}\p{N}]+/u,'')}catch(e){}
    return n.trim().toLowerCase()}

  window.AGBoard={on:!!BIN,get:get,put:put,clean:clean,cleanText:cleanText,bare:bare,BAD:BAD};
})();
