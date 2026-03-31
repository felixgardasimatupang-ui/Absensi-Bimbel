import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { batchSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth, asyncHandler(async (_req, res) => {
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { students: true, classes: true }
            }
        }
    });

    res.json({ batches });
}));

router.post("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), validate(batchSchema), asyncHandler(async (req, res) => {
    const batch = await prisma.batch.create({
        data: {
            ...req.validatedBody,
            description: req.validatedBody.description || null
        }
    });

    res.status(201).json({ message: "Angkatan berhasil dibuat.", batch });
}));

export default router;