# מסלול (Maslul)
# מסמך דרישות תוכנה (SRS)

| | |
|---|---|
| פרויקט | מסלול, רשת חברתית לחובבי רכב בישראל |
| גרסה | 1.1 |
| תאריך | 17 בספטמבר 2026 |
| מחבר | אלון כץ |
| קורס | פיתוח יישומי אינטרנט, פרויקט גמר |
| מצב | נכתב מתוך המערכת העובדת (commit `8147721`) |

המסמך נכתב מהמערכת המוגמרת, כך שכל דרישה בו מתארת התנהגות שקיימת בקוד. כל שינוי במערכת מעדכן את המסמך באותו commit.

---

## 1. מבוא

### 1.1 מטרת המערכת

מסלול היא אתר שבו חובבי רכב מציגים את הרכבים שבמוסך שלהם, מארגנים מפגשים ומרוצים, קונים ומוכרים רכבים וחלקים, מקימים קהילות סביב מותגים ותחומי עניין ומשוחחים בצ'אט בזמן אמת. היום כל זה מפוזר בקבוצות וואטסאפ ובלוחות מכירה כלליים; מסלול מרכזת הכול במקום אחד, עם חיפוש שמבין רכבים (יצרן, דגם, שנה, כוחות סוס) וגאוגרפיה (ציור אזור על מפה).

### 1.2 קהל יעד

| קהל | שימוש |
|---|---|
| חובבי רכב (חברים) | מוסך אישי, מפגשים ומרוצים, קנייה ומכירה, צ'אט |
| מארגני מפגשים (מארחים) | פרסום אירוע וניהול המשתתפים |
| מנהלי קבוצות | ניהול קבוצה, אישור חברים, אירועים בשם הקבוצה |
| מנהלי האתר (אדמין) | פיקוח על חברים ותוכן, מתן הרשאות |
| מרצים ובודקים | אימות עמידה בדרישות הפרויקט |

### 1.3 הגדרות ומונחים

| מונח | משמעות |
|---|---|
| חבר | משתמש רשום ומחובר `role: user` |
| אורח | מי שאינו מחובר |
| אדמין | חבר עם `role: admin`. רשאי לפעול על כל רשומה |
| מנהל קבוצה | החבר שיצר את הקבוצה `group.admin` |
| אירוע | מפגש `meet` או מרוץ `race` |
| פורמט מרוץ | Drag, Track, Rally, Hillclimb, Drift, Time attack |
| מסלול מרוץ (Circuit) | אחד משמונה המסלולים בספרייה המובנית, עם אורך בק"מ ותרשים |
| מודעה (Listing) | פריט למכירה: רכב שלם, חלק או כלי |
| פיד | ציר הזמן האישי: אירועים ומודעות מחברים ומהקבוצות שלי |
| חיפוש אזורי | ציור מצולע על המפה ומציאת אירועים או מודעות שנקודתם בתוכו |
| Session | רשומת התחברות בשרת, נשמרת ב-MongoDB ומזוהה בעוגייה `connect.sid` |
| Ajax | קריאות jQuery לנתיבי `/api/...` שמחזירים JSON |
| Socket | חיבור Socket.io לצ'אט |

---

## 2. תיאור כללי

### 2.1 מטרות עסקיות

1. מקום אחד למפגשים, מרוצים, מוסכים, מסחר וקהילה.
2. למצוא בקלות מה קורה קרוב אליי: לפי עיר, תאריך או אזור מצויר על מפה.
3. קהילות שמנהלות את עצמן, כולל קבוצות פרטיות.
4. שיחה בזמן אמת בין חברים בלי לצאת מהאתר.
5. תמונת מצב של הקהילה במספרים (גרפים חיים).
6. עמידה בדרישות הקורס: Node.js + Express במבנה MVC, MongoDB, שלושה מודלים לפחות עם CRUD וחיפוש מהממשק, שני חיפושים עם שלושה פרמטרים לפחות, jQuery ו-Ajax, React עם וידאו וקנבס, CSS3, Socket.io, גרפי D3 מנתונים חיים, ולידציה בשני הצדדים, ללא קריסות.

### 2.2 גבולות המערכת

| בתחום | מחוץ לתחום |
|---|---|
| חשבונות, פרופיל, חברים | תשלומים והעברת כסף |
| מוסך אישי ומוסך קהילתי | דוא"ל, SMS, התראות, שחזור סיסמה |
| אירועים: מפגשים ומרוצים, השתתפות, לייקים, תגובות | צ'אט קבוצתי (הצ'אט הוא אחד על אחד) |
| שוק: מודעות, סטטוס נמכר, לייקים, תגובות | פוסטים חופשיים או "קיר" |
| קבוצות, בקשות הצטרפות, קבוצות פרטיות | כלי מודרציה מעבר לדף האדמין |
| פיד אישי והצעות חברים | שירות מפות חיצוני (המפה מצוירת מנתונים שמורים) |
| חיפוש: מפה, חברים, קבוצות, וטפסי חיפוש בכל דף | פיד "Around the world" (מוצג placeholder) |
| צ'אט בזמן אמת עם היסטוריה, הקלדה, נוכחות, עריכה ומחיקה | אפליקציות מובייל (האתר עובד בדפדפן הטלפון) |
| סטטיסטיקות, דף אדמין, דף Motorsport, העלאת תמונות ווידאו, נתוני דמו | |

---

## 3. סוגי משתמשים והרשאות

