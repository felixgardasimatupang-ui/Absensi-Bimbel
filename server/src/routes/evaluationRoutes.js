import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { evaluationSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
    const evaluations = await prisma.evaluation.findMany({
        where:
            req.user.role === "INSTRUCTOR"
                ? { evaluatorId: req.user.id }
                : undefined,
        orderBy: { createdAt: "desc" },
        include: {
            student: true,
            session: {
                include: {
                    classRoom: true
                }
            },
            evaluator: {
                select: { id: true, name: true, role: true }
            }
        }
    });

    res.json({ evaluations });
}));

router.post("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "INSTRUCTOR"), validate(evaluationSchema), asyncHandler(async (req, res) => {
    const evaluation = await prisma.evaluation.upsert({
        where: {
            studentId_sessionId: {
                studentId: req.validatedBody.studentId,
                sessionId: req.validatedBody.sessionId
            }
        },
        create: {
            ...req.validatedBody,
            evaluatorId: req.user.id,
            recommendation: req.validatedBody.recommendation || null
        },
        update: {
            ...req.validatedBody,
            evaluatorId: req.user.id,
            recommendation: req.validatedBody.recommendation || null
        },
        include: {
            student: true,
            session: {
                include: {
                    classRoom: true
                }
            }
        }
    });

    res.status(201).json({
        message: "Evaluasi berhasil disimpan.",
        evaluation
    });
}));

router.get("/summary", requireAuth, asyncHandler(async (req, res) => {
    const evaluations = await prisma.evaluation.findMany({
        where:
            req.user.role === "INSTRUCTOR"
                ? { evaluatorId: req.user.id }
                : undefined,
        include: {
            student: true,
            session: {
                include: {
                    classRoom: true
                }
            }
        }
    });

    const summaryByStudent = evaluations.reduce((accumulator, item) => {
        const current = accumulator[item.studentId] || {
            studentId: item.studentId,
            studentName: item.student.fullName,
            latestClass: item.session.classRoom.name,
            total: 0,
            goodOrAbove: 0
        };

        const scores = [
            item.disciplineScore,
            item.focusScore,
            item.participationScore,
            item.homeworkScore
        ];

        current.total += scores.length;
        current.goodOrAbove += scores.filter(
            (score) => score === "GOOD" || score === "EXCELLENT"
        ).length;
        accumulator[item.studentId] = current;
        return accumulator;
    }, {});

    res.json({
        summary: Object.values(summaryByStudent).map((item) => ({
            ...item,
            progressPercent: item.total ? Math.round((item.goodOrAbove / item.total) * 100) : 0
        }))
    });
}));

export default router;