import axios from "axios";

export const sendEventToWebhook = async (eventData) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/webhook/events/receive",
      eventData
    );
    console.log("✅ Webhook sent:", response.status);
  } catch (error) {
    console.error("❌ Webhook sending failed:", error.message);
  }
};
