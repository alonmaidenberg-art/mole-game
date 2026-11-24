/* כפתור ההתקנה.
   (c) 2026 אלון מידנברג.

   מתקין את האתר כאפליקציה על מסך הבית. הכפתור מופיע רק כשבאמת אפשר
   להתקין, ונעלם אחרי שהותקן — כפתור שלא עושה כלום גרוע מאין כפתור.

   באנדרואיד, בכרום במחשב, ב-Edge ובסמסונג הדפדפן נותן לנו את האירוע
   beforeinstallprompt, ולחיצה פותחת את חלון ההתקנה האמיתי.

   בספארי באייפון אין אירוע כזה ואין שום דרך אחרת להתקין מתוך הקוד —
   אפל לא חושפת API כזה. לכן שם הכפתור פשוט לא מופיע. כפתור שרק מסביר
   מה לעשות ביד הוא לא כפתור התקנה, ועדיף בלי. */
(function () {
  'use strict';
  if (window.AGInstall) return;

  var KEY = 'ag_installhide';
  var waiting = null;          /* אירוע ההתקנה ששמרנו */
  var btn = null;

  function standalone() {
    return matchMedia('(display-mode: standalone)').matches ||
           matchMedia('(display-mode: minimal-ui)').matches ||
           navigator.standalone === true;
  }
  function hidden() { try { return localStorage.getItem(KEY) === '1' } catch (e) { return false } }
  function hide() { try { localStorage.setItem(KEY, '1') } catch (e) {} }

  var CSS = [
    '#agInst{display:none;align-items:center;gap:9px;margin:10px auto 0;',
    '  font:900 15px Rubik,system-ui,"Noto Sans Hebrew",Arial;cursor:pointer;',
    '  background:#6cf2a8;color:#15303f;border:3px solid #140a2e;border-radius:999px;',
    '  padding:11px 18px;min-height:46px;box-shadow:0 5px 0 #140a2e}',
    '#agInst.on{display:inline-flex}',
    '#agInst:active{transform:translateY(4px);box-shadow:0 1px 0 #140a2e}',
    '#agInst .x{display:inline-flex;align-items:center;justify-content:center;',
    '  width:26px;height:26px;margin-inline-start:2px;border-radius:50%;',
    '  background:rgba(0,0,0,.16);font-size:14px}'
  ].join('\n');

  function build() {
    var st = document.createElement('style'); st.textContent = CSS;
    document.head.appendChild(st);

    btn = document.createElement('button');
    btn.id = 'agInst'; btn.type = 'button';
    btn.innerHTML = '<span aria-hidden="true">⬇️</span><span>התקינו את האתר כאפליקציה</span>' +
                    '<span class="x" aria-hidden="true">✕</span>';
    btn.addEventListener('click', function (e) {
      /* ה-✕ מסלק את הכפתור במקום להתקין */
      if (e.target.closest('.x')) { btn.classList.remove('on'); hide(); return; }
      go();
    });

    /* מתחת לשורת החיפוש, איפה שמסתכלים ממילא */
    var tools = document.querySelector('.tools');
    if (tools && tools.parentNode) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'text-align:center';
      wrap.appendChild(btn);
      tools.parentNode.insertBefore(wrap, tools.nextSibling);
    } else {
      document.body.appendChild(btn);
    }
  }

  function go() {
    if (!waiting) return;              /* בלי אירוע אין מה להתקין */
    waiting.prompt();
    waiting.userChoice.then(function (r) {
      if (r && r.outcome === 'accepted') { btn.classList.remove('on'); hide(); }
      waiting = null;
    }).catch(function () { waiting = null });
  }

  function show() { if (btn && !standalone() && !hidden()) btn.classList.add('on'); }

  function init() {
    build();
    if (standalone()) return;              /* כבר מותקן — אין מה להציע */

    addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();                   /* שומרים אותו לכפתור שלנו */
      waiting = e;
      show();
    });
    addEventListener('appinstalled', function () {
      if (btn) btn.classList.remove('on');
      hide();
    });
    if ('serviceWorker' in navigator) {
      addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }
  }

  window.AGInstall = { show: show, prompt: go };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
