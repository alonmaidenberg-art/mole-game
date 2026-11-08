/* © 2026 Alon Maidenberg (אלון מידנברג). All rights reserved.
   הגליץ' — the character you talk to in order to build a short.

   There is no server and no language model behind this: it reads the Hebrew
   you typed, looks for the things a short is made of (which game, how hard,
   how long, what colour, what caption) and fills them in. Everything it
   understands lives in the WORDS table below, so teaching it a new word is
   one line. */
(function(){
'use strict';

/* every spelling worth knowing, mapped to what it means */
var WORDS={
  game:[
    ['jump',  ['קפיצה','קפיצות','לקפוץ','קופץ','קופצים','מכשולים','ריצה','רץ','רצים','דינוזאור','דינו','מרוץ']],
    ['flap',  ['טפיחה','ציפור','ציפורים','לעוף','מעופף','עף','צינורות','שערים','פלאפי','כנפיים']],
    ['stop',  ['מחוג','לעצור','עצור','עצירה','בזמן','פס','טיימינג','לדייק','לעצור בזמן']],
    ['dodge', ['התחמקות','להתחמק','מתחמק','מטאור','מטאורים','אבנים','נופלים','לברוח','בריחה','גרירה','לגרור']],
    ['ring',  ['טבעת','עיגול','מתכווץ','בול','דיוק','מדויק','מעגל']],
    ['taps',  ['מהר','מהיר','מהירות','ללחוץ','לחיצות','הקשה','הקשות','ספאם','אצבע','אצבעות','לוחץ']],
    ['pop',   ['בלון','בלונים','לפוצץ','פיצוץ','מפוצץ','מטרות','לפגוע']],
    ['memo',  ['זיכרון','זכרון','לזכור','זוכר','סדר','סיימון','רצף','לחזור']]
  ],
  /* checked in order, so "ממש קשה" is found before "קשה" */
  d:[[5,['בלתי אפשרי','ממש קשה','קשה מאוד','הכי קשה','מטורף','אכזרי','רצח','בלתי־אפשרי','אימה','גיהינום']],
     [4,['קשה','קשים','קשות','מאתגר','מאתגרת','אתגר','קשוח','חזק']],
     [3,['רגיל','בינוני','נורמלי','סביר','באמצע']],
     [2,['קליל','נוח','לא קשה']],
     [1,['קל','קלה','קלים','קלות','פשוט','פשוטה','קלי קלות','לילדים','קטנים','חלש','סופר קל']]],
  len:[[8,['קצר','קצרצר','מהיר מאוד','זריז']],
       [15,['בינוני','רגיל']],
       [26,['ארוך','ארוכה','ארוכים','הרבה זמן','ממושך']]],
  th:[[0,['סגול','סגולה','סגלגל']],
      [1,['ים','תכלת','טורקיז','ירוק ים','כחול ירקרק','מים']],
      [2,['שקיעה','כתום','חום','אדום','אש','שמש']],
      [3,['לילה','כחול','כהה','חלל','שמיים']],
      [4,['ורוד','ורודה','סגול ורוד','פוקסיה','בנות']],
      [5,['ירוק','יער','דשא','טבע']]]
};

function norm(s){return String(s||'').replace(/[״"'`,.!?]/g,' ').replace(/\s+/g,' ').trim()}
var LET=/[֐-׿a-zA-Z0-9]/,
    PRE=/^[בלמהוכשׁ]$/;      /* ב־ ל־ מ־ ה־ ו־ כ־ ש־ : "בוורוד" is still "ורוד" */
function has(t,w){
  /* a whole word, so "משחק" never counts as "שחק" and "בוורוד" still counts as "ורוד" */
  var i=t.indexOf(w);
  while(i>=0){
    var after=(i+w.length>=t.length)?' ':t[i+w.length];
    if(!LET.test(after)){
      if(i===0)return true;
      var a=t[i-1];
      if(!LET.test(a))return true;
      /* one Hebrew prefix letter is allowed, but only at the head of a word */
      if(PRE.test(a)&&(i===1||!LET.test(t[i-2])))return true;
      /* "וו" at the head, as in בוורוד */
      if(PRE.test(a)&&i>=2&&PRE.test(t[i-2])&&(i===2||!LET.test(t[i-3])))return true}
    i=t.indexOf(w,i+1)}
  return false}
function hasAny(t,list){for(var i=0;i<list.length;i++)if(has(t,list[i]))return true;return false}

function findGame(t){
  for(var i=0;i<WORDS.game.length;i++){var row=WORDS.game[i];
    for(var k=0;k<row[1].length;k++)if(has(t,row[1][k]))return row[0]}
  return null}
function findIn(table,t){
  for(var i=0;i<table.length;i++){var row=table[i];
    for(var k=0;k<row[1].length;k++)if(has(t,row[1][k]))return row[0]}
  return null}
function findLen(t){
  var m=t.match(/(\d{1,2})\s*(שניות|שניה|שנ|שניים)?/);
  if(m&&+m[1]>=5&&+m[1]<=40&&/שני|שנ/.test(m[2]||''))return +m[1];
  var w=findIn(WORDS.len,t);
  if(w!==null)return w;
  if(m&&+m[1]>=5&&+m[1]<=40&&/אורך|זמן|שניות/.test(t))return +m[1];
  return null}
function findStars(t){
  var m=t.match(/(\d)\s*(כוכב|כוכבים|מתוך\s*5)/);
  if(m&&+m[1]>=1&&+m[1]<=5)return +m[1];
  return null}
function findCaption(raw){
  var q=raw.match(/[״"'“](.{2,60}?)[״"'”]/);
  if(q)return q[1].trim();
  var k=raw.match(/(?:כיתוב|כתוב|שיכתוב|טקסט|שיהיה כתוב|תכתוב)\s*[:,-]?\s*(.{2,60})$/);
  if(k)return k[1].replace(/^(?:יהיה|שיהיה|הוא|זה|יהיו)\s+/,'').trim();
  return null}

/* reads one message and says what it changed */
function read(raw){
  var t=norm(raw),out={},hit=[];
  var g=findGame(t);           if(g){out.g=g;hit.push('game')}
  var s=findStars(t);
  var d=s!==null?s:findIn(WORDS.d,t); if(d!==null){out.d=d;hit.push('d')}
  var L=findLen(t);            if(L!==null){out.len=L;hit.push('len')}
  var th=findIn(WORDS.th,t);   if(th!==null){out.th=th;hit.push('th')}
  var cap=findCaption(raw);    if(cap){out.cap=cap;hit.push('cap')}
  return {set:out,hit:hit,
    surprise:hasAny(t,['תפתיע','הפתע','הפתעה','תחליט','תבחר','מה שבא','לא אכפת','אקראי','רנדומלי']),
    yes:/^(כן|יאללה|קדימה|אוקיי|אוקי|סבבה|בטח|טוב|מעולה)\b/.test(t),
    no:/^(לא|עזוב|אחר)\b/.test(t),
    /* "משחק" is מ+שחק, so the bare "שחק" is left out on purpose */
    play:hasAny(t,['ננסה','לנסות','תנסה','נשחק','לשחק','תריץ','הרץ']),
    publish:hasAny(t,['פרסם','תפרסם','לפרסם','פרסמי','פרסמו','לכולם','שכולם','תעלה','להעלות'])};
}
window.AGBoss={read:read,WORDS:WORDS,norm:norm};
})();
