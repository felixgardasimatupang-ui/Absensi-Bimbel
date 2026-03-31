import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { classSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth, asyncHandler(async (_req, res) => {
    const classes = await prisma.classRoom.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            batch: true,
            _count: {
                select: { sessions: true }
            }
        }
    });

    res.json({ classes });
}));

router.post("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(classSchema), asyncHandler(async (req, res) => {
    const classRoom = await prisma.classRoom.create({
        data: {
            ...req.validatedBody,
            room: req.validatedBody.room || null
        },
        include: { batch: true }
    });

    res.status(201).json({
        message: "Kelas berhasil dibuat.",
        classRoom
    });
}));

export default router;