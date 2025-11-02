// server.js - אינטגרציה מלאה בין Twilio Voice ל-GPT-5 (מתוקן ומוכן לשיחות)
import dotenv from "dotenv";
import OpenAI from "openai";
import express from "express";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ חיבור ל-GPT-5
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ בדיקת חיבור פשוטה
app.get("/", (req, res) => {
  res.send("✅ שרת טומי פעיל ומחובר לטווילו!");
});

// ✅ קבלת שיחות טלפון נכנסות
app.post("/voice", async (req, res) => {
  try {
    const callerSpeech = req.body.SpeechResult || req.body.Digits || "";
    console.log("🎤 דיבור מהמתקשר:", callerSpeech);

    let replyText = "שלום, כאן טומי. איך אפשר לעזור לך היום?";

    // אם המשתמש אמר משהו — שולחים ל-GPT
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
    }

    // ✅ תגובה בפורמט XML תקני עבור Twilio
    const twimlResponse = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">${replyText}</Say>
  <Pause length="1"/>
  <Gather input="speech" action="/voice" method="POST" timeout="5">
    <Say voice="Polly.Ziv" language="he-IL">אני מקשיב...</Say>
  </Gather>
</Response>
`;

    res.status(200).type("application/xml");
    res.send(twimlResponse);
  } catch (err) {
    console.error("❌ שגיאה בשיחה:", err);
    res.status(500).type("application/xml").send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">אירעה שגיאה בשרת. נסה שוב מאוחר יותר.</Say>
</Response>
`);
  }
});

// ✅ Render מאזין על פורט 10000 (או פורט שהמערכת מספקת)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 שרת טומי מאזין לטווילו על פורט ${PORT}`);
});
