// ✅ server.js — גרסה עם DEBUG מלא לטווילו + GPT-5 + Render

import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ אתחול GPT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 נקודת בדיקה פשוטה (בדפדפן)
app.get("/", (req, res) => {
  console.log("🌍 נשלחה בקשת GET ל-root");
  res.send("✅ שרת טומי פעיל ומחובר לטווילו בהצלחה!");
});

// 🔹 Twilio שולחת לפה את כל שיחות הטלפון
app.post("/voice", async (req, res) => {
  console.log("📞 התקבלה בקשת POST מ-Twilio לנתיב /voice");
  console.log("🔸 גוף הבקשה (req.body):", req.body);

  try {
    const callerSpeech = req.body.SpeechResult || req.body.Digits || "";
    console.log("🎤 טקסט שזוהה מהמתקשר:", callerSpeech);

    let replyText = "שלום, כאן טומי. איך אפשר לעזור לך היום?";

    // ✅ בקשה ל-GPT-5 רק אם באמת נאמר משהו
    if (callerSpeech) {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content:
              "אתה טומי, נציג שירות קולי אדיב של מסעדת רול בר. דבר בעברית פשוטה וברורה.",
          },
          { role: "user", content: callerSpeech },
        ],
      });

      replyText = gptResponse.choices[0].message.content.trim();
      console.log("🤖 תשובת GPT:", replyText);
    }

    // ✅ נבנה תשובת Twilio בפורמט XML (TwiML)
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">${replyText}</Say>
  <Pause length="1"/>
  <Gather input="speech" action="/voice" method="POST" timeout="5">
    <Say voice="Polly.Ziv" language="he-IL">אני מקשיב...</Say>
  </Gather>
</Response>`;

    console.log("📤 נשלחת תשובה ל-Twilio בפורמט TwiML:");
    console.log(twimlResponse);

    res.set("Content-Type", "text/xml");
    res.send(twimlResponse);
  } catch (error) {
    console.error("❌ שגיאה במהלך השיחה:", error);
    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">אירעה שגיאה בשרת. נסה שוב מאוחר יותר.</Say>
</Response>`);
  }
});

// 🔹 הגדרת פורט עבור Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 שרת טומי מאזין לטווילו על פורט ${PORT}`);
});
