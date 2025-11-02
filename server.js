// server.js - הפעלת סוכן טומי עם GPT-5

// 1. טעינת ספריות
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import express from "express";

// 2. הגדרת אפליקציית Express
const app = express();
app.use(express.json());

// 3. טעינת קובץ הסביבה (.env)
dotenv.config();

// 4. טעינת נתוני המסעדה מקובץ JSON
const restaurantData = JSON.parse(fs.readFileSync("./restaurant-data.json"));

// 5. פתיחת חיבור ל-API של GPT-5
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 6. פונקציה שבודקת את החיבור ושולחת שאלה לדוגמה
async function testAPI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `
          אתה טומי, סוכן שירות של מסעדת טומי רול בר.
          ענה ללקוחות לגבי תפריטים, שעות פעילות ומבצעים.
          זה המידע של המסעדה:
          ${JSON.stringify(restaurantData, null, 2)}
          `,
        },
        { role: "user", content: "מה שעות הפתיחה שלכם?" },
      ],
    });

    // הצגת התשובה בקונסול ושמירה לקובץ
    const answer = response.choices[0].message.content;
    fs.writeFileSync("output.txt", answer);
    console.log("✅ תשובת GPT-5 נשמרה בקובץ output.txt");

  } catch (err) {
    console.error("❌ שגיאה בחיבור או ב-API Key:", err.message);
  }
}

// 7. הפעלת הפונקציה לבדיקה
testAPI();

// 8. הפעלת שרת והאזנה לפורט של Render
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("✅ Tomi Agent server is running!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 השרת פועל ומאזין על פורט ${PORT}`);
});
