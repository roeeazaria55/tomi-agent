// server.js - Twilio Voice + GPT-5 integration (תיקון TwiML)
import dotenv from "dotenv";
import OpenAI from "openai";
import express from "express";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// בדיקה פשוטה
app.get("/", (req, res) => {
  res.send("✅ שרת טומי פעיל עם Twilio Voice!");
});

// ✅ קבלת שיחות טלפון נכנסות
app.post("/voice", async (req, res) => {
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
            content:
              "אתה טומי, נציג שירות קולי אדיב של מסעדת רול בר. דבר בעברית פשוטה וברורה.",
          },
          { role: "user", content: callerSpeech },
        ],
      });
      replyText = gptResponse.choices[0].message.content.trim();
    }

    // ✅ שולחים תגובה תקנית ל-Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">${replyText}</Say>
  <Pause length="1"/>
  <Gather input="speech" action="/voice" method="POST" timeout="5">
    <Say voice="Polly.Ziv" language="he-IL">אני מקשיב...</Say>
  </Gather>
</Response>`;

    res.set("Content-Type", "text/xml");
    res.send(twiml);
  } catch (err) {
    console.error("❌ שגיאה בשיחה:", err);
    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Ziv" language="he-IL">אירעה שגיאה בשרת. נסה שוב מאוחר יותר.</Say>
</Response>`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 שרת מאזין לטווילו על פורט ${PORT}`)
);
