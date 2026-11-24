/* כפתור ההתקנה.
   (c) 2026 אלון מידנברג.

   מתקין את האתר כאפליקציה על מסך הבית. הכפתור מופיע רק כשבאמת אפשר
   להתקין, ונעלם אחרי שהותקן — כפתור שלא עושה כלום גרוע מאין כפתור.

   באנדרואיד ובמחשב הדפדפן נותן לנו אירוע beforeinstallprompt ואנחנו
   פותחים את חלון ההתקנה האמיתי. בספארי באייפון אין אירוע כזה בכלל,
   אז שם מראים הסבר קצר איך לעשות את זה ידנית. */
(function () {
  'use strict';
  if (window.AGInstall) return;

  var KEY = 'ag_installhide';
  var waiting = null;          /* אירוע ההתקנה ששמרנו */
  var btn = null, sheet = null;

  function standalone() {
    return matchMedia('(display-mode: standalone)').matches ||
           matchMedia('(display-mode: minimal-ui)').matches ||
           navigator.standalone === true;
  }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isSafari() {
    return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
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
    '  background:rgba(0,0,0,.16);font-size:14px}',
    '#agIsheet{position:fixed;inset:0;z-index:2147483000;display:none;',
    '  align-items:flex-end;justify-content:center;background:rgba(8,4,22,.6)}',
    '#agIsheet.on{display:flex}',
    '#agIsheet .c{background:#2b1659;color:#fff;border:4px solid #140a2e;',
    '  border-radius:24px 24px 0 0;padding:22px 20px calc(26px + env(safe-area-inset-bottom));',
    '  width:min(520px,100%);font-family:Rubik,system-ui,"Noto Sans Hebrew",Arial}',
    '#agIsheet h3{margin:0 0 10px;font-size:21px;font-weight:900;color:#6cf2a8!important}',
    '#agIsheet ol{margin:0 0 16px;padding-inline-start:22px;line-height:1.85;font-size:16px}',
    '#agIsheet button{width:100%;font:900 16px Rubik,system-ui;padding:13px;',
    '  border:3px solid #140a2e;border-radius:14px;background:#ffd43b;color:#2b1659;',
    '  cursor:pointer;box-shadow:0 5px 0 #140a2e}'
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

  function iosSheet() {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'agIsheet';
      sheet.innerHTML =
        '<div class="c"><h3>⬇️ להוסיף למסך הבית</h3>' +
        '<ol><li>לוחצים על כפתור <b>שיתוף</b> למטה במסך (ריבוע עם חץ למעלה).</li>' +
        '<li>גוללים ובוחרים <b>הוספה למסך הבית</b>.</li>' +
        '<li>לוחצים <b>הוספה</b> — והאתר יושב אצלכם כמו אפליקציה.</li></ol>' +
        '<button type="button">הבנתי</button></div>';
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.tagName === 'BUTTON') sheet.classList.remove('on');
      });
      document.body.appendChild(sheet);
    }
    sheet.classList.add('on');
  }

  function go() {
    if (waiting) {
      waiting.prompt();
      waiting.userChoice.then(function (r) {
        if (r && r.outcome === 'accepted') { btn.classList.remove('on'); hide(); }
        waiting = null;
      }).catch(function () { waiting = null });
      return;
    }
    iosSheet();
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
    /* ספארי באייפון לא שולח את האירוע, אז מציעים שם את ההסבר הידני */
    if (isIOS() && isSafari()) show();

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
