// Plans saved before the English redesign stored Hebrew titles. Saved plan
// versions are immutable, so we translate those known strings at display time
// instead of rewriting the user's history. Unknown text passes through as-is.
const legacy: Record<string, string> = {
  'מנוחה והתאוששות': 'Rest & recover', 'אימון כוח · כל הגוף': 'Full-body strength',
  'היכרות עם הליכה וריצה': 'Intro walk-run', 'ריצה נוחה': 'Easy run',
  'ארוחת בוקר': 'Breakfast', 'ארוחת צהריים': 'Lunch', 'ארוחת ערב': 'Dinner',
  'קערת יוגורט, פרי ושיבולת שועל': 'Yogurt bowl with fruit and oats',
  'צלחת עם מקור חלבון, דגן וירקות': 'Plate with protein, grains and vegetables',
  'כריך, ממרח וירקות טריים': 'Sandwich, spread and fresh vegetables',
  'גבר או אישה לצורך החישוב': 'male/female for the formula', 'גיל': 'age', 'גובה': 'height',
  'מדידת משקל': 'a weight measurement', 'פעילות יומית': 'daily activity',
  'התאמה לאומדן למבוגרים בריאים': 'healthy-adult fit',
  'האומדן הנוכחי מוגבל לגילאי 19–78, טווח המחקר של Mifflin': 'The estimate is limited to ages 19–78, the study range of Mifflin',
  'תוצאת האומדן מחוץ לטווח הנתמך; יש לבדוק את הקלט עם איש מקצוע': 'The estimate is outside the supported range; check the inputs with a professional',
};
export const legacyText = (text: string) => legacy[text] ?? text;
