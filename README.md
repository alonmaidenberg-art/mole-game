# המשחקים של אלון מידנברג 🎮

אתר שמרכז את המשחקים של אלון. דף הבית (`index.html`) קורא את `games.json` ומציג כרטיס לכל משחק.

## להוסיף משחק חדש

1. ליצור תיקייה למשחק, למשל `impostor/`, עם `index.html` ואייקונים.
2. להוסיף אובייקט לסוף `games.json`: `id`, `name`, `description`, `url` (למשל `"impostor/"`), `icon` ו-`tag`.
3. לדחוף לגיטהאב. Netlify מפרסם לבד, והכרטיס מופיע בדף הבית.

## משחקים

- `mole/` תפוס את החפרפרת (PWA להתקנה, עם `manifest.webmanifest` ו-`sw.js`)
- `impostor/` אימפוסטר (משחק חברה לטלפון אחד, המילים ב-`words.js`)
- `chess/` שחמט מלא (מנוע ב-`engine.js`, נגד המחשב ב-4 רמות או שני שחקנים)
- `basketball/` כדורסל 1 על 1 עם 20 קבוצות NBA ו-15 שחקנים בכל קבוצה (הנתונים ב-`basketball/teams.js`, אפשר לערוך שמות ודירוגים)
- `englishbot/` EnglishBot, משחקי לימוד אנגלית (PWA)

## Netlify

Import from Git, Build command ריק, Publish directory `.`.
- `tictactoe/` איקס עיגול · `snake/` נחש · `game2048/` 2048 · `memory/` זיכרון · `blocks/` בלוקים (עולם בלוקים)

- `connect4/` 4 בשורה · `minesweeper/` שולה מוקשים · `fallingblocks/` בלוקים נופלים · `flappy/` ציפור מעופפת · `hangman/` איש תלוי

- `hub.js` ארנק משותף (מטבעות/יהלומים), קוד אדמין וכפתור 🏠 בכל משחק. בלוקים: מלאי, יצירה, זומבים. כדורסל: חנות כוחות.

- `superhoops/` סופר בסקטבול