| פעולה | אורח | חבר | מנהל קבוצה (בקבוצתו) | אדמין |
|---|---|---|---|---|
| דף נחיתה, התחברות, הרשמה | כן | מופנה לפיד | מופנה לפיד | מופנה לפיד |
| כל דף או נתיב `/api` אחר | לא (הפניה ל-`/login` או 401) | כן | כן | כן |
| צפייה בפרופיל ובמוסך של כל חבר | לא | כן | כן | כן |
| עריכה או מחיקה של פרופיל | לא | שלו בלבד | שלו בלבד | כל אחד |
| בקשות חברות | לא | כן | כן | כן |
| הוספה, עריכה, מחיקה של רכב | לא | שלו בלבד | שלו בלבד | כל אחד |
| יצירת אירוע | לא | כן | כן | כן |
| אירוע בשם קבוצה | לא | רק אם חבר בקבוצה | כן | כן |
| עריכה או מחיקה של אירוע | לא | המארח בלבד | המארח בלבד | כל אחד |
| השתתפות, לייק, תגובה | לא | כן | כן | כן |
| מחיקת תגובה | לא | שלו, או כל תגובה אם הוא המארח/המוכר | כמו חבר | כל אחת |
| יצירת מודעה | לא | כן | כן | כן |
| עריכה, מחיקה, סימון נמכר | לא | המוכר בלבד | המוכר בלבד | כל אחד |
| יצירת קבוצה | לא | כן (הופך למנהל) | כן | כן |
| עריכה או מחיקה של קבוצה | לא | לא | כן | כן |
| הצטרפות לקבוצה ציבורית / בקשה לפרטית | לא | כן | | כן |
| עזיבת קבוצה | לא | כן | לא (מנהל לא עוזב) | כן |
| אישור, דחייה, הסרת חברים | לא | לא | כן | כן |
| צפייה בקבוצה פרטית ובאירועיה | לא | חברים בלבד | כן | כן |
| צ'אט, קריאת שיחה | לא | רק שני המשתתפים | כמו חבר | כמו חבר (אין גישה מיוחדת) |
| עריכה או מחיקה של הודעה | לא | שלו בלבד | שלו בלבד | שלו בלבד |
| פיד, סטטיסטיקות, חיפוש, Motorsport | לא | כן | כן | כן |
| דף אדמין ושינוי תפקיד | לא | לא (403) | לא (403) | כן (לא לעצמו) |

---

## 4. דרישות פונקציונליות

כל שורה היא דרישה. "קלט" הוא מה שהמשתמש שולח, "כללים" הוא מה שהשרת בודק, "פלט" הוא מה שחוזר (כולל קוד HTTP והודעה שהבודק יראה). תנאי מוקדם לכל הדרישות מ-FR-010 והלאה: המשתמש מחובר.

### 4.1 חשבונות

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-001 | הרשמה `POST /auth/register` | username, password, displayName, location, bio | ולידציה (VAL-001..005); שם משתמש באותיות קטנות וייחודי; סיסמה מוצפנת bcrypt; תפקיד `user`; נפתח session | `201` והפניה ל-`/feed`. תפוס: `409 That username is already taken.` |
| FR-002 | התחברות `POST /auth/login` | username, password | השוואה ל-hash. הודעה זהה לשם שגוי ולסיסמה שגויה | `200` והפניה לפיד. שגוי: `401 Incorrect username or password.` |
| FR-003 | התנתקות `POST /auth/logout` | לחיצה על Log out | מחיקת ה-session והעוגייה | `200` והפניה ל-`/` |
| FR-004 | שמירת session | | נשמר ב-MongoDB, שורד הפעלה מחדש, תוקף שבוע. משתמש שנמחק: ה-session נמחק | |
| FR-005 | בקרת גישה | | כל דף ונתיב חוץ מנחיתה, login, register וקבצים סטטיים דורשים חבר מחובר | דף: הפניה ל-`/login`. Ajax: `401`. אדמין בלבד: `403` |

### 4.2 פרופיל וחברים

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-010 | דף פרופיל `GET /profile/:username` | שם משתמש | טוען רכבים, מספר אירועים ומודעות, קבוצות, מצב חברות מול הצופה | דף SCR-090. לא קיים: 404 |
| FR-011 | קריאת חברים ב-API `GET /api/users`, `/:id` | page, limit | שדות ציבוריים בלבד; סיסמה לעולם לא מוחזרת; בקשות חברות רק לעצמי | `{users,total,page,pages}` / `{user}`; `404 Member not found.` |
| FR-012 | חיפוש חברים `GET /api/users/search` | username, location, keyword, carMake | שם או שם תצוגה מכיל; מיקום מכיל; keyword בביו; carMake דרך אוסף הרכבים. AND בין פרמטרים | `{users,...}` |
| FR-013 | עריכת פרופיל `PUT /api/users/:id` | displayName, bio, location, avatar, newPassword + currentPassword | רק בעל החשבון או אדמין `403`. שינוי סיסמה דורש סיסמה נוכחית (לא לאדמין): `401 Your current password is incorrect.` | `{ok,user}` |
| FR-014 | מחיקת חשבון `DELETE /api/users/:id` | | רק בעל החשבון או אדמין. מוחק רכבים, אירועים, מודעות, קשרי חברות, חברות בקבוצות, הקבוצות שניהל ואירועיהן. מחיקה עצמית מסיימת session | `{ok, redirect:"/"}` |
| FR-015 | בקשת חברות `POST /api/users/:id/friend-request` | | לא לעצמי `400`, לא לחבר קיים `409 You are already friends.`, לא פעמיים `409 Request already sent.` | `{ok}` |
| FR-016 | אישור בקשה `POST /api/users/:id/accept` | | חייבת בקשה ממתינה `404`. החברות הדדית | `{ok}` |
| FR-017 | ביטול חברות `POST /api/users/:id/unfriend` | | הסרה הדדית | `{ok}` |
| FR-018 | הצעות חברים `GET /api/feed/suggestions` | | עד 5 חברים שאינם אני, לא חברים, ולא נשלחה להם בקשה | `{suggestions, groups}` |

