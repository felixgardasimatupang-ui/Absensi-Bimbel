import express from "express";
import { NotificationStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { notificationSchema } from "../validators.js";
import { buildAttendanceWhatsappMessage, sendWhatsappMessage } from "../whatsapp.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

router.get("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), asyncHandler(async (_req, res) => {
    const notifications = await prisma.notificationLog.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            student: true,
            attendance: true,
            triggeredBy: {
                select: { name: true, role: true }
            }
        }
    });

    res.json({ notifications });
}));

router.post("/attendance", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), validate(notificationSchema), asyncHandler(async (req, res) => {
    const attendance = await prisma.attendance.findUnique({
        where: { id: req.validatedBody.attendanceId },
        include: {
            student: true,
            session: {
                include: {
                    classRoom: true
                }
            }
        }
    });

    if (!attendance) {
        return res.status(404).json({ message: "Data absensi tidak ditemukan." });
    }

    const evaluation = await prisma.evaluation.findUnique({
        where: {
            studentId_sessionId: {
                studentId: attendance.studentId,
                sessionId: attendance.sessionId
            }
        }
    });

    const message = buildAttendanceWhatsappMessage({
        studentName: attendance.student.fullName,
        parentName: attendance.student.parentName,
        className: attendance.session.classRoom.name,
        status: attendance.status,
        topic: attendance.session.topic,
        schedule: formatDateTime(attendance.session.date),
        evaluationSummary: evaluation?.summary || ""
    });

    const delivery = await sendWhatsappMessage({
        phone: attendance.student.parentPhone,
        message
    });

    const notification = await prisma.notificationLog.create({
        data: {
            studentId: attendance.studentId,
            attendanceId: attendance.id,
            triggeredById: req.user.id,
            targetPhone: attendance.student.parentPhone,
            message,
            provider: delivery.provider,
            providerRef: delivery.providerRef || null,
            errorMessage: delivery.error || null,
            status: delivery.ok ? NotificationStatus.SENT : NotificationStatus.FAILED
        }
    });

    res.status(201).json({
        message: delivery.ok
            ? "Notifikasi WhatsApp berhasil dikirim."
            : "Notifikasi dicatat tetapi gagal dikirim ke provider.",
        notification
    });
}));

export default router;