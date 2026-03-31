import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { attendanceSchema, qrScanSchema, qrSessionSchema } from "../validators.js";
import { config } from "../config.js";
import { createQrCodeValue, buildQrSvg, verifyQrCodeValue } from "../qr.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

// Get all attendance records
router.get("/", requireAuth, asyncHandler(async (req, res) => {
    const attendance = await prisma.attendance.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            student: {
                include: { batch: true }
            },
            session: {
                include: {
                    classRoom: true,
                    evaluations: {
                        where:
                            req.user.role === "INSTRUCTOR"
                                ? { evaluatorId: req.user.id }
                                : undefined,
                        take: 1
                    }
                }
            },
            recordedBy: {
                select: { id: true, name: true, role: true }
            },
            notificationLogs: true
        }
    });

    res.json({ attendance });
}));

// Create/update attendance
router.post("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(attendanceSchema), asyncHandler(async (req, res) => {
    const attendance = await prisma.attendance.upsert({
        where: {
            studentId_sessionId: {
                studentId: req.validatedBody.studentId,
                sessionId: req.validatedBody.sessionId
            }
        },
        create: {
            ...req.validatedBody,
            note: req.validatedBody.note || null,
            checkInAt:
                req.validatedBody.status === "PRESENT" || req.validatedBody.status === "LATE"
                    ? new Date()
                    : null,
            recordedById: req.user.id
        },
        update: {
            status: req.validatedBody.status,
            note: req.validatedBody.note || null,
            checkInAt:
                req.validatedBody.status === "PRESENT" || req.validatedBody.status === "LATE"
                    ? new Date()
                    : null,
            recordedById: req.user.id
        },
        include: {
            student: true,
            session: true
        }
    });

    res.status(201).json({
        message: "Absensi berhasil disimpan.",
        attendance
    });
}));

// Check-out attendance
router.patch("/:id/checkout", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), asyncHandler(async (req, res) => {
    const attendance = await prisma.attendance.update({
        where: { id: req.params.id },
        data: {
            checkOutAt: new Date(),
            recordedById: req.user.id
        }
    });

    res.json({ message: "Check-out berhasil.", attendance });
}));

// QR Session routes
router.post("/qr/sessions", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(qrSessionSchema), asyncHandler(async (req, res) => {
    const expiresAt = req.validatedBody.expiresAt
        ? new Date(req.validatedBody.expiresAt)
        : new Date(Date.now() + config.qrExpiresMinutes * 60 * 1000);

    const qrSession = await prisma.qRSession.create({
        data: {
            sessionId: req.validatedBody.sessionId,
            code: "temp",
            expiresAt,
            createdById: req.user.id
        },
        include: {
            session: {
                include: {
                    classRoom: true
                }
            }
        }
    });

    const code = createQrCodeValue({
        qrId: qrSession.id,
        sessionId: qrSession.sessionId,
        expiresAt: expiresAt.toISOString()
    });

    const saved = await prisma.qRSession.update({
        where: { id: qrSession.id },
        data: { code }
    });

    const svg = buildQrSvg({
        title: qrSession.session.classRoom.name,
        subtitle: `${qrSession.session.topic} • berlaku sampai ${formatDateTime(expiresAt)}`,
        code
    });

    res.status(201).json({
        message: "QR absensi berhasil dibuat.",
        qrSession: saved,
        svg,
        deepLink: `${config.appUrl}/scan?code=${encodeURIComponent(code)}`
    });
}));

router.get("/qr/sessions/:id", requireAuth, asyncHandler(async (req, res) => {
    const qrSession = await prisma.qRSession.findUnique({
        where: { id: req.params.id },
        include: {
            session: {
                include: {
                    classRoom: true
                }
            }
        }
    });

    if (!qrSession) {
        return res.status(404).json({ message: "QR session tidak ditemukan." });
    }

    const svg = buildQrSvg({
        title: qrSession.session.classRoom.name,
        subtitle: `${qrSession.session.topic} • berlaku sampai ${formatDateTime(qrSession.expiresAt)}`,
        code: qrSession.code
    });

    res.json({ qrSession, svg });
}));

// QR Scan
router.post("/qr/scan", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(qrScanSchema), asyncHandler(async (req, res) => {
    const parsed = verifyQrCodeValue(req.validatedBody.code);
    const qrSession = await prisma.qRSession.findUnique({
        where: { id: parsed.qrId }
    });

    if (!qrSession || !qrSession.isActive || qrSession.code !== req.validatedBody.code) {
        return res.status(400).json({ message: "QR attendance tidak valid." });
    }

    if (new Date(qrSession.expiresAt) < new Date()) {
        return res.status(400).json({ message: "QR attendance sudah kedaluwarsa." });
    }

    const attendance = await prisma.attendance.upsert({
        where: {
            studentId_sessionId: {
                studentId: req.validatedBody.studentId,
                sessionId: qrSession.sessionId
            }
        },
        create: {
            studentId: req.validatedBody.studentId,
            sessionId: qrSession.sessionId,
            status: "PRESENT",
            checkInAt: new Date(),
            recordedById: req.user.id,
            note: "Masuk melalui QR attendance"
        },
        update: {
            status: "PRESENT",
            checkInAt: new Date(),
            recordedById: req.user.id,
            note: "Masuk melalui QR attendance"
        }
    });

    res.status(201).json({
        message: "Absensi QR berhasil dicatat.",
        attendance
    });
}));

export default router;