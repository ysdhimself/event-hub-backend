// Add to events.js
router.get("/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: { select: { id: true, email: true } },
        rsvps: { include: { user: { select: { id: true, email: true } } } },
      },
    });

    if (!event) return res.status(404).json({ error: "Event not found." });

    res.json(event);
  } catch (err) {
    console.error("Get event details error:", err);
    res.status(500).json({ error: "Failed to fetch event." });
  }
});