### 4.3 מוסך (רכבים)

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-020 | הוספת רכב `POST /api/cars` | make, model, year, horsepower, category, color, engine, description, photo | VAL-020..027; owner = החבר; ללא תמונה נשמרת ברירת מחדל | `201 {ok,car}` |
| FR-021 | צפייה `GET /api/cars`, `?mine=true`, `?owner=`, `/:id` | | עמודים, החדש ראשון | `{cars,...}`; `404 Car not found.` |
| FR-022 | חיפוש במוסך הקהילתי `GET /api/cars/search` | make, model, category, color, yearFrom, yearTo, hpMin, hpMax | טקסט מכיל; טווחים כוללים; ערך לא מספרי מתעלמים ממנו | `{cars,...}` |
| FR-023 | עריכה `PUT /api/cars/:id` | כמו הוספה | בעלים או אדמין `403 You can only edit cars in your own garage.` | `{ok,car}` |
| FR-024 | מחיקה `DELETE /api/cars/:id` | אישור בדיאלוג | בעלים או אדמין `403` | `{ok}` |

### 4.4 אירועים (מפגשים ומרוצים)

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-030 | יצירת אירוע `POST /api/events` | title, type, city, startsAt, description, address, maxAttendees, group, coverImage; למרוץ: raceType, circuit, laps | VAL-030..039; קואורדינטות לפי העיר; אירוע בשם קבוצה רק לחבר/מנהל בה `403 Join the group before hosting an event for it.`; למפגש שדות המרוץ מתאפסים; המארח נרשם כמשתתף ראשון | `201 {ok,event}` |
| FR-031 | רשימה `GET /api/events`, `?mine`, `?attending`, `?past`, `?group`, `?type` | | ברירת מחדל: עתידיים, הקרוב ראשון. אירועי קבוצות פרטיות שאיני חבר בהן מוסתרים (BR-030); בקשה לקבוצה פרטית: `403 This group is private.` | `{events,...}` |
| FR-032 | חיפוש `GET /api/events/search` | keyword, type, raceType, city, dateFrom, dateTo, includePast | keyword בכותרת או בתיאור; ערכי enum לא חוקיים מתעלמים מהם; dateTo כולל את כל היום; ללא תאריכים רק עתידיים אלא אם includePast | `{events,...}` |
| FR-033 | חיפוש אזורי `POST /api/events/area` | polygon [[lng,lat]...], type, dateFrom, dateTo, includePast | לפחות 3 נקודות `400 Draw an area with at least three points.`; נקודה שבורה `400 Bad point`; מחוץ לטווח `400 Point is outside the world`; סגירת המצולע; `$geoWithin`; עד 100 תוצאות; כלל קבוצות פרטיות | `{events,total}` |
| FR-034 | דף אירוע `GET /events/:id` | | מארח, קבוצה, משתתפים, תגובות; למרוץ: המסלול מהספרייה, קנבס עם רכב נע, אורך הקפה, הקפות, מרחק כולל, פורמט | דף SCR-041; 404 |
| FR-035 | עריכה `PUT /api/events/:id` | כמו יצירה | מארח או אדמין `403 Only the host can edit this event.`; שינוי עיר מעדכן קואורדינטות; מעבר למפגש מאפס raceType, circuit, laps | `{ok,event}` |
| FR-036 | מחיקה `DELETE /api/events/:id` | אישור | מארח או אדמין `403` | `{ok}` |
| FR-037 | השתתפות / ביטול `POST /api/events/:id/attend` | | המארח לא יכול `400 The host is always attending.`; מלא: `409 This event is full.`; אחרת toggle | `{ok, attending, count}` |
| FR-038 | לייק `POST /api/events/:id/like` | | toggle | `{ok, likes, liked}` |
| FR-039 | תגובה ומחיקתה `POST .../comments`, `DELETE .../comments/:commentId` | text | 1..500 תווים; מחיקה למחבר, למארח או לאדמין `403 You cannot delete this comment.` | `201 {ok,comments}` / `{ok}` |

### 4.5 שוק (מודעות)

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-040 | יצירת מודעה `POST /api/listings` | title, price, category, city, description, condition, make, model, year, photos[] | VAL-040..048; קואורדינטות לפי העיר; status = available; seller = החבר | `201 {ok,listing}` |
| FR-041 | רשימה `GET /api/listings`, `?mine`, `?includeSold`, `?seller`, `/:id` | | ברירת מחדל רק זמינות, החדש ראשון | `{listings,...}`; `404 Listing not found.` |
| FR-042 | חיפוש `GET /api/listings/search` | keyword, category, condition, city, priceMin, priceMax, make, model, yearFrom, yearTo, includeSold, sort | טווחים כוללים; נמכרות מוסתרות אלא אם includeSold; sort: newest, price-asc, price-desc | `{listings,...}` |
| FR-043 | חיפוש אזורי `POST /api/listings/area` | polygon, category, priceMax | כמו FR-033; רק זמינות; עד 100 | `{listings,total}` |
| FR-044 | דף מודעה `GET /market/:id` | | תמונות, מחיר, מצב, עיר, מוכר עם "Message seller", לייק, תגובות | דף SCR-051; 404 |
| FR-045 | עריכה `PUT /api/listings/:id` | כמו יצירה | מוכר או אדמין `403`; עד 6 תמונות | `{ok,listing}` |
| FR-046 | מחיקה `DELETE /api/listings/:id` | אישור | מוכר או אדמין `403` | `{ok}` |
| FR-047 | נמכר / חזרה למכירה `POST /api/listings/:id/sold` | | מוכר או אדמין `403 Only the seller can change this.`; toggle | `{ok,status}` |
| FR-048 | לייק ותגובות על מודעה | | כמו FR-038, FR-039 עם המוכר במקום המארח | |

