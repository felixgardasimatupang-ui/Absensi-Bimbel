import express from "express";
import { prisma } from "../db.js";
import { hashPassword } from "../auth.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { userSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
        }
    });

    res.json({ users });
}));

router.post("/", requireAuth, requireRole("SUPER_ADMIN"), validate(userSchema), asyncHandler(async (req, res) => {
    const payload = req.validatedBody;
    const user = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            role: payload.role,
            passwordHash: await hashPassword(payload.password)
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
        }
    });

    res.status(201).json({
        message: "Pengguna berhasil dibuat.",
        user
    });
}));

export default router;