/* הכלים — המגירה השימושית של האתר.
   (c) 2026 אלון מידנברג. נא לא להעתיק.

   מחליקים שמאלה בכל מקום בדף (או לוחצים על הלשונית בצד) והמגירה נפתחת.
   בפנים: מתכנן נסיעה, מטלות וטיימר. הכול נשמר במכשיר, בלי שרת ובלי חשבון.

   הקובץ מזריק את ה-HTML ואת ה-CSS של עצמו, כדי שאפשר יהיה להוסיף אותו
   לכל דף באתר עם שורת <script> אחת ובלי לגעת בעיצוב של הדף. */
(function () {
  'use strict';
  if (window.AGTools) return;

  /* ---------- איפה שומרים ---------- */
  var KT = 'ag_trips', KD = 'ag_todo';
  function load(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }
    catch (e) { return d; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  /* מספר בתוך בידי, כדי שלא יתהפך בתוך משפט בעברית */
  function num(n) { return '⁦' + n + '⁩'; }

  /* ---------- לאן טסים ----------
     זמני הטיסה הם מתל אביב ובקירוב, והם לטיסה ישירה.
     plug: 0 = התקע הישראלי מתאים, 1 = צריך מתאם בריטי, 2 = צריך מתאם אמריקאי.
     cl: אקלים — med ים תיכוני, euro אירופה, trop טרופי, desert מדברי, usne מזרח ארה"ב. */
  var DEST = [
    { k: 'ath', n: 'יוון · אתונה', en: 'Athens', cc: 'יוון', f: 2, cur: 'אירו', iso: 'EUR',
      lang: 'יוונית', plug: 0, cl: 'med', em: '112',
      see: ['האקרופוליס', 'שכונת פלאקה', 'שוק מונסטיראקי', 'שייט ליום באי קרוב'],
      ar: [{ n: 'פלאקה', q: 'Plaka, Athens', d: 'ממש מתחת לאקרופוליס, הכול בהליכה' },
           { n: 'מונסטיראקי', q: 'Monastiraki, Athens', d: 'השווקים, הכי תוסס' },
           { n: 'סינטגמה', q: 'Syntagma, Athens', d: 'מרכזי, רכבת ישירה משדה התעופה' },
           { n: 'קוקאקי', q: 'Koukaki, Athens', d: 'שקט ונעים, ליד מוזיאון האקרופוליס' },
           { n: 'גליפדה', q: 'Glyfada, Athens', d: 'על הים, חופים ומסעדות' }] },
    { k: 'lca', n: 'קפריסין · לרנקה', en: 'Larnaca', cc: 'קפריסין', f: 1, cur: 'אירו', iso: 'EUR',
      lang: 'יוונית', plug: 1, cl: 'med', em: '112',
      see: ['חוף פיניקודס', 'כנסיית לזרוס', 'אגם המלח', 'פארק מים'],
      ar: [{ n: 'פיניקודס', q: 'Finikoudes, Larnaca', d: 'על הטיילת ועל החוף' },
           { n: 'מקנזי', q: 'Mackenzie Beach, Larnaca', d: 'חוף ומסעדות, קרוב לשדה התעופה' },
           { n: 'מרכז לרנקה', q: 'Larnaca city centre', d: 'חנויות והכול בהליכה' },
           { n: 'איה נאפה', q: 'Ayia Napa', d: 'רבע שעה נסיעה, חופים ופארקי מים' }] },
    { k: 'rom', n: 'איטליה · רומא', en: 'Rome', cc: 'איטליה', f: 3.5, cur: 'אירו', iso: 'EUR',
      lang: 'איטלקית', plug: 0, cl: 'med', em: '112',
      see: ['הקולוסיאום', 'מזרקת טרווי', 'הוותיקן', 'הפנתיאון', 'גלידה בטרסטוורה'],
      ar: [{ n: 'המרכז ההיסטורי', q: 'Centro Storico, Rome', d: 'הפנתיאון ומזרקת טרווי בהליכה' },
           { n: 'טרסטוורה', q: 'Trastevere, Rome', d: 'סמטאות ומסעדות, הכי יפה בערב' },
           { n: 'מונטי', q: 'Monti, Rome', d: 'ליד הקולוסיאום, שכונתי' },
           { n: 'פראטי', q: 'Prati, Rome', d: 'שקט ונקי, צמוד לוותיקן' },
           { n: 'טרמיני', q: 'Termini, Rome', d: 'ליד תחנת הרכבת, בדרך כלל הכי זול' }] },
    { k: 'bcn', n: 'ספרד · ברצלונה', en: 'Barcelona', cc: 'ספרד', f: 4.75, cur: 'אירו', iso: 'EUR',
      lang: 'ספרדית', plug: 0, cl: 'med', em: '112',
      see: ['סגרדה פמיליה', 'פארק גואל', 'הרמבלס', 'חוף ברצלונטה', 'קאמפ נואו'],
      ar: [{ n: 'אשמפלה', q: 'Eixample, Barcelona', d: 'מרכזי ורחב, ליד סגרדה פמיליה' },
           { n: 'הרובע הגותי', q: 'Gothic Quarter, Barcelona', d: 'העיר העתיקה, סמטאות' },
           { n: 'ברסלונטה', q: 'Barceloneta, Barcelona', d: 'על החוף' },
           { n: 'גרסיה', q: 'Gracia, Barcelona', d: 'שכונתי ושקט, כיכרות קטנות' },
           { n: 'סנטס', q: 'Sants, Barcelona', d: 'ליד תחנת הרכבת, יותר זול' }] },
    { k: 'ist', n: 'טורקיה · איסטנבול', en: 'Istanbul', cc: 'טורקיה', f: 2, cur: 'לירה טורקית', iso: 'TRY',
      lang: 'טורקית', plug: 0, cl: 'med', em: '112',
      see: ['איה סופיה', 'הבזאר הגדול', 'שייט בבוספורוס', 'ארמון טופקאפי'],
      ar: [{ n: 'סולטנאחמט', q: 'Sultanahmet, Istanbul', d: 'העיר העתיקה, כל האתרים בהליכה' },
           { n: 'ביאולו וטקסים', q: 'Beyoglu, Istanbul', d: 'רחוב איסטיקלאל, חנויות ואוכל' },
           { n: 'קדיקוי', q: 'Kadikoy, Istanbul', d: 'בצד האסייתי, מקומי ויותר זול' },
           { n: 'בשיקטאש', q: 'Besiktas, Istanbul', d: 'על הבוספורוס, צעיר ותוסס' }] },
    { k: 'par', n: 'צרפת · פריז', en: 'Paris', cc: 'צרפת', f: 4.75, cur: 'אירו', iso: 'EUR',
      lang: 'צרפתית', plug: 0, cl: 'euro', em: '112',
      see: ['מגדל אייפל', 'הלובר', 'דיסנילנד פריז', 'שאנז אליזה', 'שייט בסן'],
      ar: [{ n: 'המארה', q: 'Le Marais, Paris', d: 'מרכזי, סמטאות ומסעדות' },
           { n: 'הרובע הלטיני', q: 'Latin Quarter, Paris', d: 'ליד נוטרדאם, צעיר' },
           { n: 'מונמארטר', q: 'Montmartre, Paris', d: 'על הגבעה, נוף על כל פריז' },
           { n: 'ליד מגדל אייפל', q: 'Eiffel Tower, Paris', d: 'שקט, המגדל מהחלון' },
           { n: 'ליד גאר דו נור', q: 'Gare du Nord, Paris', d: 'צומת רכבות, בדרך כלל זול יותר' }] },
    { k: 'lon', n: 'בריטניה · לונדון', en: 'London', cc: 'בריטניה', f: 5.25, cur: 'לירה שטרלינג', iso: 'GBP',
      lang: 'אנגלית', plug: 1, cl: 'euro', em: '999',
      see: ['לונדון איי', 'ביג בן', 'המוזיאון הבריטי', 'מוזיאון הטבע', 'קמדן מרקט'],
      ar: [{ n: 'וסטמינסטר והגדה הדרומית', q: 'Westminster, London', d: 'ביג בן והלונדון איי בהליכה' },
           { n: 'קובנט גארדן וסוהו', q: 'Covent Garden, London', d: 'הכי מרכזי, תיאטראות ומסעדות' },
           { n: 'קנזינגטון', q: 'Kensington, London', d: 'שקט, ליד המוזיאונים הגדולים' },
           { n: 'קמדן', q: 'Camden, London', d: 'השוק המפורסם, יותר זול' },
           { n: 'קינגס קרוס', q: "King's Cross, London", d: 'צומת רכבות, נוח להגיע מכל מקום' }] },
    { k: 'ams', n: 'הולנד · אמסטרדם', en: 'Amsterdam', cc: 'הולנד', f: 4.75, cur: 'אירו', iso: 'EUR',
      lang: 'הולנדית', plug: 0, cl: 'euro', em: '112',
      see: ['שייט בתעלות', 'מוזיאון ואן גוך', 'פארק וונדל', 'כפר זאנסה סחאנס'],
      ar: [{ n: 'המרכז', q: 'Amsterdam Centrum', d: 'על התעלות, הכול בהליכה' },
           { n: 'יורדאן', q: 'Jordaan, Amsterdam', d: 'השכונה הכי יפה, שקטה' },
           { n: 'דה פייפ', q: 'De Pijp, Amsterdam', d: 'שוק אלברט קאופ ומסעדות' },
           { n: 'מוזיאומפליין', q: 'Museumplein, Amsterdam', d: 'צמוד למוזיאונים ולפארק' },
           { n: 'אמסטרדם צפון', q: 'Amsterdam Noord', d: 'מעבר לנהר במעבורת חינם, זול יותר' }] },
    { k: 'ber', n: 'גרמניה · ברלין', en: 'Berlin', cc: 'גרמניה', f: 4, cur: 'אירו', iso: 'EUR',
      lang: 'גרמנית', plug: 0, cl: 'euro', em: '112',
      see: ['שער ברנדנבורג', 'חומת ברלין', 'אי המוזיאונים', 'מגדל הטלוויזיה'],
      ar: [{ n: 'מיטה', q: 'Mitte, Berlin', d: 'המרכז, רוב האתרים בהליכה' },
           { n: 'פרנצלאואר ברג', q: 'Prenzlauer Berg, Berlin', d: 'שקט ונעים, הרבה משפחות' },
           { n: 'קרויצברג', q: 'Kreuzberg, Berlin', d: 'צעיר ותוסס, הרבה אוכל' },
           { n: 'שרלוטנבורג', q: 'Charlottenburg, Berlin', d: 'שקט, קניות' }] },
    { k: 'prg', n: 'צ׳כיה · פראג', en: 'Prague', cc: 'צ׳כיה', f: 3.6, cur: 'קרונה צ׳כית', iso: 'CZK',
      lang: 'צ׳כית', plug: 0, cl: 'euro', em: '112',
      see: ['גשר קארל', 'כיכר העיר העתיקה', 'השעון האסטרונומי', 'מצודת פראג'],
      ar: [{ n: 'העיר העתיקה', q: 'Old Town, Prague', d: 'הכיכר והשעון מתחת לחלון' },
           { n: 'מאלה סטרנה', q: 'Mala Strana, Prague', d: 'מתחת למצודה, מעבר לגשר' },
           { n: 'העיר החדשה', q: 'New Town, Prague', d: 'כיכר ואצלב, חנויות' },
           { n: 'וינוהרדי', q: 'Vinohrady, Prague', d: 'שכונתי ושקט, פארקים' }] },
    { k: 'tbs', n: 'גאורגיה · טביליסי', en: 'Tbilisi', cc: 'גאורגיה', f: 3, cur: 'לארי', iso: 'GEL',
      lang: 'גאורגית', plug: 0, cl: 'euro', em: '112',
      see: ['העיר העתיקה', 'מצודת נריקלה', 'הרכבל', 'טיול להרים'],
      ar: [{ n: 'העיר העתיקה', q: 'Old Town, Tbilisi', d: 'המרחצאות והרכבל בהליכה' },
           { n: 'רוסתוולי', q: 'Rustaveli Avenue, Tbilisi', d: 'השדרה הראשית, מרכזי' },
           { n: 'ורה', q: 'Vera, Tbilisi', d: 'שקט, בתי קפה' },
           { n: 'ואקה', q: 'Vake, Tbilisi', d: 'ירוק, פארק גדול' }] },
    { k: 'dxb', n: 'דובאי', en: 'Dubai', cc: 'איחוד האמירויות', f: 3.25, cur: 'דירהם', iso: 'AED',
      lang: 'ערבית ואנגלית', plug: 1, cl: 'desert', em: '999',
      see: ['בורג׳ חליפה', 'ספארי במדבר', 'דובאי מול', 'מזרקות דובאי', 'פארק מים'],
      ar: [{ n: 'דובאי מרינה', q: 'Dubai Marina', d: 'מגדלים על המים, חוף בהליכה' },
           { n: 'JBR', q: 'Jumeirah Beach Residence, Dubai', d: 'ישר על החוף והטיילת' },
           { n: 'דאון טאון', q: 'Downtown Dubai', d: 'בורג׳ חליפה, הקניון והמזרקות' },
           { n: 'דיירה', q: 'Deira, Dubai', d: 'דובאי הישנה, השווקים, הכי זול' },
           { n: 'פאלם ג׳ומיירה', q: 'Palm Jumeirah, Dubai', d: 'האי המלאכותי, מלונות נופש' }] },
    { k: 'bkk', n: 'תאילנד · בנגקוק', en: 'Bangkok', cc: 'תאילנד', f: 10.5, cur: 'באט', iso: 'THB',
      lang: 'תאית', plug: 0, cl: 'trop', em: '191 משטרה · 1669 אמבולנס · 1155 משטרת תיירים',
      see: ['הארמון הגדול', 'שוק צ׳טוצ׳ק', 'שוק צף', 'מקדש וואט פו'],
      ar: [{ n: 'סוקומוויט', q: 'Sukhumvit, Bangkok', d: 'על הרכבת העילית, קניונים ואוכל' },
           { n: 'סיאם', q: 'Siam, Bangkok', d: 'מרכז הקניונים, הכי נוח לנסוע ממנו' },
           { n: 'סילום', q: 'Silom, Bangkok', d: 'עסקים ביום, שווקים בלילה' },
           { n: 'על הנהר', q: 'Riverside, Bangkok', d: 'שקט ויפה, סירות לאתרים' },
           { n: 'קאו סאן והעיר העתיקה', q: 'Khao San Road, Bangkok', d: 'ליד הארמון, הכי זול' }] },
    { k: 'nyc', n: 'ארה״ב · ניו יורק', en: 'New York', cc: 'ארצות הברית', f: 11.5, cur: 'דולר', iso: 'USD',
      lang: 'אנגלית', plug: 2, cl: 'usne', em: '911',
      see: ['סנטרל פארק', 'טיימס סקוור', 'פסל החירות', 'אמפייר סטייט', 'גשר ברוקלין'],
      ar: [{ n: 'מידטאון', q: 'Midtown Manhattan, New York', d: 'טיימס סקוור, במרכז הכול' },
           { n: 'אפר ווסט סייד', q: 'Upper West Side, New York', d: 'שקט, צמוד לסנטרל פארק' },
           { n: 'צ׳לסי', q: 'Chelsea, New York', d: 'ההיי ליין והשוק, מרכזי' },
           { n: 'דאון טאון', q: 'Financial District, New York', d: 'ליד פסל החירות והמעבורות' },
           { n: 'וויליאמסבורג, ברוקלין', q: 'Williamsburg, Brooklyn', d: 'נוף למנהטן, יותר זול' }] },
    { k: 'eth', n: 'אילת', en: 'Eilat', cc: 'ישראל', f: 0, cur: 'שקל', iso: 'ILS',
      lang: 'עברית', plug: 0, cl: 'desert', em: '100 משטרה · 101 אמבולנס · 102 כבאות',
      see: ['המצפה התת-ימי', 'חוף הדקל', 'שמורת האלמוגים', 'פארק תימנע', 'קניון האייס'],
      ar: [{ n: 'הטיילת ומרכז העיר', q: 'Eilat promenade', d: 'הכול בהליכה, מסעדות וקניון' },
           { n: 'חוף צפון', q: 'North Beach, Eilat', d: 'החוף המרכזי, ליד הכול' },
           { n: 'חוף אלמוג', q: 'Coral Beach, Eilat', d: 'השנורקלינג הכי יפה' },
           { n: 'שכונת האיילים', q: 'Eilat hotels area', d: 'מלונות גדולים עם בריכות' }] }
  ];
  function destOf(k) { for (var i = 0; i < DEST.length; i++) if (DEST[i].k === k) return DEST[i]; return null; }

  /* ---------- קישורים ----------
     הכול קישורי חיפוש רגילים, עם היעד, האזור, התאריכים וכמה אנשים כבר בפנים,
     כדי שלא צריך למלא את זה שוב בכל אתר. */
  function q(s) { return encodeURIComponent(String(s || '')); }
  function gsearch(s) { return 'https://www.google.com/search?q=' + q(s); }
  /* "קנדה · טורונטו" הוא שם יפה לכרטיס אבל לא שאילתת חיפוש */
  function plain(s) { return String(s || '').replace(/\s*·\s*/g, ', ').trim(); }
  function links(t) {
    var d = destOf(t.destKey);
    var abroad = !d || d.k !== 'eth';
    var place = t.areaQ || (d ? d.en : plain(t.dest));   /* האזור שנבחר, אחרת העיר */
    var city = d ? d.en : plain(t.dest);
    var who = Math.max(1, Math.min(12, +t.who || 2));
    var dates = (t.go && t.back) ? '&checkin=' + t.go + '&checkout=' + t.back : '';
    var out = [];

    out.push({ e: '🏨', t: t.areaN ? 'מלונות ב' + t.areaN : 'מלונות באזור',
      u: 'https://www.booking.com/searchresults.html?ss=' + q(place) + dates +
         '&group_adults=' + who + '&no_rooms=1' });
    out.push({ e: '🏠', t: 'דירות באזור',
      u: 'https://www.airbnb.com/s/' + q(place) + '/homes' +
         ((t.go && t.back) ? '?checkin=' + t.go + '&checkout=' + t.back + '&adults=' + who : '') });
    if (abroad)
      out.push({ e: '✈️', t: 'טיסות מתל אביב',
        u: 'https://www.google.com/travel/flights?q=' +
           q('Flights from TLV to ' + city + (t.go ? ' on ' + t.go : '') + (t.back ? ' through ' + t.back : '')) });
    if (abroad)
      out.push({ e: '🚕', t: 'איך מגיעים משדה התעופה',
        u: 'https://www.google.com/maps/dir/?api=1&origin=' + q(city + ' Airport') +
           '&destination=' + q(place) });
    out.push({ e: '🗺️', t: 'האזור במפה',
      u: 'https://www.google.com/maps/search/?api=1&query=' + q(place) });
    out.push({ e: '🍽️', t: 'מסעדות באזור',
      u: 'https://www.google.com/maps/search/?api=1&query=' + q('restaurants ' + place) });
    out.push({ e: '🎢', t: 'מה לעשות שם',
      u: 'https://www.google.com/maps/search/?api=1&query=' + q('things to do in ' + city) });
    out.push({ e: '🌦️', t: 'מזג האוויר', u: gsearch('מזג האוויר ' + (d ? d.n.split(' · ').pop() : t.dest)) });
    if (d && d.iso && d.iso !== 'ILS')
      out.push({ e: '💱', t: 'כמה זה בשקלים', u: gsearch('100 ' + d.iso + ' to ILS') });
    if (abroad)
      out.push({ e: '🛂', t: 'ויזה ודרכון',
        u: gsearch('דרישות כניסה ל' + (d ? d.cc : plain(t.dest)) + ' לישראלים דרכון ויזה') });
    return out;
  }

  /* מזג האוויר הצפוי, לפי חודש הנסיעה. זה מה שקובע מה אורזים. */
  var CLIM = {
    med:    { hot: [6, 7, 8, 9], mild: [4, 5, 10, 11], rain: [11, 12, 1, 2, 3] },
    euro:   { hot: [7, 8], mild: [5, 6, 9], rain: [10, 11, 12, 1, 2, 3, 4] },
    trop:   { hot: [1,2,3,4,5,6,7,8,9,10,11,12], mild: [], rain: [5,6,7,8,9,10] },
    desert: { hot: [4,5,6,7,8,9,10], mild: [11, 12, 1, 2, 3], rain: [] },
    usne:   { hot: [6, 7, 8], mild: [5, 9, 10], rain: [11, 12, 1, 2, 3, 4] }
  };
  function weather(cl, month) {
    var c = CLIM[cl] || CLIM.med;
    var b = c.hot.indexOf(month) >= 0 ? 'hot' : c.mild.indexOf(month) >= 0 ? 'mild' : 'cool';
    return { band: b, rain: c.rain.indexOf(month) >= 0 };
  }
  var BANDTXT = { hot: '☀️ חם', mild: '🌤️ נעים', cool: '🧥 קר' };

  /* ---------- תאריכים ---------- */
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function parseD(s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtD(d) {
    if (!d) return '';
    return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  /* ---------- מה אורזים ----------
     הרשימה נבנית מהיעד, מהעונה ומאורך הנסיעה, ולא מרשימה קבועה. */
  function packList(t) {
    var d = destOf(t.destKey), go = parseD(t.go), back = parseD(t.back);
    var nights = (go && back) ? Math.max(1, daysBetween(go, back)) : 5;
    var w = d ? weather(d.cl, go ? go.getMonth() + 1 : 7) : { band: 'mild', rain: false };
    var abroad = !d || d.k !== 'eth';
    var longFlight = d && d.f >= 6;
    var g = [];

    if (abroad) g.push({ h: '📄 מסמכים', i: [
      'דרכון (בדקו שהוא בתוקף לחצי שנה קדימה)',
      'כרטיסי טיסה / אישור הזמנה',
      'ביטוח נסיעות',
      'כתובת המלון כתובה בנפרד'
    ] });
    else g.push({ h: '📄 מסמכים', i: ['תעודת זהות או דרכון', 'אישור ההזמנה של המלון'] });

    var clothes = [
      num(Math.min(nights + 1, 10)) + ' חולצות',
      num(Math.ceil(nights / 2) + 1) + ' מכנסיים',
      num(nights + 1) + ' תחתונים וגרביים',
      'פיג׳מה'
    ];
    if (w.band === 'hot') clothes.push('כובע', 'משקפי שמש', 'בגד ים', 'סנדלים');
    if (w.band === 'mild') clothes.push('סוודר דק לערב', 'ז׳קט קל');
    if (w.band === 'cool') clothes.push('מעיל חם', 'כובע צמר', 'כפפות', 'צעיף', 'נעליים סגורות וחמות');
    if (w.rain) clothes.push('מטרייה או מעיל גשם');
    clothes.push('נעליים נוחות להליכה');
    g.push({ h: '👕 בגדים', i: clothes });

    var kit = ['מברשת שיניים ומשחה', 'דאודורנט', 'מסרק', 'תרופות שאתם לוקחים'];
    if (w.band === 'hot') kit.push('קרם הגנה');
    g.push({ h: '🧴 כלי רחצה', i: kit });

    var tech = ['מטען לטלפון', 'אוזניות', 'סוללה ניידת'];
    if (d && d.plug === 1) tech.push('מתאם לשקע בריטי (3 פינים)');
    if (d && d.plug === 2) tech.push('מתאם לשקע אמריקאי (2 פינים שטוחים)');
    g.push({ h: '🔌 חשמל', i: tech });

    var fly = [];
    if (abroad) {
      fly.push('חטיף ובקבוק ריק למילוי אחרי הביקורת', 'ספר או משחק לטיסה');
      if (longFlight) fly.push('כרית צוואר', 'מסכת שינה', 'גרביים לטיסה', 'הורדתם סרטים מראש?');
      fly.push('תיק יד — דרכון, מטען וכסף תמיד איתכם, לא במזוודה');
      g.push({ h: '✈️ לטיסה', i: fly });
    }
    return { groups: g, nights: nights, w: w, abroad: abroad };
  }

  /* ---------- תוכנית לכל יום ---------- */
  function dayPlan(t) {
    var d = destOf(t.destKey), go = parseD(t.go), back = parseD(t.back);
    if (!d || !go || !back) return [];
    var n = Math.max(1, daysBetween(go, back) + 1), out = [], see = d.see.slice();
    for (var i = 0; i < Math.min(n, 14); i++) {
      var day = new Date(go.getTime() + i * 86400000), what;
      if (i === 0) what = d.k === 'eth' ? 'הגעה, כניסה למלון ומנוחה' : 'טיסה, הגעה למלון וסיבוב קצר בסביבה';
      else if (i === n - 1) what = d.k === 'eth' ? 'ארוזים, ארוחה אחרונה ונסיעה הביתה' : 'ארוזים מהבוקר, קניית מזכרות וטיסה הביתה';
      else what = see.length ? see.shift() : 'יום חופשי — מה שבא לכם';
      out.push({ d: day, what: what });
    }
    return out;
  }

  /* ---------- העיצוב ---------- */
  var CSS = [
    '#agT,#agTh,#agTs{font-family:Rubik,system-ui,"Noto Sans Hebrew",Arial,sans-serif}',
    /* theme.css מניח פס קפוא בראש הדף ב-z-index כמעט מקסימלי, אז המגירה חייבת לעבור אותו */
    '#agTs{position:fixed;inset:0;background:rgba(10,5,24,.6);opacity:0;pointer-events:none;',
    '  transition:opacity .22s ease;z-index:2147482980;backdrop-filter:blur(2px)}',
    '#agTs.on{opacity:1;pointer-events:auto}',
    /* הלשונית שתמיד בצד, כדי שידעו שהמגירה קיימת */
    '#agTh{position:fixed;right:0;top:40%;z-index:2147482970;writing-mode:vertical-rl;',
    '  background:var(--ice,#35e0ff);color:var(--ink,#140a2e);border:3px solid var(--ink,#140a2e);',
    '  border-right:0;border-radius:16px 0 0 16px;padding:14px 7px;font-weight:900;font-size:14px;',
    '  cursor:pointer;box-shadow:-4px 4px 0 var(--ink,#140a2e);letter-spacing:.5px}',
    '#agTh:active{transform:translateX(3px);box-shadow:-1px 4px 0 var(--ink,#140a2e)}',
    '#agTh b{display:block;font-size:17px;line-height:1}',
    /* המגירה */
    /* נעצרת מתחת לפס העליון של האתר, כדי שכפתורי הבית והשפה יישארו לחיצים */
    '#agT{position:fixed;top:var(--agTop,0px);right:0;height:calc(100% - var(--agTop,0px));',
    '  width:min(430px,90vw);z-index:2147482990;',
    '  background:var(--panel,#2b1659);border-left:4px solid var(--ink,#140a2e);color:#fff;',
    '  border-top-left-radius:22px;display:flex;flex-direction:column;transform:translateX(101%);',
    '  transition:transform .26s cubic-bezier(.2,.8,.3,1);box-shadow:-14px 0 40px rgba(0,0,0,.45)}',
    '#agT.on{transform:translateX(0)}',
    '#agT.drag{transition:none}',
    '#agTtop{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding:14px 16px 10px}',
    '#agTtop h2{margin:0;font-size:20px;font-weight:900;flex:1}',
    '#agTx{background:var(--hot,#ff3d8b);color:#fff;border:3px solid var(--ink,#140a2e);',
    '  border-radius:999px;width:38px;height:38px;font-size:18px;font-weight:900;cursor:pointer;',
    '  box-shadow:0 4px 0 var(--ink,#140a2e);line-height:1}',
    '#agTx:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#140a2e)}',
    '#agTabs{display:flex;gap:7px;padding:0 16px 12px;flex:0 0 auto;flex-wrap:wrap}',
    '#agTabs button{font:inherit;font-size:14px;font-weight:800;padding:8px 13px;border-radius:999px;',
    '  border:3px solid var(--ink,#140a2e);background:var(--grape,#3a1d6e);color:#fff;cursor:pointer;',
    '  box-shadow:0 3px 0 var(--ink,#140a2e)}',
    '#agTabs button.on{background:var(--ice,#35e0ff);color:var(--ink,#140a2e)}',
    '#agTbody{flex:1;overflow:auto;padding:0 16px 24px;-webkit-overflow-scrolling:touch}',
    /* כרטיס הטיסה — הדבר הראשון שרואים */
    '.agTk{background:var(--grape,#3a1d6e);border:4px solid var(--ink,#140a2e);border-radius:20px;',
    '  box-shadow:0 6px 0 var(--ink,#140a2e);overflow:hidden;margin:0 0 14px}',
    '.agTk .top{padding:14px 16px 10px;display:flex;align-items:flex-start;gap:10px}',
    '.agTk .to{flex:1;min-width:0}',
    '.agTk .to b{display:block;font-size:19px;font-weight:900;line-height:1.2}',
    '.agTk .to small{display:block;opacity:.8;font-size:13px;margin-top:3px}',
    '.agTk .cd{text-align:center;flex:0 0 auto;padding:0 2px}',
    '.agTk .cd i{display:block;font-style:normal;font-size:34px;font-weight:900;line-height:1;',
    '  color:var(--zap,#ffd43b);font-variant-numeric:tabular-nums}',
    '.agTk .cd span{display:block;font-size:11px;opacity:.85;margin-top:2px}',
    /* קו התלישה של הכרטיס */
    '.agTk .rip{height:0;border-top:3px dashed rgba(255,255,255,.3);margin:4px 14px;position:relative}',
    '.agTk .rip:before,.agTk .rip:after{content:"";position:absolute;top:-11px;width:18px;height:18px;',
    '  border-radius:50%;background:var(--panel,#2b1659);border:3px solid var(--ink,#140a2e)}',
    '.agTk .rip:before{right:-24px}.agTk .rip:after{left:-24px}',
    '.agTk .facts{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px 14px}',
    '.agTk .facts span{background:rgba(255,255,255,.1);border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700}',
    /* רשימות */
    '.agG{margin:0 0 14px}',
    '.agG h3{margin:0 0 7px;font-size:15px;font-weight:900;opacity:.95}',
    '.agL{list-style:none;margin:0;padding:0}',
    '.agL li{display:flex;align-items:flex-start;gap:9px;padding:7px 10px;border-radius:12px;',
    '  background:rgba(255,255,255,.055);margin-bottom:5px;font-size:14.5px;line-height:1.35}',
    '.agL li.on{opacity:.45}',
    '.agL li.on .tx{text-decoration:line-through}',
    '.agL .bx{flex:0 0 auto;width:22px;height:22px;border-radius:7px;border:2.5px solid var(--ink,#140a2e);',
    '  background:#fff;cursor:pointer;font-size:14px;line-height:17px;text-align:center;color:var(--ink,#140a2e);',
    '  font-weight:900;padding:0}',
    '.agL li.on .bx{background:var(--mint,#6cf2a8)}',
    '.agL .tx{flex:1;min-width:0;padding-top:1px;word-break:break-word}',
    '.agL .del{flex:0 0 auto;background:none;border:0;color:#fff;opacity:.5;cursor:pointer;font-size:15px;padding:0 2px}',
    /* קישורים */
    '.agLinks{display:grid;grid-template-columns:1fr 1fr;gap:7px}',
    '.agLink{display:flex;align-items:center;gap:8px;text-decoration:none;color:#fff;',
    '  background:rgba(255,255,255,.08);border:2.5px solid var(--ink,#140a2e);border-radius:13px;',
    '  padding:9px 11px;font-size:13.5px;font-weight:700;line-height:1.25;box-shadow:0 3px 0 var(--ink,#140a2e)}',
    '.agLink:active{transform:translateY(3px);box-shadow:0 0 0 var(--ink,#140a2e)}',
    '.agLink .e{flex:0 0 auto;font-size:17px}',
    '.agLink span:last-child{min-width:0;word-break:break-word}',
    '@media (max-width:360px){.agLinks{grid-template-columns:1fr}}',
    /* ימים */
    '.agD{display:flex;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.055);margin-bottom:5px}',
    '.agD b{flex:0 0 auto;background:var(--zap,#ffd43b);color:var(--ink,#140a2e);border-radius:9px;',
    '  padding:2px 8px;font-size:12.5px;height:fit-content;font-weight:900}',
    '.agD span{flex:1;font-size:14.5px;line-height:1.35;padding-top:2px}',
    /* טפסים */
    '.agF label{display:block;font-size:13px;font-weight:800;opacity:.9;margin:10px 0 4px}',
    '.agF input,.agF select{width:100%;font:inherit;font-size:16px;padding:10px 12px;border-radius:13px;',
    '  border:3px solid var(--ink,#140a2e);background:rgba(255,255,255,.1);color:#fff}',
    '.agF select{background:var(--grape,#3a1d6e)}',
    '.agF input::placeholder{color:rgba(255,255,255,.5)}',
    '.agB{width:100%;font:inherit;font-size:16px;font-weight:900;padding:12px;margin-top:14px;',
    '  border-radius:14px;border:3px solid var(--ink,#140a2e);background:var(--mint,#6cf2a8);',
    '  color:var(--ink,#140a2e);cursor:pointer;box-shadow:0 5px 0 var(--ink,#140a2e)}',
    '.agB:active{transform:translateY(4px);box-shadow:0 1px 0 var(--ink,#140a2e)}',
    '.agB.alt{background:var(--grape,#3a1d6e);color:#fff}',
    '.agB.sm{width:auto;padding:9px 15px;font-size:14px;margin-top:0}',
    '.agRow{display:flex;gap:8px;align-items:center;margin-top:12px}',
    '.agRow input{flex:1}',
    '.agNote{font-size:13px;opacity:.75;line-height:1.45;margin:10px 0 0}',
    '.agEmpty{text-align:center;opacity:.75;font-size:14.5px;padding:26px 10px;line-height:1.5}',
    /* טיימר */
    '.agClock{text-align:center;font-size:54px;font-weight:900;font-variant-numeric:tabular-nums;',
    '  letter-spacing:1px;margin:18px 0 4px;color:var(--zap,#ffd43b)}',
    '.agChips{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:10px 0}',
    '@media (prefers-reduced-motion:reduce){#agT{transition:none}#agTs{transition:none}}'
  ].join('\n');

  /* ---------- בנייה ---------- */
  var sc = document.createElement('style'); sc.textContent = CSS;
  var root, scrim, handle, tabsEl, bodyEl, tab = 'trip';

  function build() {
    document.head.appendChild(sc);

    handle = document.createElement('button');
    handle.id = 'agTh'; handle.type = 'button';
    handle.setAttribute('aria-label', 'כלים שימושיים');
    handle.innerHTML = '<b>🧰</b>כלים';

    scrim = document.createElement('div'); scrim.id = 'agTs';

    root = document.createElement('aside');
    root.id = 'agT';
    root.setAttribute('aria-label', 'כלים שימושיים');
    /* theme.css מצייר פס קפוא בראש דף הלובי בלבד; שם המגירה מתחילה מתחתיו */
    if (document.getElementById('grid'))
      root.style.setProperty('--agTop', 'calc(54px + env(safe-area-inset-top))');
    root.innerHTML =
      '<div id="agTtop"><h2>🧰 הכלים שלי</h2>' +
      '<button id="agTx" type="button" aria-label="סגירה">✕</button></div>' +
      '<div id="agTabs"></div><div id="agTbody"></div>';

    document.body.appendChild(handle);
    document.body.appendChild(scrim);
    document.body.appendChild(root);

    tabsEl = root.querySelector('#agTabs');
    bodyEl = root.querySelector('#agTbody');

    var TABS = [['trip', '🧳 נסיעה'], ['todo', '✅ מטלות'], ['timer', '⏱️ טיימר']];
    TABS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = t[1]; b.dataset.t = t[0];
      b.onclick = function () { tab = t[0]; paint(); };
      tabsEl.appendChild(b);
    });

    handle.onclick = function () { open(); };
    scrim.onclick = close;
    root.querySelector('#agTx').onclick = close;
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('on')) close(); });
    swipe();
    paint();
  }

  function open() { root.classList.add('on'); scrim.classList.add('on'); paint(); }
  function close() { root.classList.remove('on'); scrim.classList.remove('on'); stopTick(); }

  /* ---------- ההחלקה ----------
     נפתח רק כשהאצבע נעה בבירור לרוחב, כדי שגלילה רגילה של הדף לא תפתח אותו. */
  function swipe() {
    var x0 = 0, y0 = 0, id = null, live = false, judged = false, wasOpen = false, off = 0;
    function startable(t) {
      return !(t.closest && t.closest('input,textarea,select,button,a,.mo,canvas'));
    }
    addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { live = false; return; }
      var t = e.touches[0];
      wasOpen = root.classList.contains('on');
      /* סגורה: החלקה בכל מקום בדף. פתוחה: רק בתוך המגירה עצמה */
      if (!wasOpen && !startable(e.target)) return;
      if (wasOpen && !root.contains(e.target)) return;
      id = t.identifier; x0 = t.clientX; y0 = t.clientY;
      live = true; judged = false; off = wasOpen ? 0 : root.offsetWidth;
    }, { passive: true });

    addEventListener('touchmove', function (e) {
      if (!live || e.touches.length !== 1 || e.touches[0].identifier !== id) return;
      var t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0, w = root.offsetWidth || 1;
      if (!judged) {
        if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
        /* אנכי בבירור? זו גלילה של הדף, עזוב אותה */
        if (Math.abs(dx) < Math.abs(dy) * 1.6) { live = false; return; }
        judged = true; root.classList.add('drag'); scrim.classList.add('on');
      }
      /* שמאלה פותח (המגירה נכנסת מימין), ימינה סוגר */
      off = Math.min(w, Math.max(0, wasOpen ? dx : w + dx));
      root.style.transform = 'translateX(' + off + 'px)';
      scrim.style.opacity = String(Math.max(0, 1 - off / w));
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    function end() {
      if (!live) return;
      live = false;
      if (!judged) return;
      var w = root.offsetWidth || 1;
      root.classList.remove('drag');
      root.style.transform = '';
      scrim.style.opacity = '';
      /* נפתחת אם נגררה יותר מחצי הדרך */
      if (1 - off / w > 0.5) open(); else close();
    }
    addEventListener('touchend', end, { passive: true });
    addEventListener('touchcancel', end, { passive: true });
  }

  /* ---------- ציור ---------- */
  function paint() {
    if (!root) return;
    [].forEach.call(tabsEl.children, function (b) { b.classList.toggle('on', b.dataset.t === tab); });
    if (tab !== 'timer') stopTick();
    if (tab === 'trip') paintTrip();
    else if (tab === 'todo') paintTodo();
    else paintTimer();
  }

  /* ===== נסיעה ===== */
  var editing = null;

  function paintTrip() {
    var trips = load(KT, []);
    if (editing || !trips.length) return tripForm();

    /* הקרובה ביותר קודם */
    trips.sort(function (a, b) { return (parseD(a.go) || 0) - (parseD(b.go) || 0); });
    var h = '';
    trips.forEach(function (t) { h += tripCard(t); });
    h += '<button class="agB alt" id="agNew">➕ נסיעה חדשה</button>';
    bodyEl.innerHTML = h;
    bodyEl.querySelector('#agNew').onclick = function () { editing = { id: '' }; paint(); };
    wireTrip();
  }

  function tripCard(t) {
    var d = destOf(t.destKey), go = parseD(t.go), back = parseD(t.back);
    var left = go ? daysBetween(today(), go) : null;
    var p = packList(t), plan = dayPlan(t);
    var cdNum, cdLab;
    if (left === null) { cdNum = '—'; cdLab = ''; }
    else if (left > 0) { cdNum = left; cdLab = left === 1 ? 'יום' : 'ימים'; }
    else if (left === 0) { cdNum = '🎉'; cdLab = 'היום!'; }
    else if (back && daysBetween(today(), back) >= 0) { cdNum = '✈️'; cdLab = 'בנסיעה'; }
    else { cdNum = '✓'; cdLab = 'היה כיף'; }

    var h = '<section class="agTrip" data-id="' + esc(t.id) + '"><article class="agTk">';
    h += '<div class="top"><div class="to"><b>' + esc(t.dest) + '</b><small>';
    h += go ? fmtD(go) + (back ? ' – ' + fmtD(back) : '') : 'בלי תאריך עדיין';
    h += '</small></div><div class="cd"><i>' + cdNum + '</i><span>' + cdLab + '</span></div></div>';
    h += '<div class="rip"></div><div class="facts">';
    h += '<span>' + BANDTXT[p.w.band] + '</span>';
    if (p.w.rain) h += '<span>🌧️ עונת גשם</span>';
    if (go && back) h += '<span>🛏️ ' + num(p.nights) + ' לילות</span>';
    if (d && d.f > 0) h += '<span>🛫 ' + num(d.f % 1 ? d.f.toFixed(2).replace(/0$/, '') : d.f) + ' שעות טיסה</span>';
    if (d) h += '<span>💱 ' + esc(d.cur) + '</span><span>🗣️ ' + esc(d.lang) + '</span>';
    if (d && d.plug === 1) h += '<span>🔌 מתאם בריטי</span>';
    if (d && d.plug === 2) h += '<span>🔌 מתאם אמריקאי</span>';
    h += '</div></article>';

    /* הקישורים — כבר מלאים ביעד, באזור, בתאריכים ובכמה אנשים */
    h += '<div class="agG"><h3>🔗 הכול מוכן, רק ללחוץ</h3>';
    if (t.areaN) h += '<p class="agNote" style="margin:0 0 8px">האזור שבחרתם: <b>' + esc(t.areaN) + '</b>' +
      (t.who ? ' · ' + num(t.who) + ' אנשים' : '') + '</p>';
    h += '<div class="agLinks">';
    links(t).forEach(function (l) {
      h += '<a class="agLink" href="' + esc(l.u) + '" target="_blank" rel="noopener noreferrer">' +
           '<span class="e">' + l.e + '</span><span>' + esc(l.t) + '</span></a>';
    });
    h += '</div>';
    if (d && d.em) h += '<p class="agNote">🚨 מספר חירום ב' + esc(d.cc) + ': <b>' + esc(d.em) + '</b></p>';
    h += '</div>';

    if (plan.length) {
      h += '<div class="agG"><h3>🗺️ התוכנית ליום-יום</h3>';
      plan.forEach(function (x, i) {
        h += '<div class="agD"><b>יום ' + num(i + 1) + '</b><span>' + esc(x.what) +
             '<br><small style="opacity:.6">' + fmtD(x.d) + '</small></span></div>';
      });
      h += '</div>';
    }

    t.done = t.done || {};
    var total = 0, done = 0;
    p.groups.forEach(function (g) { g.i.forEach(function (it) { total++; if (t.done[it]) done++; }); });
    h += '<div class="agG"><h3>🧳 מה לארוז · ' + num(done) + '/' + num(total) + '</h3>';
    p.groups.forEach(function (g) {
      h += '<h3 style="opacity:.7;font-size:13.5px;margin-top:10px">' + esc(g.h) + '</h3><ul class="agL">';
      g.i.forEach(function (it) {
        var on = !!t.done[it];
        h += '<li class="' + (on ? 'on' : '') + '">' +
             '<button class="bx" type="button" data-pk="' + esc(it) + '" aria-label="סימון">' + (on ? '✓' : '') + '</button>' +
             '<span class="tx">' + esc(it) + '</span></li>';
      });
      h += '</ul>';
    });
    h += '</div>';
    h += '<div class="agRow"><button class="agB sm alt" type="button" data-ed="1">✏️ שינוי</button>' +
         '<button class="agB sm alt" type="button" data-rm="1">🗑️ מחיקה</button></div>';
    h += '<p class="agNote">הרשימה נבנתה לפי היעד, החודש ואורך הנסיעה. מה שסימנתם נשמר במכשיר.</p>';
    return h + '</section>';
  }

  /* לאיזו נסיעה שייך הכפתור שנלחץ */
  function tripIdOf(el) {
    var s = el.closest('.agTrip');
    return s ? s.dataset.id : null;
  }
  function wireTrip() {
    [].forEach.call(bodyEl.querySelectorAll('[data-pk]'), function (b) {
      b.onclick = function () {
        var id = tripIdOf(b), trips = load(KT, []);
        for (var i = 0; i < trips.length; i++) if (trips[i].id === id) {
          trips[i].done = trips[i].done || {};
          var k = b.dataset.pk;
          if (trips[i].done[k]) delete trips[i].done[k]; else trips[i].done[k] = 1;
          save(KT, trips); paint(); return;
        }
      };
    });
    [].forEach.call(bodyEl.querySelectorAll('[data-ed]'), function (b) {
      b.onclick = function () {
        var id = tripIdOf(b), trips = load(KT, []);
        for (var i = 0; i < trips.length; i++) if (trips[i].id === id) { editing = trips[i]; paint(); return; }
      };
    });
    [].forEach.call(bodyEl.querySelectorAll('[data-rm]'), function (b) {
      b.onclick = function () {
        var id = tripIdOf(b);
        if (!confirm('למחוק את הנסיעה?')) return;
        save(KT, load(KT, []).filter(function (t) { return t.id !== id; }));
        paint();
      };
    });
  }

  function tripForm() {
    var t = editing && editing.id ? editing : { dest: '', destKey: '', go: '', back: '', who: 2 };
    var opts = '<option value="">— בחרו יעד —</option>';
    DEST.forEach(function (d) {
      opts += '<option value="' + d.k + '"' + (d.k === t.destKey ? ' selected' : '') + '>' + esc(d.n) + '</option>';
    });
    opts += '<option value="other"' + (t.destKey === 'other' ? ' selected' : '') + '>מקום אחר…</option>';

    bodyEl.innerHTML =
      '<div class="agF">' +
      '<label for="agDest">לאן טסים?</label><select id="agDest">' + opts + '</select>' +
      '<div id="agOther" ' + (t.destKey === 'other' ? '' : 'hidden') + '>' +
      '<label for="agOtherN">שם המקום</label>' +
      '<input id="agOtherN" maxlength="40" placeholder="לדוגמה: קנדה · טורונטו" value="' +
        (t.destKey === 'other' ? esc(t.dest) : '') + '"></div>' +
      '<div id="agAreaBox" hidden><label for="agArea">באיזה אזור לחפש מלונות?</label>' +
      '<select id="agArea"></select><p class="agNote" id="agAreaD" style="margin:5px 0 0"></p></div>' +
      '<label for="agGo">תאריך יציאה</label><input id="agGo" type="date" value="' + esc(t.go) + '">' +
      '<label for="agBack">תאריך חזרה</label><input id="agBack" type="date" value="' + esc(t.back) + '">' +
      '<label for="agWho">כמה אנשים נוסעים?</label>' +
      '<input id="agWho" type="number" min="1" max="12" inputmode="numeric" value="' + (+t.who || 2) + '">' +
      '<button class="agB" id="agSave">' + (t.id ? '💾 שמירה' : '🧳 תכננו לי את הנסיעה') + '</button>' +
      (t.id || load(KT, []).length ? '<button class="agB alt" id="agCancel">ביטול</button>' : '') +
      '<p class="agNote">אחרי שתבחרו, זה בונה לכם רשימת ציוד לפי מזג האוויר שם בחודש הזה, תוכנית לכל ' +
      'יום, ספירה לאחור, וקישורים למלונות ולטיסות שכבר מלאים בתאריכים ובאזור שבחרתם. ' +
      'הכול נשמר כאן במכשיר.</p></div>';

    var sel = bodyEl.querySelector('#agDest'), other = bodyEl.querySelector('#agOther');
    var box = bodyEl.querySelector('#agAreaBox'), area = bodyEl.querySelector('#agArea');
    var adesc = bodyEl.querySelector('#agAreaD');

    /* רשימת האזורים משתנה לפי היעד */
    function fillAreas() {
      var d = destOf(sel.value);
      if (!d || !d.ar) { box.hidden = true; area.innerHTML = ''; return; }
      box.hidden = false;
      var o = '';
      d.ar.forEach(function (a, i) {
        o += '<option value="' + i + '"' + (a.n === t.areaN ? ' selected' : '') + '>' + esc(a.n) + '</option>';
      });
      o += '<option value="any"' + (t.areaN === '' ? ' selected' : '') + '>לא משנה — כל העיר</option>';
      area.innerHTML = o;
      showDesc();
    }
    function showDesc() {
      var d = destOf(sel.value);
      var a = d && d.ar && d.ar[+area.value];
      adesc.textContent = a ? a.d : 'נחפש מלונות בכל העיר.';
    }
    area.onchange = showDesc;
    sel.onchange = function () { other.hidden = sel.value !== 'other'; fillAreas(); };
    fillAreas();

    var c = bodyEl.querySelector('#agCancel');
    if (c) c.onclick = function () { editing = null; paint(); };

    bodyEl.querySelector('#agSave').onclick = function () {
      var k = sel.value;
      if (!k) { sel.focus(); return; }
      var name = k === 'other'
        ? (bodyEl.querySelector('#agOtherN').value || '').trim()
        : (destOf(k) || {}).n;
      if (!name) { bodyEl.querySelector('#agOtherN').focus(); return; }
      var go = bodyEl.querySelector('#agGo').value, back = bodyEl.querySelector('#agBack').value;
      if (go && back && parseD(back) < parseD(go)) { alert('תאריך החזרה לפני תאריך היציאה 🙂'); return; }
      var who = Math.max(1, Math.min(12, +bodyEl.querySelector('#agWho').value || 2));
      var d = destOf(k), a = (d && d.ar && area.value !== 'any') ? d.ar[+area.value] : null;
      var patch = { dest: name, destKey: k, go: go, back: back, who: who,
                    areaN: a ? a.n : '', areaQ: a ? a.q : '' };
      var trips = load(KT, []), found = false;
      for (var i = 0; i < trips.length; i++) if (trips[i].id === (editing && editing.id)) {
        for (var p2 in patch) trips[i][p2] = patch[p2];
        found = true;
      }
      if (!found) { patch.id = uid(); patch.done = {}; trips.push(patch); }
      save(KT, trips); editing = null; paint();
    };
  }

  /* ===== מטלות ===== */
  function paintTodo() {
    var list = load(KD, []);
    var h = '<div class="agRow"><input id="agTdI" maxlength="80" placeholder="מה צריך לעשות?">' +
            '<button class="agB sm" id="agTdA" type="button">➕</button></div>';
    if (!list.length) h += '<p class="agEmpty">אין מטלות כרגע.<br>כתבו משהו למעלה ולחצו ➕</p>';
    else {
      var open = list.filter(function (x) { return !x.done; }).length;
      h += '<div class="agG" style="margin-top:14px"><h3>נשארו ' + num(open) + ' מתוך ' + num(list.length) + '</h3><ul class="agL">';
      list.forEach(function (x) {
        h += '<li class="' + (x.done ? 'on' : '') + '">' +
             '<button class="bx" type="button" data-td="' + esc(x.id) + '" aria-label="סימון">' + (x.done ? '✓' : '') + '</button>' +
             '<span class="tx">' + esc(x.t) + '</span>' +
             '<button class="del" type="button" data-tdx="' + esc(x.id) + '" aria-label="מחיקה">✕</button></li>';
      });
      h += '</ul></div>';
      if (list.some(function (x) { return x.done; }))
        h += '<button class="agB alt" id="agTdC" type="button">לנקות את מה שסומן</button>';
    }
    bodyEl.innerHTML = h;

    var inp = bodyEl.querySelector('#agTdI');
    function add() {
      var v = (inp.value || '').trim(); if (!v) return;
      var l = load(KD, []); l.push({ id: uid(), t: v, done: 0 }); save(KD, l);
      inp.value = ''; paint(); bodyEl.querySelector('#agTdI').focus();
    }
    bodyEl.querySelector('#agTdA').onclick = add;
    inp.onkeydown = function (e) { if (e.key === 'Enter') add(); };
    [].forEach.call(bodyEl.querySelectorAll('[data-td]'), function (b) {
      b.onclick = function () {
        var l = load(KD, []);
        l.forEach(function (x) { if (x.id === b.dataset.td) x.done = x.done ? 0 : 1; });
        save(KD, l); paint();
      };
    });
    [].forEach.call(bodyEl.querySelectorAll('[data-tdx]'), function (b) {
      b.onclick = function () {
        save(KD, load(KD, []).filter(function (x) { return x.id !== b.dataset.tdx; })); paint();
      };
    });
    var cl = bodyEl.querySelector('#agTdC');
    if (cl) cl.onclick = function () {
      save(KD, load(KD, []).filter(function (x) { return !x.done; })); paint();
    };
  }

  /* ===== טיימר ===== */
  var tEnd = 0, tLeft = 0, tRun = false, tiv = null, beeped = false;
  function stopTick() { if (tiv) { clearInterval(tiv); tiv = null; } }
  function mmss(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(s / 60);
    return (m < 10 ? '0' : '') + m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60);
  }
  function paintTimer() {
    var left = tRun ? Math.max(0, tEnd - Date.now()) : tLeft;
    bodyEl.innerHTML =
      '<div class="agClock" id="agClk">' + mmss(left) + '</div>' +
      '<div class="agChips">' +
      [1, 3, 5, 10, 15, 30].map(function (m) {
        return '<button class="agB sm alt" type="button" data-m="' + m + '">' + num(m) + ' דק׳</button>';
      }).join('') + '</div>' +
      '<button class="agB" id="agGo2" type="button">' + (tRun ? '⏸️ עצירה' : '▶️ הפעלה') + '</button>' +
      '<button class="agB alt" id="agRs" type="button">↺ איפוס</button>' +
      '<p class="agNote">בוחרים כמה דקות, ולוחצים הפעלה. כל עוד המגירה פתוחה הטיימר רץ ומצפצף בסוף.</p>';

    [].forEach.call(bodyEl.querySelectorAll('[data-m]'), function (b) {
      b.onclick = function () { tLeft = +b.dataset.m * 60000; tRun = false; beeped = false; stopTick(); paintTimer(); };
    });
    bodyEl.querySelector('#agGo2').onclick = function () {
      if (tRun) { tLeft = Math.max(0, tEnd - Date.now()); tRun = false; stopTick(); }
      else {
        if (tLeft <= 0) tLeft = 60000;
        tEnd = Date.now() + tLeft; tRun = true; beeped = false; tick();
      }
      paintTimer();
    };
    bodyEl.querySelector('#agRs').onclick = function () { tRun = false; tLeft = 0; stopTick(); paintTimer(); };
    if (tRun) tick();
  }
  function tick() {
    stopTick();
    tiv = setInterval(function () {
      var el = document.getElementById('agClk');
      if (!el) return stopTick();
      var left = Math.max(0, tEnd - Date.now());
      el.textContent = mmss(left);
      /* tLeft חייב להתאפס, אחרת הציור הבא היה חוזר להציג את הזמן המקורי */
      if (left <= 0 && !beeped) { beeped = true; tRun = false; tLeft = 0; stopTick(); beep(); paintTimer(); }
    }, 200);
  }
  function beep() {
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      var c = new A(), t = c.currentTime;
      [0, .22, .44].forEach(function (o) {
        var g = c.createGain(), s = c.createOscillator();
        s.type = 'sine'; s.frequency.value = 880;
        g.gain.setValueAtTime(.0001, t + o);
        g.gain.exponentialRampToValueAtTime(.25, t + o + .02);
        g.gain.exponentialRampToValueAtTime(.0001, t + o + .18);
        s.connect(g); g.connect(c.destination); s.start(t + o); s.stop(t + o + .2);
      });
      setTimeout(function () { try { c.close(); } catch (e) {} }, 1200);
    } catch (e) {}
  }

  /* ---------- החוצה ---------- */
  window.AGTools = { open: open, close: close, go: function (t) { tab = t; open(); } };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build);
  else build();
})();