### 4.6 קבוצות

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-050 | יצירה `POST /api/groups` | name, description, category, brand, isPrivate, coverImage | VAL-050..053; שם ייחודי `409`; היוצר הופך למנהל ולחבר הראשון | `201 {ok,group}` |
| FR-051 | רשימה וחיפוש `GET /api/groups`, `?mine`, `/search` | name, category, brand, privacy, minMembers | name ו-brand מכילים; privacy: public/private; minMembers: לפחות כך חברים | `{groups,...}` |
| FR-052 | דף קבוצה `GET /groups/:id` | | קבוצה פרטית נראית רק לחבריה, למנהל ולאדמין; אחרים: 403 "This group is private." | דף SCR-071 |
| FR-053 | הצטרפות `POST /api/groups/:id/join` | | כבר חבר: `409`. ציבורית: מיידי. פרטית: לתור אישור, בקשה חוזרת `409` | `{ok,joined}` / `{ok,pending,message}` |
| FR-054 | עזיבה `POST /api/groups/:id/leave` | | מנהל לא יכול `400 The manager cannot leave their own group.` | `{ok}` |
| FR-055 | אישור / דחייה `POST .../approve`, `.../reject` | userId | מנהל או אדמין `403 Only the group manager can do that.`; id תקין `400`; אישור ללא בקשה: `404` | `{ok}` |
| FR-056 | הסרת חבר `POST .../remove-member` | userId | מנהל או אדמין; לא את המנהל `400 The manager cannot be removed.` | `{ok}` |
| FR-057 | עריכה ומחיקה `PUT`, `DELETE /api/groups/:id` | | מנהל או אדמין; מחיקת קבוצה מוחקת את אירועיה | `{ok}` |

### 4.7 פיד, חיפוש, מפה

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-060 | פיד אישי `GET /api/feed` | filter: all / friends / groups, page | אירועים של אני וחבריי או של הקבוצות שלי; מודעות זמינות שלי ושל חבריי; קבוצות פרטיות שאיני בהן מוסתרות; מיזוג ומיון מהחדש; לכל פריט הרכב הראשון של המפרסם; 12 לעמוד, עד 40 | `{items:[{kind,data,car}], total, page, hasMore, circle}` |
| FR-070 | דף חיפוש `GET /search` | | שלוש לשוניות: מפה (FR-033/043 עם בורר אירועים/מודעות), חברים (FR-012), קבוצות (FR-051) | דף SCR-060 |
| FR-071 | מפת קנבס (React) | לחיצות על המפה | גבול ישראל האמיתי (Natural Earth), מדינות שכנות, שני האגמים, 37 ערים; כל לחיצה מוסיפה קודקוד; Clear; Search this area; תוצאות כסמנים וברשימה; ללא אינטרנט | |

### 4.8 צ'אט

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-080 | חיבור `/chat` דרך Socket.io | | ה-socket משתמש ב-session של Express; ללא session: "You must be logged in to chat."; חדר לפי מזהה החבר; שידור נוכחות | דף SCR-080; `?to=<id>` פותח שיחה |
| FR-081 | שליחה `message:send {to,text}` | to, text | ריק: "Write something first."; מעל 1000: "Message is too long."; ללא נמען; לעצמי: "You cannot message yourself."; נמען לא קיים | `message:new` לשני הצדדים; נשמר עם read=false |
| FR-082 | היסטוריה ושיחות `history:load`, `GET /api/messages/:userId`, `/conversations` | | רק שיחות שאני צד בהן; פתיחת שיחה מסמנת כנקרא | הודעות לפי סדר; רשימת שיחות עם לא נקראו |
| FR-083 | חיפוש `GET /api/messages/search` | keyword, withUser, dateFrom, dateTo (unreadOnly ב-API בלבד) | רק השיחות שלי | `{messages,...}` |
| FR-084 | עריכה ומחיקה `PUT`, `DELETE /api/messages/:id` | text | רק השולח `403`; 1..1000 | `{ok}` |
| FR-085 | הקלדה ונוכחות | | `typing` לצד השני; נקודת online/offline לכולם | |

### 4.9 סטטיסטיקות, אדמין, העלאות, Motorsport

