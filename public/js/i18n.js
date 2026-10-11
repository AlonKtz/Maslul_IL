/*
  Hebrew / English.

  The site is written in English. When the language cookie says Hebrew, this
  script translates the page in the browser: every piece of interface text
  that exactly matches an entry in the dictionary below is swapped for its
  Hebrew version, and a MutationObserver does the same for everything the
  page scripts add later over ajax (cards, toasts, charts, chat).

  Only interface text is in the dictionary. Things people type in, like
  event titles, descriptions and names, never match it so they stay as they
  were written, and car makes and models and the Maslul name are left out on
  purpose so they are never translated.

  The server reads the same cookie to put lang="he" dir="rtl" on the page, so
  the layout is right to left from the first paint.
*/
(function () {
  'use strict';

  // not a const: the switch in the top bar changes it without a reload
  var LANG = document.documentElement.lang === 'he' ? 'he' : 'en';

  // ---------------------------------------------------------------- dictionary
  var HE = {
    // ---- navigation and layout
    'Feed': 'פיד',
    'Meets & races': 'מפגשים ומרוצים',
    'Market': 'שוק',
    'Motorsport': 'מוטורספורט',
    'Search': 'חיפוש',
    'Groups': 'קבוצות',
    'Garage': 'מוסך',
    'Chat': 'צ׳אט',
    'Stats': 'נתונים',
    'Admin': 'ניהול',
    'Log out': 'התנתקות',
    'Sign in': 'התחברות',
    'Join Maslul': 'הצטרפות ל-Maslul',
    'Demo User': 'משתמש דמו',
    'Dark mode': 'מצב כהה',
    'Menu': 'תפריט',
    'Close menu': 'סגירת התפריט',
    'Light mode': 'מצב בהיר',
    'Opening the demo...': 'פותח את הדמו...',
    'Maslul — Israel\'s first social network for car lovers.': 'Maslul — הרשת החברתית הראשונה בישראל לחובבי רכב.',
    'Home': 'דף הבית',
    'Loading…': 'טוען…',
    'Loading...': 'טוען...',
    'Searching…': 'מחפש…',
    'Saving…': 'שומר…',
    'Posting…': 'מפרסם…',
    'Creating…': 'יוצר…',
    'Creating...': 'יוצר...',
    'Signing in...': 'מתחבר...',

    // ---- landing
    'Israel\'s first social network for car lovers.': 'הרשת החברתית הראשונה בישראל לחובבי רכב.',
    'Park your dream car in a virtual garage, join the meets and races, find parts for your build, and talk cars in real time.':
      'החנו את רכב החלומות במוסך וירטואלי, הצטרפו למפגשים ולמרוצים, מצאו חלקים לפרויקט ודברו על רכבים בזמן אמת.',
    'From the community garages': 'מהמוסכים של הקהילה',
    'Everything from a 1971 Beetle to a Ferrari 296 GTB, parked side by side.': 'הכול, מחיפושית 1971 ועד Ferrari 296 GTB, חונים זה לצד זה.',
    'Night cruises, canyon drives, drift days and rally stages, all hosted by members.': 'נסיעות לילה, נסיעות בכבישים מתפתלים, ימי דריפט ושלבי ראלי, הכול בהפקת החברים.',
    'What you can do here': 'מה אפשר לעשות כאן',
    'Your garage.': 'המוסך שלך.',
    'Add every car you own or dream about — make, model, year, engine and horsepower — and let other members search the garages of the whole community.':
      'הוסיפו כל רכב שיש לכם או שאתם חולמים עליו — יצרן, דגם, שנה, מנוע וכוחות סוס — ותנו לחברים אחרים לחפש במוסכים של כל הקהילה.',
    'Communities.': 'קהילות.',
    'Join groups for your brand, for off-road trails, for classics or for EVs. Group managers approve members and keep the conversation on track.':
      'הצטרפו לקבוצות של היצרן שלכם, לשטח, לקלאסיקות או לרכבים חשמליים. מנהלי הקבוצות מאשרים חברים ושומרים על השיחה במסלול.',
    'Your feed.': 'הפיד שלך.',
    'Posts from the groups you belong to and the friends you follow, all in one place, with likes and comments.':
      'עדכונים מהקבוצות שלך ומהחברים שלך, הכול במקום אחד, עם לייקים ותגובות.',
    'Live chat.': 'צ׳אט חי.',
    'Message other members in real time and plan the next meetup or trip.': 'שלחו הודעות לחברים בזמן אמת ותכננו את המפגש או הטיול הבא.',
    'Car meet': 'מפגש רכבים',

    // ---- login and register
    'Welcome back': 'ברוכים השבים',
    'Sign in to get back on the road.': 'התחברו כדי לחזור לכביש.',
    'Username': 'שם משתמש',
    'Password': 'סיסמה',
    'No account yet?': 'עדיין אין חשבון?',
    'Just looking? Sign in as a demo member, no account needed.': 'רק מסתכלים? היכנסו כמשתמש דמו, בלי צורך בחשבון.',
    'Please fill in both fields.': 'יש למלא את שני השדות.',
    'Create account': 'יצירת חשבון',
    'Already a member?': 'כבר רשומים?',
    'Display name': 'שם תצוגה',
    'Short bio': 'כמה מילים עליך',
    'Location': 'מיקום',
    'What do you drive?': 'במה את/ה נוהג/ת?',
    '3-20 characters: letters, numbers and underscore.': '3-20 תווים: אותיות, ספרות וקו תחתון.',
    'Username must be 3-20 characters.': 'שם המשתמש חייב להכיל 3-20 תווים.',
    'Username must be 3-20 characters': 'שם המשתמש חייב להכיל 3-20 תווים',
    'Username may only contain letters, numbers and underscore.': 'שם המשתמש יכול להכיל רק אותיות, ספרות וקו תחתון.',
    'Username may only contain letters, numbers and underscore': 'שם המשתמש יכול להכיל רק אותיות, ספרות וקו תחתון',
    'Password must be at least 6 characters.': 'הסיסמה חייבת להכיל לפחות 6 תווים.',
    'Password must be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
    'Incorrect username or password.': 'שם משתמש או סיסמה שגויים.',
    'That username is already taken.': 'שם המשתמש כבר תפוס.',
    'Username is required': 'יש להזין שם משתמש',
    'Password is required': 'יש להזין סיסמה',

    // ---- feed
    'Your feed': 'הפיד שלך',
    'What your friends are doing and what is happening in your groups.': 'מה החברים שלך עושים ומה קורה בקבוצות שלך.',
    'Everything': 'הכול',
    'Friends': 'חברים',
    'My groups': 'הקבוצות שלי',
    'Load more': 'טעינת עוד',
    'Your groups': 'הקבוצות שלך',
    'People you might know': 'אנשים שאולי מכירים',
    'You have not joined a group yet.': 'עדיין לא הצטרפת לקבוצה.',
    'Nobody new to suggest.': 'אין הצעות חדשות.',
    'added to their garage': 'הוסיף/ה רכב למוסך',
    'is hosting': 'מארח/ת',
    'Open': 'פתיחה',
    'Your feed is empty because you have not added any': 'הפיד שלך ריק כי עדיין לא הוספת',
    'friends or joined any groups yet.': 'חברים ולא הצטרפת לקבוצות.',
    'Find people': 'מצאו אנשים',
    'browse groups': 'עיינו בקבוצות',
    'to get started.': 'כדי להתחיל.',
    'Nothing here yet. When your friends host an event or': 'עדיין אין כאן כלום. כשהחברים שלך יארחו אירוע או',
    'add a car to their garage, it shows up here.': 'יוסיפו רכב למוסך, זה יופיע כאן.',

    // ---- events
    'Find a gathering near you, or host your own.': 'מצאו מפגש לידכם, או ארחו מפגש משלכם.',
    'Host an event': 'אירוח אירוע',
    'Host a meet or a race': 'ארחו מפגש או מרוץ',
    'Title': 'כותרת',
    'Type': 'סוג',
    'Race format': 'סוג מרוץ',
    'Choose…': 'בחירה…',
    'Circuit': 'מסלול',
    'Choose a track…': 'בחירת מסלול…',
    'Laps': 'הקפות',
    'Runs': 'סבבים',
    'City': 'עיר',
    'Choose a city…': 'בחירת עיר…',
    'Meeting point': 'נקודת מפגש',
    '(optional)': '(לא חובה)',
    'Date & time': 'תאריך ושעה',
    'Attendee limit': 'מגבלת משתתפים',
    '(0 = no limit)': '(0 = ללא הגבלה)',
    'Cover photo': 'תמונת שער',
    'Description': 'תיאור',
    'What is happening, what to bring, who it is for…': 'מה קורה, מה להביא, למי זה מתאים…',
    'Publish event': 'פרסום אירוע',
    'Cancel': 'ביטול',
    'Filter events': 'סינון אירועים',
    'Keyword': 'מילת חיפוש',
    'title or description': 'כותרת או תיאור',
    'Any': 'הכול',
    'Meets': 'מפגשים',
    'Races': 'מרוצים',
    'Anywhere': 'בכל מקום',
    'From': 'מתאריך',
    'To': 'עד תאריך',
    'Clear': 'ניקוי',
    'include past events': 'כולל אירועים שעברו',
    'All upcoming': 'כל הקרובים',
    'Hosting': 'בהפקתי',
    'Going': 'מגיע/ה',
    'Going / not going': 'מגיע/ה / לא מגיע/ה',
    'Meet': 'מפגש',
    'Race': 'מרוץ',
    'MEET': 'מפגש',
    'RACE': 'מרוץ',
    'Drag': 'דראג',
    'Track': 'מסלול',
    'Rally': 'ראלי',
    'Hillclimb': 'טיפוס הרים',
    'Drift': 'דריפט',
    'Time attack': 'טיים אטאק',
    'Port parking lot, gate 3': 'חניון הנמל, שער 3',
    'No upcoming events yet. Be the first to host one.': 'אין עדיין אירועים קרובים. היו הראשונים לארח.',
    'You are not hosting anything yet.': 'עדיין לא אירחת אירוע.',
    'You have not marked yourself as going to anything.': 'עדיין לא סימנת הגעה לאף אירוע.',
    'Event published': 'האירוע פורסם',
    'Event updated': 'האירוע עודכן',
    'Event deleted': 'האירוע נמחק',
    'You are going': 'נרשמת כמגיע/ה',
    'You are no longer going': 'ההגעה בוטלה',
    'I am going': 'אני מגיע/ה',
    'Cancel attendance': 'ביטול הגעה',
    'You are hosting this event.': 'את/ה מארח/ת את האירוע הזה.',
    'Hosted by:': 'מארח/ת:',
    'When:': 'מתי:',
    'Delete event': 'מחיקת אירוע',
    'Delete this event? This cannot be undone.': 'למחוק את האירוע? אי אפשר לבטל.',
    'Comments': 'תגובות',
    'No comments yet.': 'אין תגובות עדיין.',
    'Add a comment': 'הוספת תגובה',
    'Ask a question or say you are coming…': 'שאלו שאלה או ספרו שאתם מגיעים…',
    'Post comment': 'פרסום תגובה',
    'Comment posted': 'התגובה פורסמה',
    'Comment removed': 'התגובה הוסרה',
    'Comments are limited to 500 characters.': 'תגובות מוגבלות ל-500 תווים.',
    'Write something first.': 'קודם כתבו משהו.',
    'Could not load that event': 'לא ניתן לטעון את האירוע',
    'Give the event a title of at least 3 characters.': 'תנו לאירוע כותרת של 3 תווים לפחות.',
    'Choose the race format.': 'בחרו את סוג המרוץ.',
    'Choose the circuit the race is on.': 'בחרו את המסלול של המרוץ.',
    'How many laps or runs?': 'כמה הקפות או סבבים?',
    'Choose the city where it happens.': 'בחרו את העיר שבה זה קורה.',
    'Choose the date and time.': 'בחרו תאריך ושעה.',
    'START': 'זינוק',
    'FINISH': 'סיום',
    'total distance': 'מרחק כולל',
    'Back to home': 'חזרה לדף הבית',

    // ---- market
    'Marketplace': 'שוק',
    'Buy and sell cars, parts and gear, close to home.': 'קנו ומכרו רכבים, חלקים וציוד, קרוב לבית.',
    'Sell something': 'מכירת פריט',
    'List an item': 'פרסום פריט',
    'Category': 'קטגוריה',
    'Choose a category.': 'בחרו קטגוריה.',
    'Condition': 'מצב',
    'Price (₪)': 'מחיר (₪)',
    'Photos': 'תמונות',
    '(up to 6)': '(עד 6)',
    'Condition, history, what is included…': 'מצב, היסטוריה, מה כלול…',
    'Selling a whole car? Fill these in too.': 'מוכרים רכב שלם? מלאו גם את אלה.',
    'Make': 'יצרן',
    'Model': 'דגם',
    'Year': 'שנה',
    'Publish listing': 'פרסום מודעה',
    'Filter the market': 'סינון השוק',
    'Min price': 'מחיר מינימלי',
    'Max price': 'מחיר מקסימלי',
    'Sort by': 'מיון לפי',
    'Newest': 'החדשים ביותר',
    'Price: low to high': 'מחיר: מהנמוך לגבוה',
    'Price: high to low': 'מחיר: מהגבוה לנמוך',
    'Everything for sale': 'כל מה שלמכירה',
    'My listings': 'המודעות שלי',
    'View': 'צפייה',
    'Sold': 'נמכר',
    'Mark sold': 'סימון כנמכר',
    'Mark as sold': 'סימון כנמכר',
    'Marked as sold': 'סומן כנמכר',
    'Put back on sale': 'החזרה למכירה',
    'Back on sale': 'חזר למכירה',
    'Nothing is for sale yet.': 'עדיין אין פריטים למכירה.',
    'Nothing listed for sale yet.': 'עדיין אין פריטים למכירה.',
    'You have not listed anything yet.': 'עדיין לא פרסמת מודעות.',
    'Nothing matched those filters.': 'שום דבר לא התאים לסינון.',
    'Listing published': 'המודעה פורסמה',
    'Listing updated': 'המודעה עודכנה',
    'Listing deleted': 'המודעה נמחקה',
    'Delete this listing?': 'למחוק את המודעה?',
    'Delete this listing? This cannot be undone.': 'למחוק את המודעה? אי אפשר לבטל.',
    'Could not load that listing': 'לא ניתן לטעון את המודעה',
    'Give the item a title of at least 3 characters.': 'תנו לפריט כותרת של 3 תווים לפחות.',
    'Enter a price of zero or more.': 'הזינו מחיר של אפס או יותר.',
    'Choose the city the item is in.': 'בחרו את העיר שבה נמצא הפריט.',
    'Seller': 'מוכר/ת',
    'Message the seller': 'הודעה למוכר/ת',
    'Questions': 'שאלות',
    'No questions yet.': 'אין שאלות עדיין.',
    'Ask the seller something': 'שאלו את המוכר/ת',
    'Is it still available? Would you post it?': 'זה עדיין זמין? אפשר לשלוח בדואר?',
    'Post question': 'פרסום שאלה',
    'Question posted': 'השאלה פורסמה',
    'Write your question first.': 'קודם כתבו את השאלה.',
    'Listed': 'פורסם',
    'Item is in': 'הפריט נמצא ב',
    'Category:': 'קטגוריה:',
    'Condition:': 'מצב:',
    'Status:': 'סטטוס:',
    'Year:': 'שנה:',
    'Save (': 'שמירה (',
    'Like (': 'לייק (',
    'Whole car': 'רכב שלם',
    'Engine & drivetrain': 'מנוע והנעה',
    'Wheels & tires': 'גלגלים וצמיגים',
    'Body & exterior': 'פחות וחוץ',
    'Interior': 'פנים',
    'Audio & electronics': 'שמע ואלקטרוניקה',
    'Tools': 'כלים',
    'Other parts': 'חלקים אחרים',
    'New': 'חדש',
    'Like new': 'כמו חדש',
    'Used': 'משומש',
    'For parts': 'לחלקים',
    'available': 'זמין',
    'sold': 'נמכר',

    // ---- motorsport
    'Motorsport worldwide': 'מוטורספורט מסביב לעולם',
    'Racing from everywhere. Recaps, results and what is coming up.': 'מרוצים מכל מקום. סיכומים, תוצאות ומה מחכה בהמשך.',
    'Race recaps': 'סיכומי מרוצים',
    'The newest full video from GT World, Formula 1 and NASCAR. The site checks each channel for a newer one every three days.':
      'הסרטון המלא האחרון מ-GT World, מ-Formula 1 ומ-NASCAR. האתר בודק כל ערוץ לסרטון חדש כל שלושה ימים.',
    'Latest race videos': 'סרטוני המרוצים האחרונים',
    'More videos': 'עוד סרטונים',
    'Watch on YouTube': 'צפייה ב-YouTube',
    'The embed needs an internet connection. The player in the other tab plays from your own machine.':
      'הנגן המוטמע צריך חיבור לאינטרנט.',
    'Around the world': 'מסביב לעולם',
    'A feed of motorsport news, results and highlights from championships worldwide.': 'חדשות, תוצאות ורגעי שיא מאליפויות מוטורספורט בכל העולם.',
    'Partner wanted': 'מחפשים שותף',
    'Looking for a motorsport news website to publish here': 'מחפשים אתר חדשות מוטורספורט שיפרסם כאן',
    'Run a motorsport news site? This section is yours: race news, results and highlights, shown to Israel\'s most active community of car lovers, with full credit and links back to your site.':
      'מנהלים אתר חדשות מוטורספורט? המדור הזה שלכם: חדשות מרוצים, תוצאות ורגעי שיא, מול הקהילה הפעילה ביותר של חובבי הרכב בישראל, עם קרדיט מלא וקישורים לאתר שלכם.',
    'Contact us:': 'צרו קשר:',
    'Get in touch': 'צרו קשר',
    'Play': 'ניגון',
    'Pause': 'השהיה',
    'Volume': 'עוצמה',
    'Seek': 'דילוג',

    // ---- search
    'Find meets and races near you, or track down members and groups.': 'מצאו מפגשים ומרוצים לידכם, או חפשו חברים וקבוצות.',
    'Area of interest': 'אזור עניין',
    'Members': 'חברים',
    'Draw where you are willing to travel': 'סמנו לאן אתם מוכנים לנסוע',
    'Outline an area on the map and Maslul finds everything happening inside it. The search runs against the real coordinates stored for each event.':
      'סמנו אזור על המפה ו-Maslul ימצא את כל מה שקורה בתוכו. החיפוש רץ על הקואורדינטות האמיתיות של כל אירוע.',
    'Looking for': 'מחפשים',
    'Meets & races ': 'מפגשים ומרוצים',
    'Items for sale': 'פריטים למכירה',
    'Click on the map to drop points around the area you care about. Three points or more make a shape.':
      'לחצו על המפה כדי לסמן נקודות סביב האזור שמעניין אתכם. שלוש נקודות או יותר יוצרות צורה.',
    'Search this area': 'חיפוש באזור הזה',
    'Undo point': 'ביטול נקודה',
    'Nothing searched yet': 'עדיין לא חיפשת',
    'Nothing inside that shape. Try a wider area.': 'אין כלום בתוך הצורה. נסו אזור רחב יותר.',
    'Click at least three points on the map to outline an area.': 'לחצו על לפחות שלוש נקודות במפה כדי לסמן אזור.',
    'Search failed.': 'החיפוש נכשל.',
    'Find members': 'חיפוש חברים',
    'Name or username': 'שם או שם משתמש',
    'Based in': 'גר/ה ב',
    'Bio contains': 'התיאור מכיל',
    'Owns a car by': 'בעלים של רכב מתוצרת',
    'Search members': 'חיפוש חברים',
    'No member matched those filters.': 'אף חבר לא התאים לסינון.',
    'No member matched.': 'אף חבר לא נמצא.',
    'Find groups': 'חיפוש קבוצות',
    'Find a group': 'חיפוש קבוצה',
    'Find a member': 'חיפוש חבר',
    'Search groups': 'חיפוש קבוצות',
    'Min members': 'מינימום חברים',
    'Private only': 'פרטיות בלבד',
    'Public only': 'ציבוריות בלבד',
    'No group matched those filters.': 'אף קבוצה לא התאימה לסינון.',
    'Imagery © Esri': 'צילומים © Esri',

    // ---- groups
    'Communities built around a brand, a scene or a style.': 'קהילות סביב יצרן, סצנה או סגנון.',
    'Start a group': 'פתיחת קבוצה',
    'Create group': 'יצירת קבוצה',
    'Name': 'שם',
    'Brand': 'יצרן',
    'Who is this group for?': 'למי מיועדת הקבוצה?',
    'Private group': 'קבוצה פרטית',
    '(joining needs approval)': '(הצטרפות באישור)',
    'All groups': 'כל הקבוצות',
    'Join': 'הצטרפות',
    'Join group': 'הצטרפות לקבוצה',
    'Leave': 'עזיבה',
    'Leave group': 'עזיבת הקבוצה',
    'Leave this group?': 'לעזוב את הקבוצה?',
    'Private': 'פרטית',
    'Privacy': 'פרטיות',
    'No groups yet.': 'אין עדיין קבוצות.',
    'No groups yet. Start the first one.': 'אין עדיין קבוצות. פתחו את הראשונה.',
    'You have not joined any group yet.': 'עדיין לא הצטרפת לאף קבוצה.',
    'Group created': 'הקבוצה נוצרה',
    'Group updated': 'הקבוצה עודכנה',
    'Group deleted': 'הקבוצה נמחקה',
    'You joined the group': 'הצטרפת לקבוצה',
    'You left the group': 'עזבת את הקבוצה',
    'Request sent to the manager': 'הבקשה נשלחה למנהל/ת',
    'Request sent to the group manager': 'הבקשה נשלחה למנהל/ת הקבוצה',
    'Request sent to the group manager.': 'הבקשה נשלחה למנהל/ת הקבוצה.',
    'Give the group a name of at least 2 characters.': 'תנו לקבוצה שם של 2 תווים לפחות.',
    'The group needs a name of at least 2 characters.': 'לקבוצה צריך שם של 2 תווים לפחות.',
    'Events from this group': 'אירועים של הקבוצה',
    'This group has no upcoming events.': 'אין לקבוצה אירועים קרובים.',
    'Group settings': 'הגדרות קבוצה',
    'Edit group': 'עריכת קבוצה',
    'Delete group': 'מחיקת קבוצה',
    'Delete this group? Its events will be removed too.': 'למחוק את הקבוצה? גם האירועים שלה יימחקו.',
    'Join requests': 'בקשות הצטרפות',
    'No requests waiting.': 'אין בקשות ממתינות.',
    'No requests.': 'אין בקשות.',
    'Approve': 'אישור',
    'Reject': 'דחייה',
    'Member approved': 'החבר/ה אושר/ה',
    'Request rejected': 'הבקשה נדחתה',
    'Remove': 'הסרה',
    'Remove this member from the group?': 'להסיר את החבר/ה מהקבוצה?',
    'Member removed': 'החבר/ה הוסר/ה',
    'Managed by': 'בניהול',
    '(manager only)': '(למנהל/ת בלבד)',
    'Group:': 'קבוצה:',
    'Brand': 'יצרן',
    'Off-road': 'שטח',
    'Classic': 'קלאסי',
    'EV': 'חשמלי',
    'Racing': 'מרוצים',
    'Tuning': 'שיפורים',
    'General': 'כללי',

    // ---- garage
    'Your cars, and everyone else\'s.': 'הרכבים שלך, ושל כל השאר.',
    'Add a car': 'הוספת רכב',
    'Add a car to your garage': 'הוספת רכב למוסך',
    'Body type': 'סוג מרכב',
    'Engine': 'מנוע',
    'Horsepower': 'כוחות סוס',
    'Colour': 'צבע',
    'Photo': 'תמונה',
    'Notes': 'הערות',
    'Modifications, plans, story…': 'שיפורים, תוכניות, הסיפור…',
    'Save car': 'שמירת רכב',
    'Save changes': 'שמירת שינויים',
    'My garage': 'המוסך שלי',
    'Browse all cars': 'כל הרכבים',
    'Search every garage': 'חיפוש בכל המוסכים',
    'Year from': 'משנת',
    'Year to': 'עד שנת',
    'HP from': 'מכ״ס',
    'HP to': 'עד כ״ס',
    'In the spotlight': 'באור הזרקורים',
    'Body': 'מרכב',
    'total hp': 'סה״כ כ״ס',
    'hp': 'כ״ס',
    'oldest': 'הוותיק ביותר',
    'cars': 'רכבים',
    'car': 'רכב',
    'unknown': 'לא ידוע',
    'Your showroom is empty': 'אולם התצוגה שלך ריק',
    'Add your first car and it takes the spotlight here.': 'הוסיפו את הרכב הראשון והוא יעמוד כאן באור הזרקורים.',
    'Your garage is empty. Add your first car.': 'המוסך שלך ריק. הוסיפו את הרכב הראשון.',
    'No cars have been added yet.': 'עדיין לא נוספו רכבים.',
    'No cars in any garage yet.': 'עדיין אין רכבים באף מוסך.',
    'No cars in this garage yet.': 'עדיין אין רכבים במוסך הזה.',
    'No car matched those filters.': 'אף רכב לא התאים לסינון.',
    'Parked by': 'חונה אצל',
    'unknown owner': 'בעלים לא ידוע',
    'Edit': 'עריכה',
    'Delete': 'מחיקה',
    'Remove this car from your garage?': 'להסיר את הרכב מהמוסך?',
    'Car added to your garage': 'הרכב נוסף למוסך',
    'Car updated': 'הרכב עודכן',
    'Car removed': 'הרכב הוסר',
    'Enter the make.': 'הזינו יצרן.',
    'Enter the model.': 'הזינו דגם.',
    'Enter a realistic year.': 'הזינו שנה הגיונית.',
    'Horsepower must be between 0 and 2000.': 'כוחות הסוס חייבים להיות בין 0 ל-2000.',
    'The "year from" cannot be later than the "year to".': '"משנת" לא יכולה להיות מאוחרת מ"עד שנת".',
    'The minimum horsepower cannot be above the maximum.': 'כוחות הסוס המינימליים לא יכולים להיות גבוהים מהמקסימום.',
    'Sedan': 'סדאן',
    'Hatchback': 'האצ׳בק',
    'SUV': 'רכב שטח',
    'Coupe': 'קופה',
    'Convertible': 'גג נפתח',
    'Pickup': 'טנדר',
    'Van': 'מסחרית',
    'Other': 'אחר',

    // ---- chat
    'Messages are delivered live over WebSockets': 'ההודעות נשלחות בזמן אמת דרך WebSockets',
    'connecting…': 'מתחבר…',
    'connected': 'מחובר',
    'offline': 'לא מחובר',
    'online': 'מחובר/ת',
    'Conversations': 'שיחות',
    'Add a friend from their profile to start chatting.': 'הוסיפו חבר מהפרופיל שלו כדי להתחיל לשוחח.',
    'Pick somebody to talk to': 'בחרו עם מי לדבר',
    'Choose a conversation on the left.': 'בחרו שיחה מהרשימה.',
    'Write a message…': 'כתבו הודעה…',
    'Send': 'שליחה',
    'Search your messages': 'חיפוש בהודעות שלך',
    'Contains': 'מכיל',
    'With': 'עם',
    'Anyone': 'כל אחד',
    'Search messages': 'חיפוש הודעות',
    'No conversations yet.': 'אין עדיין שיחות.',
    'No messages yet. Say hello.': 'אין עדיין הודעות. תגידו שלום.',
    'Nothing matched.': 'לא נמצאו תוצאות.',
    'Choose somebody to talk to first.': 'קודם בחרו עם מי לדבר.',
    'A message cannot be empty.': 'הודעה לא יכולה להיות ריקה.',
    'Message is too long.': 'ההודעה ארוכה מדי.',
    'Message updated': 'ההודעה עודכנה',
    'Edit your message:': 'עריכת ההודעה:',
    'Could not send.': 'לא ניתן לשלוח.',
    'Could not load.': 'לא ניתן לטעון.',
    'Chat connection failed': 'החיבור לצ׳אט נכשל',
    'that is you': 'זה את/ה',
    'edit': 'עריכה',

    // ---- stats
    'Statistics': 'נתונים',
    'Everything on this page is calculated from the database as it is right now.': 'כל מה שבעמוד הזה מחושב ממסד הנתונים כפי שהוא עכשיו.',
    'Refresh': 'רענון',
    'members': 'חברים',
    'groups': 'קבוצות',
    'events': 'אירועים',
    'listings': 'מודעות',
    'messages': 'הודעות',
    'Meets and races per month': 'מפגשים ומרוצים לפי חודש',
    'Grouped by the month the event takes place.': 'מקובץ לפי החודש שבו מתקיים האירוע.',
    'Most common makes in the garages': 'היצרנים הנפוצים במוסכים',
    'Bar length is the number of cars; hover for average power.': 'אורך העמודה הוא מספר הרכבים; רחפו כדי לראות הספק ממוצע.',
    'Marketplace by category': 'השוק לפי קטגוריה',
    'How many items are listed, and what they cost on average.': 'כמה פריטים מפורסמים, וכמה הם עולים בממוצע.',
    'How busy each group is': 'כמה כל קבוצה פעילה',
    'Roughly how many events each group puts on per month, worked out from how long the group has existed. This is the closest one to the example in the brief, which asks for an average per group per month.':
      'בערך כמה אירועים כל קבוצה מקיימת בחודש, לפי משך הזמן שהקבוצה קיימת.',
    'Where events happen': 'איפה מתקיימים אירועים',
    'Events per city, with the total number of people going.': 'אירועים לפי עיר, עם מספר המגיעים הכולל.',
    'Charts refreshed from the database': 'הגרפים רועננו ממסד הנתונים',
    'Could not load this chart.': 'לא ניתן לטעון את הגרף.',
    'per': 'לכל',

    // ---- profile
    'Edit profile': 'עריכת פרופיל',
    'Edit your profile': 'עריכת הפרופיל שלך',
    'Bio': 'עליי',
    'Profile photo': 'תמונת פרופיל',
    'Current password': 'סיסמה נוכחית',
    'New password': 'סיסמה חדשה',
    'Leave the password fields empty to keep your current password.': 'השאירו את שדות הסיסמה ריקים כדי לשמור על הסיסמה הנוכחית.',
    'Enter your current password to change it.': 'הזינו את הסיסמה הנוכחית כדי לשנות אותה.',
    'The new password must be at least 6 characters.': 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים.',
    'Save profile': 'שמירת פרופיל',
    'Profile saved': 'הפרופיל נשמר',
    'Add friend': 'הוספת חבר',
    'Remove friend': 'הסרת חבר',
    'Remove this friend?': 'להסיר את החבר?',
    'Friend added': 'החבר נוסף',
    'Friend removed': 'החבר הוסר',
    'Friend request sent': 'בקשת החברות נשלחה',
    'Request sent': 'הבקשה נשלחה',
    'Friend requests': 'בקשות חברות',
    'Accept': 'אישור',
    'Message': 'הודעה',
    'No friends yet.': 'אין עדיין חברים.',
    'No events yet.': 'אין עדיין אירועים.',
    'Not a member of any group.': 'לא חבר/ה באף קבוצה.',
    'Nothing yet.': 'עדיין כלום.',
    'Delete my account': 'מחיקת החשבון שלי',
    'Delete your account? Your cars, events and listings go with it. This cannot be undone.': 'למחוק את החשבון? הרכבים, האירועים והמודעות שלך יימחקו איתו. אי אפשר לבטל.',
    'Are you absolutely sure?': 'בטוח לגמרי?',
    'Details': 'פרטים',
    'events hosted': 'אירועים שאירח/ה',
    'items listed': 'פריטים שפורסמו',
    'friends': 'חברים',
    'Removed': 'הוסר',

    // ---- admin
    'Administration': 'ניהול',
    'Only site administrators can open this page. Everybody else gets a 403.': 'רק מנהלי האתר יכולים לפתוח את העמוד הזה.',
    'Recent content': 'תוכן אחרון',
    'Administrators': 'מנהלים',
    'Role': 'תפקיד',
    'Make admin': 'מינוי למנהל/ת',
    'Make member': 'הפיכה לחבר/ה רגיל/ה',
    'Role updated': 'התפקיד עודכן',
    'Newest events': 'האירועים האחרונים',
    'Newest listings': 'המודעות האחרונות',
    'Nobody has signed up yet.': 'עדיין אף אחד לא נרשם.',
    'admin': 'מנהל/ת',
    'member': 'חבר/ה',

    // ---- errors and general
    'Something went wrong. Please try again.': 'משהו השתבש. נסו שוב.',
    'Cannot reach the server. Check your connection.': 'אין חיבור לשרת. בדקו את החיבור.',
    'Not found.': 'לא נמצא.',
    'The page you were looking for does not exist.': 'העמוד שחיפשת לא קיים.',
    'You must be logged in to do that.': 'צריך להתחבר כדי לעשות את זה.',
    'Administrator access required.': 'נדרשת הרשאת מנהל.',
    'This event is full.': 'האירוע מלא.',
    'This group is private.': 'הקבוצה פרטית.',
    'This group is private. Ask the manager to approve your request to join.': 'הקבוצה פרטית. בקשו מהמנהל/ת לאשר את הצטרפותכם.',
    'Join the group before hosting an event for it.': 'הצטרפו לקבוצה לפני שאתם מארחים בה אירוע.',
    'You are already a member.': 'את/ה כבר חבר/ה.',
    'You are already friends.': 'אתם כבר חברים.',
    'Your request is already waiting for approval.': 'הבקשה שלך כבר ממתינה לאישור.',
    'Request already sent.': 'הבקשה כבר נשלחה.',
    'Your current password is incorrect.': 'הסיסמה הנוכחית שגויה.',
    'Only the group manager can do that.': 'רק מנהל/ת הקבוצה יכול/ה לעשות את זה.',
    'Only the host can edit this event.': 'רק המארח/ת יכול/ה לערוך את האירוע.',
    'Only the host can delete this event.': 'רק המארח/ת יכול/ה למחוק את האירוע.',
    'Only the seller can change this.': 'רק המוכר/ת יכול/ה לשנות את זה.',
    'The manager cannot leave their own group.': 'המנהל/ת לא יכול/ה לעזוב את הקבוצה שלו/ה.',
    'Draw an area with at least three points.': 'סמנו אזור עם שלוש נקודות לפחות.',
    'Title must be 3-80 characters': 'הכותרת חייבת להכיל 3-80 תווים',
    'Pick a city from the list': 'בחרו עיר מהרשימה',
    'Pick a city from the list.': 'בחרו עיר מהרשימה.',
    'Pick a valid date and time': 'בחרו תאריך ושעה תקינים',
    'Pick a category': 'בחרו קטגוריה',
    'Pick a circuit from the list': 'בחרו מסלול מהרשימה',
    'Make is required': 'יש להזין יצרן',
    'Model is required': 'יש להזין דגם',
    'Year must be a real year': 'השנה חייבת להיות שנה אמיתית',
    'Price must be a real amount': 'המחיר חייב להיות סכום אמיתי',
    'Message cannot be empty': 'הודעה לא יכולה להיות ריקה',
    'Comment cannot be empty': 'תגובה לא יכולה להיות ריקה',
    'Event not found.': 'האירוע לא נמצא.',
    'Group not found.': 'הקבוצה לא נמצאה.',
    'Listing not found.': 'המודעה לא נמצאה.',
    'Car not found.': 'הרכב לא נמצא.',
    'Member not found.': 'החבר/ה לא נמצא/ה.',
    'That item is no longer listed.': 'הפריט כבר לא מפורסם.',
    'That meet or race does not exist.': 'המפגש או המרוץ לא קיים.',
    'That group does not exist.': 'הקבוצה לא קיימת.',
    'That member does not exist.': 'החבר/ה לא קיים/ת.',
  };

  // the cities, so the dropdowns and the map read in Hebrew too
  var CITIES = {
    'Tel Aviv': 'תל אביב', 'Jerusalem': 'ירושלים', 'Haifa': 'חיפה', 'Rishon LeZion': 'ראשון לציון',
    'Petah Tikva': 'פתח תקווה', 'Ashdod': 'אשדוד', 'Netanya': 'נתניה', 'Beer Sheva': 'באר שבע',
    'Holon': 'חולון', 'Ramat Gan': 'רמת גן', 'Herzliya': 'הרצליה', 'Kfar Saba': 'כפר סבא',
    'Raanana': 'רעננה', 'Modiin': 'מודיעין', 'Ashkelon': 'אשקלון', 'Bat Yam': 'בת ים',
    'Rehovot': 'רחובות', 'Hadera': 'חדרה', 'Nazareth': 'נצרת', 'Tiberias': 'טבריה', 'Acre': 'עכו',
    'Safed': 'צפת', 'Kiryat Gat': 'קריית גת', 'Dimona': 'דימונה', 'Eilat': 'אילת', 'Nahariya': 'נהריה',
    'Kiryat Shmona': 'קריית שמונה', 'Karmiel': 'כרמיאל', 'Afula': 'עפולה', 'Zichron Yaakov': 'זכרון יעקב',
    'Beit Shemesh': 'בית שמש', 'Lod': 'לוד', 'Yavne': 'יבנה', 'Sderot': 'שדרות', 'Ofakim': 'אופקים',
    'Arad': 'ערד', 'Mitzpe Ramon': 'מצפה רמון', 'Petah Tikva ': 'פתח תקווה', 'Hod Hasharon': 'הוד השרון',
    'Givatayim': 'גבעתיים', 'Rosh HaAyin': 'ראש העין', 'Ramat Hasharon': 'רמת השרון',
  };
  Object.keys(CITIES).forEach(function (k) { HE[k] = CITIES[k]; });

  var NOUNS = {
    event: 'אירועים', events: 'אירועים', car: 'רכבים', cars: 'רכבים', group: 'קבוצות', groups: 'קבוצות',
    item: 'פריטים', items: 'פריטים', member: 'חברים', members: 'חברים', message: 'הודעות', messages: 'הודעות',
  };

  // phrases with a number or a name inside them
  var PATTERNS = [
    [/^(\d+) going$/, '$1 מגיעים'],
    [/^(\d+) found in this area$/, 'נמצאו $1 באזור הזה'],
    [/^(\d+) (\w+) found$/, function (m, n, noun) { return 'נמצאו ' + n + ' ' + (NOUNS[noun] || noun); }],
    [/^(\d+) members?$/, '$1 חברים'],
    [/^(\d+) cars?$/, '$1 רכבים'],
    [/^(\d+) hp$/, '$1 כ״ס'],
    [/^avg (\d+) hp$/, 'ממוצע $1 כ״ס'],
    [/^(\d+) listed$/, '$1 מודעות'],
    [/^avg ₪\s?(.+)$/, 'ממוצע ₪$1'],
    [/^(\d+) events?$/, '$1 אירועים'],
    [/^(\d+) going in total$/, 'סה״כ $1 מגיעים'],
    [/^([\d.]+) events per month$/, '$1 אירועים בחודש'],
    [/^(\d+) events in total$/, 'סה״כ $1 אירועים'],
    [/^meets?: (\d+)$/, 'מפגשים: $1'],
    [/^races?: (\d+)$/, 'מרוצים: $1'],
    [/^drives a (.+)$/, 'נוהג/ת ב-$1'],
    [/^is hosting in (.+)$/, 'מארח/ת ב-$1'],
    [/^Hosted by:? (.+)$/, 'מארח/ת: $1'],
    [/^managed by$/, 'בניהול'],
    [/^Managed by (.+)$/, 'בניהול $1'],
    [/^Based in (.+)$/, 'גר/ה ב-$1'],
    [/^joined (.+)$/, 'הצטרף/ה ב-$1'],
    [/^New message from (.+)$/, 'הודעה חדשה מ$1'],
    [/^(.+) is typing…$/, '$1 מקליד/ה…'],
    [/^You → (.+)$/, 'את/ה ← $1'],
    [/^(.+) → you$/, '$1 ← את/ה'],
    [/^\(([\d.]+) km in total\)$/, '(סה״כ $1 ק״מ)'],
    [/^\(([\d.]+) km\)$/, '($1 ק״מ)'],
    [/^(.+) \(([\d.]+) km\)$/, function (m, name, km) { return translate(name) + ' (' + km + ' ק״מ)'; }],
    [/^Remove this (\w+)\? This cannot be undone\.$/, 'להסיר? אי אפשר לבטל.'],
    [/^(Event|Listing|Group|Member|Comment|User) removed$/, 'הוסר'],
    [/^Bay (\d+)$/, 'מקום $1'],
    [/^Change this member's role to "(\w+)"\?$/, 'לשנות את התפקיד ל-"$1"?'],
    [/^Could not reach YouTube to find the newest (.+) video\. Try again when you are online\.$/, 'לא ניתן להגיע ל-YouTube. נסו שוב כשתהיו מחוברים.'],
    [/^(\d+) member(s)? · managed by$/, '$1 חברים · בניהול'],
  ];

  // ---------------------------------------------------------------- translate
  function translate(text) {
    if (HE.hasOwnProperty(text)) return HE[text];
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i][0].test(text)) return text.replace(PATTERNS[i][0], PATTERNS[i][1]);
    }
    // "Used · Tel Aviv" and "Feed | Maslul": translate each part on its own
    var sep = text.indexOf(' · ') !== -1 ? ' · ' : (text.indexOf(' | ') !== -1 ? ' | ' : null);
    if (sep) {
      var parts = text.split(sep);
      var changed = false;
      var out = parts.map(function (p) {
        var t = p.trim() ? translate(p.trim()) : p;
        if (t !== p.trim()) changed = true;
        return t === p.trim() ? p : t;
      });
      if (changed) return out.join(sep);
    }
    return text;
  }

  // dates are written in English by ui.js ("14 Oct 2026, 19:30"), wherever
  // they sit in a line, so the month name is swapped on its own
  var MONTHS = { Jan: 'ינו׳', Feb: 'פבר׳', Mar: 'מרץ', Apr: 'אפר׳', May: 'מאי', Jun: 'יוני',
    Jul: 'יולי', Aug: 'אוג׳', Sep: 'ספט׳', Oct: 'אוק׳', Nov: 'נוב׳', Dec: 'דצמ׳' };
  var DATE = /\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\b/g;
  function translateDates(text) {
    return text.replace(DATE, function (m, d, mon, y) { return d + ' ' + MONTHS[mon] + ' ' + y; });
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, NOSCRIPT: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label'];

  // every change is written down with the English it replaced, so switching
  // back to English puts the page back exactly as it was, with no reload
  var changes = [];

  function translateText(node) {
    if (LANG !== 'he') return;
    var raw = node.nodeValue;
    var trimmed = raw.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) return;
    // paragraphs in the templates are wrapped over several lines, so look
    // them up with the spacing squashed down to single spaces
    var squashed = trimmed.replace(/\s+/g, ' ');
    var done = translateDates(translate(squashed));
    if (done === squashed) return;
    var value = raw.replace(trimmed, done);
    changes.push({ node: node, from: raw, to: value });
    node.nodeValue = value;
  }

  function translateElement(el) {
    if (LANG !== 'he') return;
    // a textarea's own text is what the user typed, but its placeholder is ours
    if ((SKIP[el.tagName] && el.tagName !== 'TEXTAREA') || el.closest('[data-no-i18n]')) return;
    ATTRS.forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (v && /[A-Za-z]/.test(v)) {
        var t = translate(v.trim());
        if (t !== v.trim()) {
          changes.push({ el: el, attr: a, from: v, to: t });
          el.setAttribute(a, t);
        }
      }
    });
    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') && el.value) {
      var t = translate(el.value);
      if (t !== el.value) {
        changes.push({ el: el, prop: 'value', from: el.value, to: t });
        el.value = t;
      }
    }
  }

  function translateTree(root) {
    if (LANG !== 'he') return;
    if (root.nodeType === 3) {
      if (root.parentNode && !SKIP[root.parentNode.tagName] && !root.parentNode.closest('[data-no-i18n]')) translateText(root);
      return;
    }
    if (root.nodeType !== 1 || SKIP[root.tagName] || root.closest('[data-no-i18n]')) return;
    translateElement(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) {
          if (n.tagName === 'TEXTAREA') translateElement(n);
          return SKIP[n.tagName] || n.hasAttribute('data-no-i18n') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 1) translateElement(n);
      else translateText(n);
    }
    // forget about things that have left the page so the list does not grow forever
    if (changes.length > 4000) {
      changes = changes.filter(function (c) { return (c.node || c.el).isConnected; });
    }
  }

  // puts back the English, but only where the page still shows our Hebrew.
  // if a script has written something new there since, that stays
  function restoreEnglish() {
    for (var i = changes.length - 1; i >= 0; i--) {
      var c = changes[i];
      if (c.node) {
        if (c.node.nodeValue === c.to) c.node.nodeValue = c.from;
      } else if (c.prop) {
        if (c.el[c.prop] === c.to) c.el[c.prop] = c.from;
      } else if (c.el.getAttribute(c.attr) === c.to) {
        c.el.setAttribute(c.attr, c.from);
      }
    }
    changes = [];
  }

  // ---------------------------------------------------------------- switching
  var englishTitle = document.title;

  function apply(lang) {
    LANG = lang;
    window.I18N.lang = lang;
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'he' ? 'rtl' : 'ltr';

    if (lang === 'he') {
      englishTitle = document.title;
      document.title = translate(document.title);
      translateTree(document.body);
    } else {
      restoreEnglish();
      document.title = englishTitle;
    }

    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-set-lang') === lang);
    });
    // anything drawn on a canvas (the search map) redraws itself on this
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } }));
  }

  // runs a change to the whole page as a smooth animation. the browser takes
  // a picture of the page, makes the change, then animates from the picture
  // to the new page (the View Transitions API). browsers without it, and
  // people who asked their system for less motion, just get the change.
  // origin is a click point: given one, the new page grows out of it in a
  // circle, otherwise the two simply cross fade. theme.js uses this too.
  // clicks that arrive while an animation is still running are ignored, so a
  // double click on the theme button does not switch it straight back
  var switching = false;

  window.smoothSwitch = function (update, origin) {
    if (switching) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // a tab in the background cannot animate, so it just changes
    if (!document.startViewTransition || reduced || document.hidden) return update();

    var html = document.documentElement;
    if (origin) {
      // how far the circle has to grow to cover the far corner
      var r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
      html.style.setProperty('--reveal-x', origin.x + 'px');
      html.style.setProperty('--reveal-y', origin.y + 'px');
      html.style.setProperty('--reveal-r', r + 'px');
      html.classList.add('vt-reveal');
    }
    switching = true;
    var t = document.startViewTransition(update);
    // if the browser gives up on the animation the change itself still
    // happens, so a skipped animation is nothing to report
    t.ready.catch(function () {});
    t.finished.catch(function () {}).then(function () {
      html.classList.remove('vt-reveal');
      switching = false;
    });
  };

  // the switch in the top bar. the cookie is for the next page the server
  // renders, the page you are on changes straight away
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-set-lang]');
    if (!btn) return;
    var lang = btn.getAttribute('data-set-lang');
    if (lang === LANG) return;
    window.smoothSwitch(function () {
      document.cookie = 'lang=' + lang + '; path=/; max-age=31536000; SameSite=Lax';
      apply(lang);
    });
  });

  window.I18N = { lang: LANG, t: function (s) { return LANG === 'he' ? translate(s) : s; } };

  // the browser's own popups show text too
  var nativeConfirm = window.confirm.bind(window);
  var nativeAlert = window.alert.bind(window);
  var nativePrompt = window.prompt.bind(window);
  window.confirm = function (msg) { return nativeConfirm(window.I18N.t(String(msg))); };
  window.alert = function (msg) { return nativeAlert(window.I18N.t(String(msg))); };
  window.prompt = function (msg, def) { return nativePrompt(window.I18N.t(String(msg)), def); };

  // ---------------------------------------------------------------- run
  try {
    if (LANG === 'he') {
      document.title = translate(document.title);
      translateTree(document.body);
    }
  } finally {
    document.documentElement.classList.add('i18n-ready');
  }

  // everything the page scripts add afterwards. it is always watching, so a
  // switch to Hebrew halfway through still catches what loads later
  new MutationObserver(function (mutations) {
    if (LANG !== 'he') return;
    mutations.forEach(function (m) {
      if (m.type === 'characterData') translateTree(m.target);
      else if (m.type === 'attributes') translateElement(m.target);
      else m.addedNodes.forEach(translateTree);
    });
  }).observe(document.body, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ATTRS,
  });
})();
