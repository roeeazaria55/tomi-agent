// ✅ server.js — גרסה יציבה סופית עם תיקון שפת Gather + ניקוי טקסט
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🧠 אתחול OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🌍 בדיקה בדפדפן
app.get("/", (req, res) => {
  console.log("🌍 נשלחה בקשת GET ל-root");
  res.send("✅ שרת טומי פעיל ומחובר לטווילו בהצלחה!");
});

// 📞 Twilio שולחת לכאן את השיחות
app.post("/voice", async (req, res) => {
  console.log("📞 התקבלה בקשת POST מ-Twilio לנתיב /voice");
  console.log("🔸 גוף הבקשה:", req.body);

  try {
    const callerSpeech = req.body.SpeechResult || req.body.Digits || "";
    console.log("🎤 טקסט שזוהה מהמתקשר:", callerSpeech);

    let replyText = "שלום, כאן טומי. איך אפשר לעזור לך היום?";

    // 🤖 שולחים ל-GPT-5 רק אם המשתמש באמת דיבר
    if (callerSpeech) {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content:
              "אתה טומי, נציג שירות קולי אדיב של מסעדת רול בר. דבר בעברית פשוטה וברורה בלבד.",
          },
          { role: "user", content: callerSpeech },
        ],
      });

      // ✅ ניקוי התשובה לפני הכנסת ל-Say
      replyText = gptResponse.choices[0].message.content
        .replace(/[<>]/g, "")        // מסיר סוגריים חדים
        .replace(/["']/g, "")        // מסיר גרשיים
        .replace(/[\n\r]/g, " ")     // מחליף שורות ברווח
        .replace(/[^\u0000-\u007F\u0590-\u05FF\s.,!?]/g, "") // מסיר אמוג'ים ותווים זרים
        .trim();

      console.log("🤖 תשובת GPT אחרי ניקוי:", replyText);
    }

    // 🗣️ בונים את תגובת ה-TwiML (שפה רק ב-Say, לא ב-Gather)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">${replyText}</Say>
  <Pause length="1"/>
  <Gather input="speech" action="/voice" method="POST" timeout="5">
    <Say voice="Polly.Ziv" language="he-IL">אני מקשיב...</Say>
  </Gather>
</Response>`;

    console.log("📤 נשלחת תשובת TwiML ל-Twilio:\n", twiml);

    res.set("Content-Type", "text/xml");
    res.send(twiml);
  } catch (error) {
    console.error("❌ שגיאה במהלך השיחה:", error);

    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">
    אירעה שגיאה בשרת. נסה שוב מאוחר יותר.
  </Say>
</Response>`);
  }
});

// 🚀 הפעלת השרת
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 שרת טומי מאזין לטווילו על פורט ${PORT}`);
});
