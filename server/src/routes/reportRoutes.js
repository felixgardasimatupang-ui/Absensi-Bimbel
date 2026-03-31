import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware.js";
import { createExcelReport, createPdfBuffer } from "../reports.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

const normalizeAttendanceRow = (attendance) => ({
    id: attendance.id,
    studentId: attendance.student.id,
    studentCode: attendance.student.studentCode,
    studentName: attendance.student.fullName,
    batchName: attendance.student.batch.name,
    className: attendance.session.classRoom.name,
    sessionTopic: attendance.session.topic,
    sessionDate: formatDateTime(attendance.session.date),
    status: attendance.status,
    note: attendance.note || "",
    checkInAt: formatDateTime(attendance.checkInAt),
    evaluationSummary: attendance.session.evaluations[0]?.summary || ""
});

router.get("/attendance", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), asyncHandler(async (_req, res) => {
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
                        take: 1
                    }
                }
            }
        }
    });

    res.json({
        rows: attendance.map(normalizeAttendanceRow)
    });
}));

router.get("/attendance.xlsx", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), asyncHandler(async (_req, res) => {
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
                        take: 1
                    }
                }
            }
        }
    });

    const xml = createExcelReport(attendance.map(normalizeAttendanceRow));
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", 'attachment; filename="laporan-absensi.xls"');
    res.send(xml);
}));

router.get("/attendance.pdf", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), asyncHandler(async (_req, res) => {
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
                        take: 1
                    }
                }
            }
        }
    });

    const pdf = createPdfBuffer(
        "Laporan Absensi Bimbel",
        attendance.map(normalizeAttendanceRow)
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="laporan-absensi.pdf"');
    res.send(pdf);
}));

export default router;