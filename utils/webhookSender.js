import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const mem_uri = process.env.MEM_URI;
export const sendEventToWebhook = async (eventData) => {
  console.log(eventData);
  try {
    const response = await axios.post(
      "http://localhost:8000/webhook/events/receive",
      eventData
    );
    console.log("✅ Webhook sent:", response.status);
  } catch (error) {
    console.error("❌ Webhook sending failed:", error.message);
  }
};

export const sendChapterToWebhook = async (chapterData) => {
  console.log("Sending chapter data via webhook:", chapterData);
  try {
    const response = await axios.post(
      `${mem_uri}/webhook/chapters/receive`,
      chapterData
    );
    console.log("✅ Webhook sent:", response.status);
  } catch (error) {
    console.error("❌ Webhook sending failed:", error.message);
  }
};
