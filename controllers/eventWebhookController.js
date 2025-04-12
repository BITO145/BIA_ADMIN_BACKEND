import UserEvent from "../models/eventModel.js";

// Handle incoming event data from webhook
export const receiveEvent = async (req, res) => {
  try {
    const {
      eventId,
      eventName,
      eventStartTime,
      eventEndTime,
      eventDate,
      location,
      description,
      membershipRequired,
      chapter,
    } = req.body;

    if (!eventId || !eventName || !eventDate || !chapter) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingEvent = await UserEvent.findOne({ eventId });

    if (existingEvent) {
      await UserEvent.updateOne(
        { eventId },
        {
          eventName,
          eventStartTime,
          eventEndTime,
          eventDate,
          location,
          description,
          membershipRequired,
          chapter,
        }
      );
    } else {
      await UserEvent.create({
        eventId,
        eventName,
        eventStartTime,
        eventEndTime,
        eventDate,
        location,
        description,
        membershipRequired,
        chapter,
      });
    }

    res.status(200).json({ message: "Event saved/updated successfully" });
  } catch (error) {
    console.error("Error in webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
