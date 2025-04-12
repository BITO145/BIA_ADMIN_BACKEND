import axios from "axios";

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
