# אלון גיימס 🎮

אתר שמרכז את המשחקים של אלון. דף הבית (`index.html`) קורא את `games.json` ומציג כרטיס לכל משחק.

## להוסיף משחק חדש

1. ליצור תיקייה למשחק, למשל `impostor/`, עם `index.html` ואייקונים.
2. להוסיף אובייקט לסוף `games.json`: `id`, `name`, `description`, `url` (למשל `"impostor/"`), `icon` ו-`tag`.
3. לדחוף לגיטהאב. Netlify מפרסם לבד, והכרטיס מופיע בדף הבית.

## משחקים

- `mole/` תפוס את החפרפרת (PWA להתקנה, עם `manifest.webmanifest` ו-`sw.js`)

## Netlify

Import from Git, Build command ריק, Publish directory `.`.
