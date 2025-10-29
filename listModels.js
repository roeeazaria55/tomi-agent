import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listModels() {
  try {
    const res = await openai.models.list();
    console.log("📋 רשימת המודלים הזמינים לחשבון שלך:");
    res.data.forEach(m => console.log("•", m.id));
  } catch (err) {
    console.error("❌ שגיאה:", err.message);
  }
}

listModels();
