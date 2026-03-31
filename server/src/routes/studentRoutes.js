import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { studentSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth, asyncHandler(async (_req, res) => {
    const students = await prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            batch: true,
            evaluations: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });

    res.json({ students });
}));

router.post("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), validate(studentSchema), asyncHandler(async (req, res) => {
    const student = await prisma.student.create({
        data: {
            ...req.validatedBody,
            schoolName: req.validatedBody.schoolName || null,
            address: req.validatedBody.address || null
        },
        include: { batch: true }
    });

    res.status(201).json({ message: "Siswa berhasil ditambahkan.", student });
}));

export default router;