| מזהה | דרישה | קלט | כללים ותהליך | פלט |
|---|---|---|---|---|
| FR-090 | סטטיסטיקות `/stats`, `/api/stats/*` | Refresh | אגרגציות MongoDB בזמן הבקשה: סיכום, אירועים לחודש, 10 יצרנים מובילים, מודעות לקטגוריה עם מחיר ממוצע, אירועים לעיר, פעילות קבוצות | 5 מונים ו-5 גרפי D3 |
| FR-095 | דף אדמין `/admin`, `/api/admin/*` | username, location, role | אדמין בלבד; סקירה, חיפוש חברים כולל תפקיד, תוכן חדש | דף SCR-100 |
| FR-096 | שינוי תפקיד `POST /api/admin/members/:id/role` | role | user או admin `400`; לא לעצמו `400 You cannot remove your own administrator rights.` | `{ok,user}` |
| FR-100 | העלאת תמונה `POST /api/upload`, כמה תמונות `/many` עד 6 | קובץ | JPEG/PNG/GIF/WebP, עד 2MB; שם קובץ אקראי | `201 {ok,url}` / `{ok,urls}` |
| FR-102 | העלאת וידאו `POST /api/upload/video` | קובץ, title | MP4/WebM/Ogg, עד 25MB; נוסף ל-clips.json | `201 {ok,url,clips}` |
| FR-110 | Motorsport `/motorsport` | | הסרטון החדש ביותר בערוץ GT World שאינו Short (בדיקת הפניית `/shorts/<id>`); נשמר ב-`settings` ונבדק מחדש רק אחרי 3 ימים; ללא אינטרנט: הסרטון השמור או `RECAP_YOUTUBE_ID` | דף SCR-110 |
| FR-120 | נתוני דמו `npm run seed` | | 12 חברים (סיסמה `secret123`, `alon` אדמין), 7 קבוצות, 24 רכבים עם תמונות, 17 אירועים (6 מרוצים עם מסלול), 18 מודעות, 18 הודעות | |

---

## 5. דרישות לא פונקציונליות

