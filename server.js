// server.js - הפעלה של סוכן טומי עם GPT-5

// 1. טעינת ספריות
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

// טוען את קובץ הסביבה (.env)
dotenv.config();

// 2. טעינת נתוני המסעדה מתוך הקובץ JSON
const restaurantData = JSON.parse(fs.readFileSync("./restaurant-data.json", "utf-8"));

// 3. פתיחת חיבור ל-GPT-5 עם ה-API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 4. פונקציה שבודקת את החיבור ומריצה שאלה לדוגמה
async function testAPI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `
            אתה טומי, סוכן שירות של מסעדת טומי רול בר.
            אתה מדבר עברית שוטפת ובנימוס, ועונה ללקוחות לגבי המנות, שעות הפעילות והמבצעים.
            זה המידע של המסעדה:
            ${JSON.stringify(restaurantData, null, 2)}
          `,
        },
        { role: "user", content: "שלום טומי, מה שעות הפתיחה שלכם?" },
      ],
    });

    // 5. הצגת התשובה בקונסול ושמירה לקובץ
    fs.writeFileSync("output.txt", response.choices[0].message.content, "utf-8");
    console.log("✅ תשובת GPT-5 נשמרה בקובץ output.txt (בעברית ישרה)");

  } catch (err) {
    console.error("❌ שגיאה בחיבור או ב-API Key:", err.message);
  }
}

// 6. הפעלת הפונקציה
testAPI();
