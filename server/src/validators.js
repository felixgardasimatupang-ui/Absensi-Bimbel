import { z } from "zod";

const requiredText = (min, max) => z.string().trim().min(min).max(max);
const optionalText = (max) =>
  z.union([z.literal(""), z.string().trim().max(max)]).optional();

export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128)
  })
  .strict();

export const userSchema = z
  .object({
    name: requiredText(3, 100),
    email: z.string().trim().email(),
    password: z.string().min(12).max(64),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"])
  })
  .strict();

export const batchSchema = z
  .object({
    name: requiredText(2, 100),
    level: requiredText(2, 50),
    description: optionalText(250)
  })
  .strict();

export const studentSchema = z
  .object({
    studentCode: requiredText(3, 30),
    fullName: requiredText(3, 100),
    gender: z.enum(["Laki-laki", "Perempuan"]),
    parentName: requiredText(3, 100),
    parentPhone: z.string().trim().regex(/^\+?[0-9]{8,20}$/),
    schoolName: optionalText(100),
    address: optionalText(250),
    batchId: requiredText(1, 100)
  })
  .strict();

export const classSchema = z
  .object({
    name: requiredText(2, 100),
    subject: requiredText(2, 100),
    room: optionalText(50),
    scheduleDay: requiredText(3, 20),
    startTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
    batchId: requiredText(1, 100)
  })
  .strict();

export const sessionSchema = z
  .object({
    classId: requiredText(1, 100),
    date: z.string().trim().datetime({ offset: true }).or(z.string().trim().date()),
    topic: requiredText(2, 150),
    notes: optionalText(300)
  })
  .strict();

export const attendanceSchema = z
  .object({
    studentId: requiredText(1, 100),
    sessionId: requiredText(1, 100),
    status: z.enum(["PRESENT", "LATE", "EXCUSED", "SICK", "ABSENT"]),
    note: optionalText(250)
  })
  .strict();

export const qrSessionSchema = z
  .object({
    sessionId: requiredText(1, 100),
    expiresAt: z.string().trim().datetime({ offset: true }).optional()
  })
  .strict();

export const qrScanSchema = z
  .object({
    code: z.string().trim().min(10).max(2048),
    studentId: requiredText(1, 100)
  })
  .strict();

export const evaluationSchema = z
  .object({
    studentId: requiredText(1, 100),
    sessionId: requiredText(1, 100),
    disciplineScore: z.enum(["NEEDS_SUPPORT", "DEVELOPING", "GOOD", "EXCELLENT"]),
    focusScore: z.enum(["NEEDS_SUPPORT", "DEVELOPING", "GOOD", "EXCELLENT"]),
    participationScore: z.enum(["NEEDS_SUPPORT", "DEVELOPING", "GOOD", "EXCELLENT"]),
    homeworkScore: z.enum(["NEEDS_SUPPORT", "DEVELOPING", "GOOD", "EXCELLENT"]),
    summary: requiredText(10, 350),
    recommendation: optionalText(350)
  })
  .strict();

export const notificationSchema = z
  .object({
    attendanceId: requiredText(1, 100)
  })
  .strict();
