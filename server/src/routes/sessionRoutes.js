import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { sessionSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth, asyncHandler(async (_req, res) => {
    const sessions = await prisma.classSession.findMany({
        orderBy: { date: "desc" },
        include: {
            classRoom: {
                include: {
                    batch: true
                }
            },
            qrSessions: {
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: 1
            },
            _count: {
                select: { attendances: true, evaluations: true }
            }
        }
    });

    res.json({ sessions });
}));

router.post("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(sessionSchema), asyncHandler(async (req, res) => {
    const session = await prisma.classSession.create({
        data: {
            classId: req.validatedBody.classId,
            date: new Date(req.validatedBody.date),
            topic: req.validatedBody.topic,
            notes: req.validatedBody.notes || null
        },
        include: {
            classRoom: true
        }
    });

    res.status(201).json({ message: "Sesi berhasil dibuat.", session });
}));

export default router;