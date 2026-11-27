#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""בונה את "מה בא לך לשחק?" — הסיור בתחתית הלובי.

   הקטע נכתב כ-HTML אמיתי לתוך index.html ולא נוצר בג'אווהסקריפט,
   כי מנוע חיפוש צריך לראות אותו גם בלי להריץ קוד. הטקסט בנוי ממילים
   שאנשים באמת מחפשים — "משחק ריצה אינסופי", "הגנת מגדלים", "משחק
   לשניים" — ולא משמות של משחקים של אחרים.

   הרצה:  python3 .bot/build-guide.py
"""
import json, re, html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
games = json.loads((ROOT / 'games.json').read_text(encoding='utf-8'))

# כל קבוצה: כותרת, הצבע שלה, התגיות שנכנסות אליה, והפסקה שמסבירה אותה.
GROUPS = [
    dict(key='run', title='ריצה, קפיצה ורפלקסים', color='zap', emoji='🏃',
         tags=['רפלקסים', 'פשוט', 'אתגר'],
         text='משחקי ריצה אינסופית ומשחקי קפיצה, שבהם הכול תלוי בתגובה מהירה '
              'ובתזמון מדויק. מתחילים לאט, והמהירות עולה עד שהאצבע לא מספיקה. '
              'מושלמים למשחק קצר בהפסקה — סיבוב אחד לוקח פחות מדקה, ותמיד '
              'מתחשק עוד ניסיון כדי לשבור את השיא.'),
    dict(key='action', title='אקשן, ירי והישרדות', color='hot', emoji='🎯',
         tags=['אקשן', 'ירי', 'לחימה', 'בוס'],
         text='משחקי ירי ומשחקי הישרדות מול גלים של אויבים שנהיים קשים יותר '
              'בכל סיבוב. אוספים כסף, משדרגים נשקים, ומנסים להחזיק מעמד גל '
              'אחד יותר מבפעם הקודמת. יש גם קרבות בוס לסיום.'),
    dict(key='3d', title='תלת-ממד בדפדפן', color='ice', emoji='🧊',
         tags=['3D', 'מירוץ'],
         text='משחקי תלת ממד שרצים ישר בדפדפן, בלי להוריד ובלי להתקין כלום — '
              'נהיגה, מירוצים, מסלולי מכשולים וקפיצות בין גושים. עובדים גם '
              'בטלפון, עם שליטה במגע.'),
    dict(key='think', title='חשיבה, לוח ופאזלים', color='mint', emoji='🧠',
         tags=['חשיבה', 'פאזל', 'זיכרון', 'מילים', 'לימוד', 'קלאסי'],
         text='משחקי חשיבה, משחקי לוח ופאזלים לאנשים שאוהבים לקחת רגע ולתכנן. '
              'שחמט מלא, משחקי זיכרון, משחקי מילים ותרגילי חשבון. אפשר לשחק '
              'נגד המחשב בכמה רמות קושי, או מול מישהו שיושב לידכם.'),
    dict(key='build', title='אסטרטגיה ובנייה', color='zap', emoji='🏗️',
         tags=['אסטרטגיה', 'יצירה', 'הרפתקה'],
         text='משחקי אסטרטגיה שבהם מחליטים לאן ללכת ומה לבנות: הגנת מגדלים '
              'מול גלי אויבים, כיבוש שטח על המפה, ובנייה חופשית שבה אתם '
              'מתכננים את השלב ואז משחקים בו בעצמכם.'),
    dict(key='sport', title='ספורט', color='ice', emoji='🏀',
         tags=['ספורט'],
         text='משחקי ספורט לדפדפן — כדורסל, כדורגל, הוקי וטניס שולחן. '
              'אפשר נגד המחשב, אחד מול אחד, או טורניר שלם.'),
    dict(key='arcade', title='ארקייד וקלאסיקות', color='hot', emoji='🕹️',
         tags=['ארקייד'],
         text='משחקי ארקייד קצרים בסגנון הקלאסי: נחש, בלוקים נופלים, '
              'לבנים, חלליות ועוד. כאלה שלומדים תוך שלוש שניות ואז מנסים '
              'לשפר את הניקוד שוב ושוב.'),
]

FRIENDS = dict(key='friends', title='לשחק עם חברים', color='mint', emoji='👥',
               text='משחקים לשניים על טלפון אחד, בלי להתחבר ובלי חשבון — '
                    'פשוט מעבירים את המכשיר. יש גם משחקי חברה לקבוצה, '
                    'ומשחקים שאפשר לשחק בהם אחד מול אחד על אותו מסך.')


def pick(tags):
    return [g for g in games if g.get('tag') in tags]


def friends_games():
    pat = re.compile('שני שחקנים|משחק לשניים|חברה|נגד חבר|אחד על אחד|טורניר')
    return [g for g in games
            if g.get('tag') in ('חברה', 'משחק לשניים') or pat.search(g.get('description', ''))]


def chips(items):
    out = []
    for g in items:
        out.append(
            '<a class="gchip" href="{url}"><img src="{icon}" alt="" width="28" height="28" '
            'loading="lazy" decoding="async"><span>{name}</span></a>'.format(
                url=html.escape(g['url']), icon=html.escape(g['icon']),
                name=html.escape(g['name'])))
    return '\n      '.join(out)


def block(spec, items):
    if not items:
        return ''
    return (
        '\n    <article class="gblock g-{c}">\n'
        '      <h3><span aria-hidden="true">{e}</span>{t} <b>{n}</b></h3>\n'
        '      <p>{p}</p>\n'
        '      <div class="gchips">\n      {chips}\n      </div>\n'
        '    </article>'
    ).format(c=spec['color'], e=spec['emoji'], t=html.escape(spec['title']),
             n=len(items), p=html.escape(spec['text']), chips=chips(items))


parts = []
used = set()
for spec in GROUPS:
    items = pick(spec['tags'])
    used.update(g['id'] for g in items)
    parts.append(block(spec, items))
fr = friends_games()
parts.append(block(FRIENDS, fr))
used.update(g['id'] for g in fr)      # אחרת הם חוזרים שוב במדף "ועוד כמה"

# מדף שאריות שווה משהו רק אם באמת נשארו משחקים שלא הופיעו בשום מקום
rest = [g for g in games if g['id'] not in used]
if len(rest) >= 3:
    parts.append(block(dict(key='more', title='ועוד כמה', color='ice', emoji='✨',
                            text='משחקים שלא נכנסו לאף מדף אחר, וחבל לפספס אותם.'), rest))

guide = '''<!-- GUIDE:START  נוצר על ידי .bot/build-guide.py — אל תערכו ביד -->
  <section class="guide" aria-labelledby="guideH">
    <h2 id="guideH">מה בא לך לשחק?</h2>
    <p class="glead">{n} משחקים בעברית שרצים ישר בדפדפן — בטלפון, בטאבלט ובמחשב.
    בלי להוריד, בלי להתקין, בלי להירשם ובלי לשלם. בחרו מדף והתחילו.</p>
{blocks}
    <article class="gabout">
      <h3>על האתר</h3>
      <p><b>המשחקים של אלון מידנברג</b> הוא אוסף של {n} משחקים בעברית שאפשר
      לשחק בהם מיד: פותחים את הדף ומתחילים. אין מה להוריד, אין מה להתקין,
      ואין צורך להירשם או למסור פרטים. הכול חינם, ואין באתר פרסומות ואין
      מעקב אחרי מי שמשחק.</p>
      <p>האתר עובד בטלפון, בטאבלט ובמחשב — כל המשחקים נבנו כך שיהיו נוחים
      גם במסך מגע וגם עם מקלדת. אפשר גם להתקין את האתר כאפליקציה על מסך
      הבית, ואז הוא נפתח בחלון משלו כמו כל אפליקציה אחרת.</p>
      <p>מעבר למשחקים עצמם יש כאן מערכת שלמה: אוספים מטבעות ויהלומים בכל
      משחק, קונים איתם ערכות נושא ואפקטים בחנות, יש משימות יומיות ורצף
      ימים שנשמר, באטל פס עם פרסים, ושלבי בוס מיוחדים. כל ההתקדמות נשמרת
      במכשיר שלכם — בלי חשבון ובלי סיסמה.</p>
      <p>את האתר בונה <b>אלון מידנברג</b>, וכל משחק כאן נכתב מאפס: הקוד,
      הציורים והרעיונות. משחקים חדשים נוספים כל הזמן, ומדי שבוע עוברים על
      כל המשחקים ובודקים שהכול עובד — שאפשר לזוז, שאפשר ללחוץ, ושאף משחק
      לא נשבר בדרך.</p>
      <p>יש משחק ששבור, או רעיון למשחק חדש? ספרו לי, ואני מתקן ומוסיף.</p>
    </article>
  </section>
<!-- GUIDE:END -->'''.format(n=len(games), blocks='\n'.join(p for p in parts if p))

idx = ROOT / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'GUIDE:START' in s:
    s = re.sub(r'<!-- GUIDE:START.*?<!-- GUIDE:END -->', guide, s, flags=re.S)
else:
    s = s.replace('  <footer>', guide + '\n  <footer>', 1)
idx.write_text(s, encoding='utf-8')

n_blocks = len([p for p in parts if p])
print('נבנו %d מדפים, %d משחקים, %d תווים' % (n_blocks, len(games), len(guide)))

# ---- ה-sitemap מתוחזק מכאן, ולא ביד ----
# פעם אחת כבר קרה ש-13 משחקים חדשים לא היו בו וגוגל פשוט לא ידע עליהם.
# כל עוד מריצים את הסקריפט הזה אחרי הוספת משחק, זה לא יכול לקרות שוב.
BASE = 'https://alon-maidenberg.pages.dev/'
sm = ROOT / 'sitemap.xml'
if sm.exists():
    txt = sm.read_text(encoding='utf-8')
    missing = [g for g in games if (BASE + g['url']) not in txt and g['url'] not in txt]
    if missing:
        add = ''.join('<url><loc>%s%s</loc></url>\n' % (BASE, g['url']) for g in missing)
        sm.write_text(txt.replace('</urlset>', add + '</urlset>'), encoding='utf-8')
        print('נוספו ל-sitemap: %d משחקים (%s)'
              % (len(missing), ', '.join(g['url'] for g in missing)))
    else:
        print('ה-sitemap מעודכן — כל %d המשחקים בפנים' % len(games))
