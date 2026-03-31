import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import {
  AttendanceStatus,
  EvaluationScore,
  NotificationStatus
} from "@prisma/client";
import { config } from "./config.js";
import { comparePassword, hashPassword, signToken } from "./auth.js";
import { prisma } from "./db.js";
import {
  apiLimiter,
  authLimiter,
  enforceTrustedOrigin,
  errorHandler,
  notFoundHandler,
  requireAuth,
  requireRole,
  validate
} from "./middleware.js";
import {
  attendanceSchema,
  batchSchema,
  classSchema,
  evaluationSchema,
  loginSchema,
  notificationSchema,
  qrScanSchema,
  qrSessionSchema,
  sessionSchema,
  studentSchema,
  userSchema
} from "./validators.js";
import { createQrCodeValue, buildQrSvg, verifyQrCodeValue } from "./qr.js";
import { createExcelReport, createPdfBuffer } from "./reports.js";
import { buildAttendanceWhatsappMessage, sendWhatsappMessage } from "./whatsapp.js";
import { getRoleAccess, roleAccessMap } from "./permissions.js";

const app = express();
const defaultSecrets = new Set([
  "change-this-to-a-long-random-secret",
  "change-this-to-another-random-secret",
  "change-this-too"
]);

const isMobileClient = (req) => req.get("x-client-platform") === "mobile";
const hasWeakSecrets =
  defaultSecrets.has(config.jwtSecret) || defaultSecrets.has(config.qrSecret);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin tidak diizinkan oleh CORS."));
    },
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(enforceTrustedOrigin);
app.use("/api", apiLimiter);

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  path: "/",
  maxAge: 8 * 60 * 60 * 1000
});

const serializeAuthUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  access: getRoleAccess(user.role)
});

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("id-ID") : "-";

const scoreLabelMap = {
  [EvaluationScore.NEEDS_SUPPORT]: "Perlu Pendampingan",
  [EvaluationScore.DEVELOPING]: "Berkembang",
  [EvaluationScore.GOOD]: "Baik",
  [EvaluationScore.EXCELLENT]: "Sangat Baik"
};

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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/roles/access", requireAuth, (req, res) => {
  res.json({
    currentRole: req.user.role,
    currentAccess: getRoleAccess(req.user.role),
    allRoles: roleAccessMap
  });
});

app.post("/api/auth/bootstrap", async (_req, res, next) => {
  try {
    if (!config.allowBootstrap) {
      return res.status(403).json({
        message: "Bootstrap dinonaktifkan. Aktifkan ALLOW_BOOTSTRAP=true untuk setup awal."
      });
    }

    if (config.bootstrapKey && _req.get("x-bootstrap-key") !== config.bootstrapKey) {
      return res.status(403).json({
        message: "Bootstrap key tidak valid."
      });
    }

    const totalUsers = await prisma.user.count();

    if (totalUsers > 0) {
      return res.status(403).json({
        message: "Bootstrap hanya tersedia saat aplikasi pertama kali dijalankan."
      });
    }

    const admin = await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || "Super Admin",
        email: process.env.ADMIN_EMAIL || "admin@bimbel.local",
        passwordHash: await hashPassword(process.env.ADMIN_PASSWORD || "ChangeMe123!"),
        role: "SUPER_ADMIN"
      }
    });

    res.status(201).json({
      message: "Akun admin awal berhasil dibuat.",
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    if (hasWeakSecrets) {
      return res.status(503).json({
        message: "Server belum aman. Ganti JWT_SECRET dan QR_SECRET sebelum login."
      });
    }

    const { email, password } = req.validatedBody;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const token = signToken(user);
    res.cookie(config.cookieName, token, buildCookieOptions());
    const payload = {
      message: "Login berhasil.",
      user: serializeAuthUser(user),
      authMode: isMobileClient(req) ? "bearer" : "cookie"
    };

    if (isMobileClient(req)) {
      payload.token = token;
    }

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  res.clearCookie(config.cookieName, buildCookieOptions());
  res.json({ message: "Logout berhasil." });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    user: serializeAuthUser(req.user),
    authMode: req.authMethod
  });
});

app.get("/api/dashboard", requireAuth, async (req, res, next) => {
  try {
    const dashboard = await getDashboardData(req.user);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", requireAuth, requireRole("SUPER_ADMIN", "ADMIN"), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", requireAuth, requireRole("SUPER_ADMIN"), validate(userSchema), async (req, res, next) => {
  try {
    const payload = req.validatedBody;
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        passwordHash: await hashPassword(payload.password)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    res.status(201).json({
      message: "Pengguna berhasil dibuat.",
      user
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/batches", requireAuth, async (_req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { students: true, classes: true }
        }
      }
    });

    res.json({ batches });
  } catch (error) {
    next(error);
  }
});

app.post("/api/batches", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), validate(batchSchema), async (req, res, next) => {
  try {
    const batch = await prisma.batch.create({
      data: {
        ...req.validatedBody,
        description: req.validatedBody.description || null
      }
    });

    res.status(201).json({ message: "Angkatan berhasil dibuat.", batch });
  } catch (error) {
    next(error);
  }
});

app.get("/api/students", requireAuth, async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/students", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), validate(studentSchema), async (req, res, next) => {
  try {
    const student = await prisma.student.create({
      data: {
        ...req.validatedBody,
        schoolName: req.validatedBody.schoolName || null,
        address: req.validatedBody.address || null
      },
      include: { batch: true }
    });

    res.status(201).json({ message: "Siswa berhasil ditambahkan.", student });
  } catch (error) {
    next(error);
  }
});

app.get("/api/classes", requireAuth, async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/classes", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(classSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/sessions", requireAuth, async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/sessions", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(sessionSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/attendance", requireAuth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/attendance", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(attendanceSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.patch("/api/attendance/:id/checkout", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), async (req, res, next) => {
  try {
    const attendance = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        checkOutAt: new Date(),
        recordedById: req.user.id
      }
    });

    res.json({ message: "Check-out berhasil.", attendance });
  } catch (error) {
    next(error);
  }
});

app.post("/api/qr/sessions", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(qrSessionSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/qr/sessions/:id", requireAuth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/qr/scan", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF", "INSTRUCTOR"), validate(qrScanSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/evaluations", requireAuth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/evaluations", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "INSTRUCTOR"), validate(evaluationSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/evaluations/summary", requireAuth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/notifications", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.post("/api/notifications/attendance", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), validate(notificationSchema), async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/attendance", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/attendance.xlsx", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/attendance.pdf", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "STAFF"), async (_req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
