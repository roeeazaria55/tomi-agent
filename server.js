// ✅ server.js — גרסה מלאה: GPT-5 + Twilio + הקלטות + Dashboard חכם
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🧠 אתחול GPT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📁 יצירת תיקיית לוגים אם לא קיימת
const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
  console.log("📂 נוצרה תיקיית logs לתיעוד שיחות");
}

// 🌍 בדיקה פשוטה
app.get("/", (req, res) => {
  res.send("✅ שרת טומי פעיל ומחובר לטווילו בהצלחה!");
});

// 📞 ניהול שיחות נכנסות
app.post("/voice", async (req, res) => {
  console.log("📞 התקבלה בקשת POST מ-Twilio לנתיב /voice");
  console.log("🔸 גוף הבקשה:", req.body);

  try {
    const callerSpeech = req.body.SpeechResult || req.body.Digits || "";
    const callSid = req.body.CallSid || "unknown_call";

    // 🕵️‍♂️ זיהוי שפה
    const isHebrew = /[\u0590-\u05FF]/.test(callerSpeech);
    const lang = isHebrew ? "he-IL" : "en-US";
    const voice = isHebrew ? "Polly.Ziv" : "Polly.Nicole";

    let replyText = isHebrew
      ? "שלום, כאן טומי. איך אפשר לעזור לך היום?"
      : "Hello, this is Tomi. How can I help you today?";

    // 🤖 תקשורת עם GPT
    if (callerSpeech) {
      const systemPrompt = isHebrew
        ? "אתה טומי, נציג שירות קולי אדיב של מסעדת רול בר. דבר בעברית פשוטה וברורה בלבד, במשפטים קצרים שמתאימים להקראה קולית."
        : "You are Tomi, a polite voice assistant for Roll Bar restaurant. Speak in short, clear English sentences suitable for speech.";

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: callerSpeech },
        ],
      });

      replyText = gptResponse.choices[0].message.content
        .replace(/[<>]/g, "")
        .replace(/["']/g, "")
        .replace(/[\n\r]/g, " ")
        .replace(/&/g, " and ")
        .replace(/[^\u0000-\u007F\u0590-\u05FF\s.,!?]/g, "")
        .trim();
    }

    // fallback אם אין תשובה תקינה
    if (!replyText || replyText.length < 2) {
      replyText = isHebrew
        ? "סליחה, לא שמעתי טוב. תוכל לחזור שוב?"
        : "Sorry, I didn’t catch that. Could you repeat?";
    }

    // 📝 תיעוד השיחה
    const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Jerusalem" });
    const logFile = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.txt`);
    const logEntry = `[${timestamp}] [${lang}] USER: ${callerSpeech}\n[${timestamp}] [${lang}] GPT: ${replyText}\n\n`;
    fs.appendFileSync(logFile, logEntry);

    // ✅ תשובת TwiML עם הקלטה
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${replyText}</Say>
  <Record 
    action="/recording"
    method="POST"
    maxLength="30"
    playBeep="true"
    trim="do-not-trim"
  />
  <Pause length="1"/>
  <Gather input="speech" action="/voice" method="POST" timeout="5">
    <Say voice="${voice}" language="${lang}">
      ${isHebrew ? "אני מקשיב..." : "I’m listening..."}
    </Say>
  </Gather>
</Response>`;

    res.set("Content-Type", "text/xml");
    res.send(twiml);
  } catch (error) {
    console.error("❌ שגיאה במהלך השיחה:", error);

    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Nicole" language="en-US">
    Sorry, there was a problem with the server. Please try again later.
  </Say>
</Response>`);
  }
});

// 🎧 Twilio שולחת הקלטות לכאן
app.post("/recording", (req, res) => {
  console.log("🎧 התקבלה הקלטת שיחה מ-Twilio");
  const recordingUrl = req.body.RecordingUrl || "לא ידוע";
  const callSid = req.body.CallSid || "לא ידוע";
  const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Jerusalem" });
  const logFile = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.txt`);

  const logEntry = `[${timestamp}] 🎧 Recording saved for CallSid ${callSid}: ${recordingUrl}.mp3\n\n`;
  fs.appendFileSync(logFile, logEntry);
  console.log("✅ הוקלטה שיחה ונשמרה בלוג:", recordingUrl);

  res.send("<Response></Response>");
});

// 📊 לוח הבקרה החכם
app.get("/dashboard", (req, res) => {
  const logFiles = fs.readdirSync(LOG_DIR).filter(f => f.endsWith(".txt"));
  let html = `
    <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8"/>
        <title>📊 לוח הבקרה של טומי</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background:#f4f6f9; margin:0; padding:30px; color:#222; }
          h1 { text-align:center; color:#333; }
          .log-container { display:flex; flex-direction:column; gap:10px; max-width:900px; margin:auto; }
          .entry { background:white; padding:15px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.08); }
          .user { border-right:5px solid #3b82f6; }
          .gpt { border-right:5px solid #22c55e; }
          .recording { border-right:5px solid #a855f7; }
          audio { width:250px; margin-top:5px; }
          .file-title { margin-top:30px; color:#555; font-weight:bold; }
        </style>
      </head>
      <body>
        <h1>📊 לוח הבקרה של טומי</h1>
        <div class="log-container">
  `;

  for (const file of logFiles.reverse()) {
    const fullPath = path.join(LOG_DIR, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim().length > 0);

    html += `<div class="file-title">📅 ${file}</div>`;
    lines.forEach(line => {
      const isUser = line.includes("USER:");
      const isGPT = line.includes("GPT:");
      const isRecording = line.includes("Recording saved");

      if (isUser)
        html += `<div class="entry user">🧑 <b>משתמש:</b> ${line.split("USER:")[1]}</div>`;
      else if (isGPT)
        html += `<div class="entry gpt">🤖 <b>טומי:</b> ${line.split("GPT:")[1]}</div>`;
      else if (isRecording) {
        const url = line.match(/https:\/\/[^\s]+/);
        if (url)
          html += `<div class="entry recording">🎧 <b>הקלטה:</b><br><audio controls src="${url[0]}.mp3"></audio></div>`;
      }
    });
  }

  html += `
        </div>
        <p style="text-align:center;color:#777;margin-top:40px;">© 2025 טומי Voice Agent | Powered by Render</p>
      </body>
    </html>
  `;

  res.send(html);
});

// 🚀 הפעלת השרת
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 שרת טומי מאזין לטווילו על פורט ${PORT}`);
});
