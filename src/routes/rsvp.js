// rsvp.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// RSVP to an event
router.post("/:eventId", auth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    const rsvp = await prisma.rSVP.create({
      data: { userId: req.user.id, eventId },
    });

    res.status(201).json(rsvp);
  } catch (err) {
    console.error("RSVP error:", err);
    res.status(400).json({ error: "Already RSVP’d or invalid event." });
  }
});

// List RSVPs for an event
router.get("/:eventId", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const rsvps = await prisma.rSVP.findMany({
      where: { eventId },
      include: { user: { select: { id: true, email: true } } },
    });
    res.json(rsvps);
  } catch (err) {
    console.error("Get RSVPs error:", err);
    res.status(500).json({ error: "Failed to fetch RSVPs." });
  }
});

// List events a user RSVP'd to
router.get("/me/list", auth, async (req, res) => {
  try {
    const rsvps = await prisma.rSVP.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: { organizer: { select: { id: true, email: true } } },
        },
      },
    });

    const events = rsvps.map((r) => r.event);
    res.json(events);
  } catch (err) {
    console.error("My RSVPs error:", err);
    res.status(500).json({ error: "Failed to fetch your RSVPs." });
  }
});

export default router;
