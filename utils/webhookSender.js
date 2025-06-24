import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
//this is webhook sender

const mem_uri = process.env.MEM_URI;
export const sendEventToWebhook = async (eventData) => {
  try {
    const response = await axios.post(
      `${mem_uri}/webhook/events/receive`,
      eventData
    );
  } catch (error) {
    console.error("❌ Webhook sending failed:", error.message);
  }
};

export const sendChapterToWebhook = async (chapterData) => {
  try {
    const response = await axios.post(
      `${mem_uri}/webhook/chapters/receive`,
      chapterData
    );
  } catch (error) {
    console.error("❌ Webhook sending failed:", error.message);
  }
};
