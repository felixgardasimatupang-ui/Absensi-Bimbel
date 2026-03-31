import express from "express";
import { AttendanceStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware.js";
import { getRoleAccess } from "../permissions.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const getDashboardData = async (user) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [studentCount, batchCount, classCount, todaySessionCount, todayAttendance, evaluationCount, notificationCount] =
        await Promise.all([
            prisma.student.count({ where: { isActive: true } }),
            prisma.batch.count({ where: { isActive: true } }),
            prisma.classRoom.count(),
            prisma.classSession.count({
                where: { date: { gte: today } }
            }),
            prisma.attendance.count({
                where: {
                    createdAt: { gte: today },
                    status: AttendanceStatus.PRESENT
                }
            }),
            prisma.evaluation.count({
                where:
                    user.role === "INSTRUCTOR"
                        ? { evaluatorId: user.id }
                        : undefined
            }),
            prisma.notificationLog.count()
        ]);

    const recentAttendances = await prisma.attendance.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
            student: {
                include: { batch: true }
            },
            session: {
                include: {
                    classRoom: true,
                    evaluations: true
                }
            }
        }
    });

    return {
        stats: {
            studentCount,
            batchCount,
            classCount,
            todaySessionCount,
            todayAttendance,
            evaluationCount,
            notificationCount
        },
        recentAttendances,
        roleAccess: getRoleAccess(user.role)
    };
};

router.get("/", requireAuth, asyncHandler(async (req, res) => {
    const dashboard = await getDashboardData(req.user);
    res.json(dashboard);
}));

export default router;