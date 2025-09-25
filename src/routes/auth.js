import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Helper to create JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Hash & create
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed },
      select: { id: true, email: true }
    });

    // Optional: return token on signup (nice DX)
    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    // Prisma unique constraint
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email is already registered." });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const token = signToken(user);
    return res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;