| מזהה | תחום | דרישה | איך בודקים |
|---|---|---|---|
| NFR-001 | ביצועים | כל רשימה או חיפוש מחזירים עד 50 רשומות לעמוד (פיד 40, היסטוריית צ'אט 200) בלי קשר ל-limit שנשלח; חיפוש אזורי עד 100 | `?limit=9999` |
| NFR-002 | ביצועים | עם נתוני הדמו במחשב מקומי כל דף וקריאות ה-Ajax שלו מסתיימים תוך 2 שניות | Network tab |
| NFR-003 | ביצועים | הודעת צ'אט מגיעה לנמען תוך שנייה ברשת מקומית | שני דפדפנים |
| NFR-010 | אבטחה | סיסמאות נשמרות רק כ-bcrypt hash ולא מוחזרות באף נתיב | אוסף users, `/api/users/:id` |
| NFR-011 | אבטחה | הודעה זהה לשם משתמש שגוי ולסיסמה שגויה | |
| NFR-012 | אבטחה | עוגיית session היא httpOnly, תוקף 7 ימים, secure ב-https | DevTools |
| NFR-013 | אבטחה | כל בדיקת הרשאה מתבצעת בשרת; קריאה ישירה ל-API עם עוגייה של חבר א' על רשומה של חבר ב' מחזירה 403 | curl |
| NFR-014 | אבטחה | תוכן קבוצה פרטית מוסתר בכל מסלול: דף, רשימה, חיפוש, חיפוש אזורי, פיד | בדיקות אוטומטיות |
| NFR-015 | אבטחה | קבצים מועלים מקבלים שם אקראי; רק סוגי MIME מהרשימה ובגודל מוגבל | העלאת `.exe`, 3MB |
| NFR-016 | אבטחה | כל טקסט משתמש עובר escape לפני הצגה: jQuery `UI.escape`, EJS `<%= %>`; טקסט חיפוש עובר escape ל-regex | תגובה עם `<script>`, חיפוש `(` |
| NFR-020 | אמינות | השרת לא קורס על קלט שגוי: מזהה שבור, נתיב לא קיים, הפרת סכמה, כפילות, קובץ גדול, כולם מחזירים 4xx | חבילת הבדיקות |
| NFR-021 | אמינות | חבילת הבדיקות `npm test`, 102 בדיקות API וצ'אט, עוברת מול שרת רץ | `npm test` |
| NFR-030 | שימושיות | כל פעולה (יצירה, עריכה, מחיקה, לייק, השתתפות, הצטרפות, חיפוש) ב-Ajax ומעדכנת את הדף במקום, ללא טעינה מחדש | |
| NFR-031 | שימושיות | כל טופס מאומת בדפדפן לפני שליחה ומציג הודעה בתיבת השגיאה של הטופס; השרת חוזר על הבדיקה | |
| NFR-032 | שימושיות | פעולות מחיקה מבקשות אישור; העיצוב מותאם למסכים צרים (breakpoints 900, 760, 700 px); מצבים ריקים מסבירים מה לעשות | |
| NFR-040 | תאימות | Chrome, Edge, Firefox עדכניים; Node.js 18+; MongoDB 6+ מקומי או Atlas; ללא שלב build | |
| NFR-041 | תאימות | עובד ללא אינטרנט חוץ מהטמעת YouTube ובדיקת ערוץ GT World; כל הספריות מוגשות מ-`/public/vendor` | ניתוק רשת |
| NFR-050 | תחזוקה | MVC קפדני; כללי ולידציה ליד הנתיב שהם מגנים עליו; הערות בשפה פשוטה בכל קובץ; SRS מתעדכן באותו commit | |

---

## 6. מסכים

לכל הדפים סרגל ניווט משותף (Feed, Meets & races, Market, Motorsport, Search, Groups, Garage, Chat, Stats, Admin לאדמין בלבד, אווטאר ושם, Log out). ערכת צבעים כהה עם אדום.

| מזהה | נתיב | מסך | תוכן עיקרי |
|---|---|---|---|
| SCR-001 | `/` | נחיתה | הסבר, Join Maslul, Sign in. מחובר מופנה לפיד |
| SCR-002/003 | `/register`, `/login` | הרשמה / התחברות | טופס עם תיבת שגיאה |
| SCR-010 | `/feed` | פיד | לשוניות Everything / Friends / My groups; כרטיסים עם אווטאר, שם, עיר, "drives a ..."; Load more; הקבוצות שלי; People you might know |
| SCR-040 | `/events` | מפגשים ומרוצים | לשוניות Upcoming / Going / Mine / Past; טופס יצירה (למרוץ: פורמט, מסלול, הקפות עם מרחק כולל חי); טופס חיפוש; כרטיסים עם Attend, Edit/Delete למארח |
| SCR-041 | `/events/:id` | דף אירוע | פרטים, משתתפים, Attend, Like, תגובות; למרוץ קנבס המסלול ושורת נתונים |
| SCR-050 | `/market` | שוק | טופס חיפוש; לשוניות Everything / My listings; טופס מכירה עד 6 תמונות; כרטיסים עם תמונה, מחיר, Sold |
| SCR-051 | `/market/:id` | דף מודעה | תמונות, מחיר, מוכר עם Message seller, Like, תגובות; למוכר Edit, Mark sold, Delete |
| SCR-060 | `/search` | חיפוש | לשוניות: מפה (ציור אזור), חברים, קבוצות |
| SCR-070 | `/groups` | קבוצות | חיפוש; לשוניות All / Mine; יצירה עם מתג פרטית; Join / Leave / Pending |
| SCR-071 | `/groups/:id` | דף קבוצה | תיאור, חברים, אירועי הקבוצה; למנהל: בקשות ממתינות, הסרת חבר, Edit, Delete |
| SCR-080 | `/chat` | צ'אט | רשימת שיחות עם לא נקראו ונוכחות; בחירת חבר; שיחה עם מחוון הקלדה; עריכה/מחיקה; חיפוש הודעות |
| SCR-090 | `/profile/:username` | פרופיל | פרטים, מונים, קבוצות, Add friend / Unfriend, הרכבים; לעצמי: עריכה, שינוי סיסמה, מחיקת חשבון |
| SCR-091 | `/garage` | מוסך | לשוניות My garage / Community garage; טופס הוספה עם תמונה; חיפוש קהילתי |
| SCR-095 | `/stats` | סטטיסטיקות | 5 מונים, 5 גרפי D3, Refresh |
| SCR-100 | `/admin` | אדמין | סקירה, חיפוש חברים עם תפקיד, תוכן חדש |
| SCR-110 | `/motorsport` | Motorsport | הסרטון החדש מ-GT World עם כותרת; Around the world: Coming soon |
| SCR-120 | | דף שגיאה | כותרת והודעה ל-400, 403, 404, 500 |

---

## 7. חוקים עסקיים

| מזהה | חוק |
|---|---|
| BR-001 | שם משתמש ייחודי ולא תלוי רישיות. חשבון חדש הוא תמיד חבר רגיל; רק אדמין נותן אדמין, ולא יכול להסיר את עצמו |
| BR-002 | חבר עורך ומוחק רק את שלו (פרופיל, רכבים, אירועים, מודעות, הודעות). אדמין כל דבר חוץ מהודעות צ'אט של אחרים |
| BR-003 | מחיקת חשבון מוחקת את כל מה שהחבר יצר חוץ מהודעות צ'אט, ואת הקבוצות שניהל עם אירועיהן |
| BR-010 | אין חברות עם עצמי; אין בקשה כפולה; חברות תמיד הדדית |
| BR-020 | כל אירוע ומודעה קשורים לעיר מהרשימה; הקואורדינטות הן של העיר |
| BR-021 | המארח תמיד משתתף ולא יכול לבטל; אירוע עם מגבלה מסרב כשהוא מלא (0 = ללא הגבלה) |
| BR-022 | רק למרוץ יש פורמט, מסלול והקפות; מעבר למפגש מאפס אותם. מסלול רק מהספרייה, והטופס מציע רק מסלולים שמתאימים לפורמט. מרחק כולל = אורך × הקפות |
| BR-023 | אירוע בשם קבוצה דורש חברות בה. ברירת המחדל ברשימות היא אירועים עתידיים בלבד |
| BR-030 | תוכן קבוצה פרטית נראה רק לחבריה, למנהל ולאדמין, בכל רשימה, חיפוש ופיד |
| BR-031 | הצטרפות לציבורית מיידית; לפרטית דרוש אישור מנהל. המנהל לא עוזב ולא מוסר. שם קבוצה ייחודי. מחיקת קבוצה מוחקת את אירועיה |
| BR-040 | מודעה שנמכרה מוסתרת מהשוק ומהחיפוש האזורי, אך נראית למוכר וב-includeSold. עד 6 תמונות |
| BR-050 | צ'אט אחד על אחד בלבד; לא לעצמי; רק שני המשתתפים קוראים. פתיחת שיחה מסמנת כנקרא |
| BR-060 | הפיד מציג רק את המעגל שלי: אני, חבריי והקבוצות שלי. הצעות חברים לא כוללות אותי, חברים, או מי שכבר ביקשתי |
| BR-070 | סרטון Motorsport הוא ההעלאה החדשה ביותר שאינה Short בערוץ GT World, נבדק לכל היותר כל 3 ימים |
| BR-080 | קבצים מועלים נשמרים בשם אקראי; שם הקובץ המקורי נזרק |

---

## 8. ולידציות

הולידציה רצה פעמיים: בדפדפן (jQuery, ההודעה בתיבת השגיאה של הטופס, הבקשה לא נשלחת) ובשרת (express-validator בנתיב, ואז סכמת Mongoose). עקיפת הדפדפן מחזירה `400` עם אותה הודעה. ההודעות מדויקות.

| מזהה | שדה | חוק | הודעה |
|---|---|---|---|
| VAL-001 | username | חובה, 3..20, אותיות ספרות וקו תחתון | Username must be 3-20 characters / Username may only contain letters, numbers and underscore |
| VAL-003 | password | 6..100 | Password must be at least 6 characters |
| VAL-004 | displayName / location / bio | עד 40 / 60 / 300 | ... is too long |
| VAL-007 | newPassword, currentPassword | לפחות 6; נוכחית חייבת להתאים (לא לאדמין) | New password must be at least 6 characters / Your current password is incorrect. (401) |
| VAL-020 | make, model (רכב) | חובה, עד 40 | Make is required / Model is required / ... is too long |
| VAL-022 | year (רכב, מודעה) | שלם 1900 עד השנה הבאה | Year must be a real year |
| VAL-023 | horsepower | 0..2000 | Horsepower must be between 0 and 2000 |
| VAL-024 | category (רכב) | Sedan, Hatchback, SUV, Coupe, Convertible, Pickup, Van, Other | Unknown body type |
| VAL-025 | color / engine / description (רכב) | עד 30 / 40 / 500 | ... is too long |
| VAL-030 | title (אירוע, מודעה) | חובה, 3..80 | Title is required / Title must be 3-80 characters |
| VAL-031 | description (אירוע, מודעה) | עד 1000 | Description is too long |
| VAL-032 | type | meet או race | Choose meet or race |
| VAL-033 | raceType | Drag, Track, Rally, Hillclimb, Drift, Time attack | Unknown race type |
| VAL-034 | city (אירוע, מודעה) | אחת מ-37 הערים ברשימה | Pick a city from the list |
| VAL-035 | address | עד 120 | Address is too long |
| VAL-036 | startsAt | תאריך ISO 8601 תקין | Pick a valid date and time |
| VAL-037 | maxAttendees | שלם 0..10000 | Attendee limit must be a sensible number |
| VAL-038 | circuit | מזהה מספריית המסלולים | Pick a circuit from the list |
| VAL-039 | laps | שלם 1..500 | Laps must be between 1 and 500 |
| VAL-042 | price | 0..10,000,000 | Price must be a real amount |
| VAL-043 | category (מודעה) | Whole car, Engine & drivetrain, Wheels & tires, Body & exterior, Interior, Audio & electronics, Tools, Other parts | Pick a category |
| VAL-044 | condition | New, Like new, Used, For parts | Unknown condition |
| VAL-048 | photos | עד 6 | (העודפות נזרקות) |
| VAL-050 | name (קבוצה) | חובה, 2..50, ייחודי | Group name must be 2-50 characters / That name is already taken. (409) |
| VAL-052 | category (קבוצה) | Brand, Off-road, Classic, EV, Racing, Tuning, JDM, General | Unknown category |
| VAL-053 | description / brand (קבוצה) | עד 500 / 40 | ... is too long |
| VAL-054 | userId | מזהה MongoDB תקין | Invalid member id |
| VAL-090 | תגובה | חובה, עד 500 | Comment cannot be empty / Comment is too long |
| VAL-091 | הודעת צ'אט | חובה, עד 1000 | Message cannot be empty / Message is too long |
| VAL-093 | role | user או admin | Role must be "user" or "admin" |
| VAL-094 | כל `:id` בכתובת | 24 תווי hex | Invalid id. |
| VAL-095 | תמונה | JPEG/PNG/GIF/WebP, עד 2MB, עד 6 קבצים | Only JPG, PNG, GIF and WebP images are allowed. / The uploaded file is too large (max 2MB). |
| VAL-096 | וידאו | MP4/WebM/Ogg, עד 25MB | Only MP4, WebM and Ogg video files are allowed. |
| VAL-097 | polygon | לפחות 3 זוגות [lng,lat] מספריים בטווח | Draw an area with at least three points. / Bad point / Point is outside the world |
| VAL-098 | page, limit; מסנני חיפוש | limit נחתך ל-1..50; ערכי enum לא חוקיים, טווחים לא מספריים וערים לא מוכרות מתעלמים מהם | (ללא שגיאה) |

---

## 9. טיפול בשגיאות

| מזהה | מצב | תשובת Ajax / `/api` | תשובת דף |
|---|---|---|---|
| ERR-001 | כלל ולידציה נכשל | `400 {error: הודעה ראשונה, errors:[{field,message}]}` | דף 400 עם ההודעות |
| ERR-002 | מזהה שבור בכתובת / ערך שלא ניתן להמרה | `400 Invalid id.` / `400 Invalid value provided.` | |
| ERR-003 | לא מחובר | `401 You must be logged in to do that.` | הפניה ל-`/login` |
| ERR-004 | פרטי התחברות שגויים | `401 Incorrect username or password.` | |
| ERR-005 | אין הרשאה (לא בעלים, לא מנהל, קבוצה פרטית, לא אדמין) | `403` עם הודעה ספציפית | דף 403 |
| ERR-006 | רשומה או נתיב לא קיימים | `404 ... not found.` | דף 404 |
| ERR-007 | כפילות (שם משתמש, שם קבוצה) / התנגשות מצב (כבר חברים, אירוע מלא, בקשה ממתינה) | `409` עם הודעה | |
| ERR-008 | קובץ גדול מדי | `400 The uploaded file is too large (max 2MB).` | |
| ERR-009 | כל שגיאה לא צפויה | `500 Something went wrong. Please try again.` (פרטים רק בלוג השרת) | דף 500 |
| ERR-010 | socket ללא session / פעולת socket נכשלה | חיבור נדחה עם `connect_error` / ה-ack מכיל `{error}` ושום דבר לא משודר | |
| ERR-011 | בסיס הנתונים לא זמין בהפעלה | התהליך רושם שגיאה ויוצא במקום להגיש דפים בלי נתונים | |
| ERR-012 | YouTube לא זמין | נרשם בלוג, מוצג הסרטון השמור או ה-fallback, הדף נטען | |

בדפדפן: `API.errorMessage` קורא את `error` מה-JSON (בלי שרת: "Cannot reach the server. Check your connection."). שגיאת טופס מוצגת בתיבת השגיאה של הטופס; שגיאת כפתור (401, 403, 404, 409, 500) מוצגת ב-toast והדף נשאר. השרת לעולם לא קורס: כל controller עטוף ב-try/catch ומעביר ל-`src/middleware/error.js`.

---

## 10. הנחות ומגבלות

| מזהה | הנחה / מגבלה |
|---|---|
| A-001 | דפדפן מודרני עם JavaScript. בלעדיו עובדים רק דפי הנחיתה, ההתחברות וההרשמה |
| A-002 | אין אימות דוא"ל, CAPTCHA או הגבלת ניסיונות התחברות. אין שחזור סיסמה; אדמין יכול לקבוע סיסמה חדשה דרך עריכת הפרופיל |
| A-003 | מיקום ברמת עיר בלבד; הכתובת היא טקסט חופשי. רשימת הערים (37) וספריית המסלולים (8) קבועות בקוד; תרשימי המסלולים סכמטיים |
| A-004 | קבצים מועלים נשמרים בדיסק השרת. באירוח החינמי (Render) הדיסק נמחק בכל deploy, ולכן העלאות של חברים שם לא נשמרות; תמונות הדמו הן חלק מהמאגר ונשמרות. השרת המאורח נרדם אחרי 15 דקות ומתעורר תוך כדקה |
| A-005 | אינטרנט נדרש רק להטמעת YouTube ולבדיקת ערוץ GT World. מזהה הערוץ קבוע בקוד |
| A-006 | הזמן נשמר ב-UTC ומוצג בזמן המקומי של הדפדפן. שפת הממשק אנגלית; תוכן חברים בכל שפה |
| A-007 | צ'אט ללא קבוצות, קבצים או התראות; הודעות חדשות נראות רק כשדף הצ'אט פתוח, ובמונה לא נקראו אחר כך |
| A-008 | הרצת הבדיקות האוטומטיות יוצרת כמה חשבונות זמניים; `npm run seed` מנקה אותם |
| A-009 | מדור "Around the world" הוא placeholder מכוון; אלגוריתם הבחירה הוא עבודה עתידית |

---

## נספח: מיפוי לקוד

| תחום | קבצים |
|---|---|
| חשבונות, session | `src/routes/auth.js`, `src/controllers/authController.js`, `src/middleware/auth.js`, `server.js`, `src/models/User.js` |
| פרופיל, חברים | `src/routes/users.js`, `src/controllers/userController.js`, `views/pages/profile.ejs`, `public/js/profile.js` |
| רכבים | `src/routes/cars.js`, `src/controllers/carController.js`, `src/models/Car.js`, `views/pages/garage.ejs`, `public/js/garage.js` |
| אירועים, מסלולים | `src/routes/events.js`, `src/controllers/eventController.js`, `src/models/Event.js`, `src/data/circuits.js`, `src/data/cities.js`, `views/pages/events.ejs`, `views/pages/event.ejs`, `public/js/events.js`, `public/js/event-detail.js` |
| מודעות | `src/routes/listings.js`, `src/controllers/listingController.js`, `src/models/Listing.js`, `views/pages/market.ejs`, `views/pages/listing.ejs`, `public/js/market.js`, `public/js/listing-detail.js` |
| קבוצות | `src/routes/groups.js`, `src/controllers/groupController.js`, `src/models/Group.js`, `views/pages/groups.ejs`, `views/pages/group.ejs`, `public/js/groups.js`, `public/js/group-detail.js` |
| פיד | `src/routes/feed.js`, `src/controllers/feedController.js`, `views/pages/feed.ejs`, `public/js/feed.js` |
| חיפוש, מפה | `src/routes/index.js`, `views/pages/search.ejs`, `public/js/search.js`, `public/components/CanvasMap.jsx`, `public/components/mapData.js` |
| צ'אט | `src/socket/chat.js`, `src/routes/messages.js`, `src/controllers/messageController.js`, `src/models/Message.js`, `views/pages/chat.ejs`, `public/js/chat.js` |
| סטטיסטיקות, אדמין | `src/routes/stats.js`, `src/controllers/statsController.js`, `public/js/stats.js`, `src/routes/admin.js`, `src/controllers/adminController.js`, `public/js/admin.js` |
| העלאות, Motorsport | `src/routes/uploads.js`, `src/middleware/upload.js`, `src/utils/recap.js`, `src/models/Setting.js`, `views/pages/motorsport.ejs`, `public/components/VideoShowcase.jsx` |
| ולידציה, שגיאות, בדיקות, דמו | `src/middleware/validate.js`, `src/middleware/error.js`, `src/utils/query.js`, `tests/*.js`, `seed/seed.js` |

## יומן שינויים

| גרסה | תאריך | שינוי |
|---|---|---|
| 1.0 | 17.9.2026 | גרסה ראשונה באנגלית, מתוך commit `f01dd61` |
| 1.1 | 17.9.2026 | תורגם לעברית וקוצר משמעותית. אותו תוכן, בטבלאות |
