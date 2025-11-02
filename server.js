// server.js - שרת חכם שמקבל שיחות Twilio ומדבר עם GPT-5
import dotenv from "dotenv";
import OpenAI from "openai";
import express from "express";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// התחברות ל-GPT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// בדיקת חיים בסיסית
app.get("/", (req, res) => {
  res.send("✅ שרת טומי פעיל! מוכן לקבל שיחות Twilio.");
});

// ✅ קבלת שיחות טלפון נכנסות
app.post("/voice", async (req, res) => {
  console.log("📞 התקבלה בקשה מ-Twilio לנתיב /voice");
  console.log("תוכן הבקשה:", req.body);

  try {
    const callerSpeech = req.body.SpeechResult || req.body.Digits || "";
    console.log("🎤 דיבור מהמתקשר:", callerSpeech);

    let replyText = "שלום, כאן טומי. איך אפשר לעזור לך היום?";

    if (callerSpeech) {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "אתה טומי, נציג שירות קולי אדיב של מסעדת רול בר.",
          },
          { role: "user", content: callerSpeech },
        ],
      });
      replyText = gptResponse.choices[0].message.content;
    }

    const twiml = `
      <Response>
        <Say voice="Polly.Ziv" language="he-IL">${replyText}</Say>
        <Pause length="1"/>
        <Gather input="speech" action="/voice" method="POST" timeout="5">
          <Say voice="Polly.Ziv" language="he-IL">אני מקשיב...</Say>
        </Gather>
      </Response>
    `;

    console.log("📤 נשלחה תשובת Twilio:", replyText);

    res.type("text/xml");
    res.send(twiml);
  } catch (err) {
    console.error("❌ שגיאה במהלך השיחה:", err);
    res.type("text/xml");
    res.send(`
      <Response>
        <Say voice="Polly.Ziv" language="he-IL">
          אירעה שגיאה בעיבוד הבקשה שלך.
        </Say>
      </Response>
    `);
  }
});

// הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 השרת מאזין לשיחות טווילו על פורט ${PORT}`);
});
