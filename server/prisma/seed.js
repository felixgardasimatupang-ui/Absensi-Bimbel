import path from "path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const { PrismaClient } = await import("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const demoPassword = process.env.DEMO_PASSWORD || "DemoAkun123!";
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const demoUsers = [
    {
      name: process.env.ADMIN_NAME || "Super Admin",
      email: process.env.ADMIN_EMAIL || "superadmin@bimbel.local",
      role: "SUPER_ADMIN"
    },
    {
      name: "Admin Operasional",
      email: "admin@bimbel.local",
      role: "ADMIN"
    },
    {
      name: "Staf Operasional",
      email: "staff@bimbel.local",
      role: "STAFF"
    },
    {
      name: "Pengajar Demo",
      email: "pengajar@bimbel.local",
      role: "INSTRUCTOR"
    }
  ];

  const users = await Promise.all(
    demoUsers.map((item) =>
      prisma.user.upsert({
        where: { email: item.email },
        update: {
          name: item.name,
          passwordHash,
          role: item.role
        },
        create: {
          name: item.name,
          email: item.email,
          passwordHash,
          role: item.role
        }
      })
    )
  );

  const admin =
    users.find((item) => item.role === "SUPER_ADMIN") || users[0];
  const adminUser = users.find((item) => item.role === "ADMIN") || admin;
  const staffUser = users.find((item) => item.role === "STAFF") || admin;
  const instructorUser = users.find((item) => item.role === "INSTRUCTOR") || admin;

  const batchSeeds = [
    {
      id: "seed-batch-smp-reguler",
      name: "Angkatan Reguler 2026",
      level: "SMP",
      description: "Program reguler sore untuk siswa SMP."
    },
    {
      id: "seed-batch-sd-fokus",
      name: "Angkatan Fokus Dasar 2026",
      level: "SD",
      description: "Pendampingan konsep dasar numerasi dan literasi."
    },
    {
      id: "seed-batch-sma-utbk",
      name: "Angkatan Intensif UTBK 2026",
      level: "SMA",
      description: "Persiapan intensif UTBK dengan latihan terstruktur."
    }
  ];

  const batches = await Promise.all(
    batchSeeds.map((item) =>
      prisma.batch.upsert({
        where: { id: item.id },
        update: item,
        create: item
      })
    )
  );

  const batchById = Object.fromEntries(batches.map((item) => [item.id, item]));

  const studentSeeds = [
    ["STD001", "Alya Putri", "Perempuan", "Budi Putra", "081234567890", "SMP Negeri 1", "Jakarta Timur", "seed-batch-smp-reguler"],
    ["STD002", "Raka Pratama", "Laki-laki", "Dian Pratama", "081234567891", "SMP Negeri 5", "Bekasi", "seed-batch-smp-reguler"],
    ["STD003", "Nabila Salsabila", "Perempuan", "Rini Salsabila", "081234567892", "SMP Islam Terpadu", "Depok", "seed-batch-smp-reguler"],
    ["STD004", "Fikri Maulana", "Laki-laki", "Joko Maulana", "081234567893", "SMP Negeri 12", "Jakarta Selatan", "seed-batch-smp-reguler"],
    ["STD005", "Tasya Maharani", "Perempuan", "Sari Maharani", "081234567894", "SD Negeri 03", "Bogor", "seed-batch-sd-fokus"],
    ["STD006", "Arkan Wijaya", "Laki-laki", "Dwi Wijaya", "081234567895", "SD Negeri 08", "Jakarta Barat", "seed-batch-sd-fokus"],
    ["STD007", "Cinta Ramadhani", "Perempuan", "Rama Dhani", "081234567896", "SD Islam Harapan", "Tangerang", "seed-batch-sd-fokus"],
    ["STD008", "Bima Adyatma", "Laki-laki", "Bayu Adyatma", "081234567897", "SD Negeri 09", "Bekasi", "seed-batch-sd-fokus"],
    ["STD009", "Keisha Anindita", "Perempuan", "Tono Anindita", "081234567898", "SMA Negeri 2", "Jakarta Utara", "seed-batch-sma-utbk"],
    ["STD010", "Rizky Firmansyah", "Laki-laki", "Yudi Firmansyah", "081234567899", "SMA Negeri 4", "Bekasi", "seed-batch-sma-utbk"],
    ["STD011", "Mikaila Azzahra", "Perempuan", "Nadia Azzahra", "081234567880", "SMA Labschool", "Jakarta Selatan", "seed-batch-sma-utbk"],
    ["STD012", "Farrel Gunawan", "Laki-laki", "Gita Gunawan", "081234567881", "SMA Negeri 6", "Depok", "seed-batch-sma-utbk"]
  ];

  const students = await Promise.all(
    studentSeeds.map(
      ([
        studentCode,
        fullName,
        gender,
        parentName,
        parentPhone,
        schoolName,
        address,
        batchKey
      ]) =>
        prisma.student.upsert({
          where: { studentCode },
          update: {
            fullName,
            gender,
            parentName,
            parentPhone,
            schoolName,
            address,
            batchId: batchById[batchKey].id
          },
          create: {
            studentCode,
            fullName,
            gender,
            parentName,
            parentPhone,
            schoolName,
            address,
            batchId: batchById[batchKey].id
          }
        })
    )
  );

  const studentByCode = Object.fromEntries(students.map((item) => [item.studentCode, item]));

  const classSeeds = [
    ["seed-class-matematika-smp", "Matematika Intensif SMP", "Matematika", "Ruang A", "Senin", "16:00", "18:00", "seed-batch-smp-reguler"],
    ["seed-class-bahasa-smp", "Bahasa Inggris SMP", "Bahasa Inggris", "Ruang B", "Rabu", "16:00", "18:00", "seed-batch-smp-reguler"],
    ["seed-class-numerasi-sd", "Numerasi Dasar SD", "Matematika Dasar", "Ruang C", "Selasa", "15:30", "17:00", "seed-batch-sd-fokus"],
    ["seed-class-literasi-sd", "Literasi Aktif SD", "Bahasa Indonesia", "Ruang D", "Kamis", "15:30", "17:00", "seed-batch-sd-fokus"],
    ["seed-class-utbk-mtk", "UTBK Matematika", "Matematika Lanjut", "Ruang E", "Jumat", "18:30", "20:30", "seed-batch-sma-utbk"],
    ["seed-class-utbk-twk", "Penalaran Verbal UTBK", "Literasi", "Ruang F", "Sabtu", "10:00", "12:00", "seed-batch-sma-utbk"]
  ];

  const classes = await Promise.all(
    classSeeds.map(
      ([id, name, subject, room, scheduleDay, startTime, endTime, batchKey]) =>
        prisma.classRoom.upsert({
          where: { id },
          update: {
            name,
            subject,
            room,
            scheduleDay,
            startTime,
            endTime,
            batchId: batchById[batchKey].id
          },
          create: {
            id,
            name,
            subject,
            room,
            scheduleDay,
            startTime,
            endTime,
            batchId: batchById[batchKey].id
          }
        })
    )
  );

  const classById = Object.fromEntries(classes.map((item) => [item.id, item]));

  // Bersihkan sisa seed versi lama agar master data tidak dobel.
  await prisma.classRoom.deleteMany({
    where: {
      id: {
        in: ["seed-class-matematika"]
      }
    }
  });
  await prisma.batch.deleteMany({
    where: {
      id: {
        in: ["seed-batch-utama"]
      }
    }
  });

  const now = Date.now();
  const makeDate = (dayOffset, hour, minute = 0) => {
    const value = new Date(now + dayOffset * 24 * 60 * 60 * 1000);
    value.setHours(hour, minute, 0, 0);
    return value;
  };

  const sessionSeeds = [
    ["seed-session-1", "seed-class-matematika-smp", makeDate(-5, 16), "Bilangan dan Pecahan", "Pembahasan pecahan campuran dan desimal."],
    ["seed-session-2", "seed-class-matematika-smp", makeDate(1, 16), "Persamaan Linear", "Sesi latihan bertahap dengan soal kontekstual."],
    ["seed-session-3", "seed-class-bahasa-smp", makeDate(-3, 16), "Reading Comprehension", "Analisis teks pendek dan latihan inferensi."],
    ["seed-session-4", "seed-class-bahasa-smp", makeDate(3, 16), "Vocabulary Drill", "Penguatan kosakata akademik tingkat SMP."],
    ["seed-session-5", "seed-class-numerasi-sd", makeDate(-2, 15, 30), "Penjumlahan Bertingkat", "Latihan numerasi dasar dengan media visual."],
    ["seed-session-6", "seed-class-literasi-sd", makeDate(2, 15, 30), "Menyusun Kalimat", "Latihan membaca dan menyusun kalimat sederhana."],
    ["seed-session-7", "seed-class-utbk-mtk", makeDate(-1, 18, 30), "Fungsi dan Grafik", "Pendalaman konsep fungsi dan interpretasi grafik."],
    ["seed-session-8", "seed-class-utbk-twk", makeDate(4, 10), "Penalaran Teks", "Strategi memahami bacaan panjang dengan cepat."]
  ];

  const sessions = await Promise.all(
    sessionSeeds.map(([id, classId, date, topic, notes]) =>
      prisma.classSession.upsert({
        where: { id },
        update: {
          classId,
          date,
          topic,
          notes
        },
        create: {
          id,
          classId,
          date,
          topic,
          notes
        }
      })
    )
  );

  const sessionById = Object.fromEntries(sessions.map((item) => [item.id, item]));

  const attendanceSeeds = [
    ["STD001", "seed-session-1", "PRESENT", admin.id, "Hadir tepat waktu", true],
    ["STD002", "seed-session-1", "LATE", staffUser.id, "Datang 10 menit setelah mulai", true],
    ["STD003", "seed-session-1", "PRESENT", staffUser.id, "Aktif selama kelas", true],
    ["STD004", "seed-session-1", "EXCUSED", adminUser.id, "Izin kegiatan sekolah", false],
    ["STD001", "seed-session-3", "PRESENT", adminUser.id, "Mengerjakan latihan mandiri", true],
    ["STD002", "seed-session-3", "SICK", staffUser.id, "Sakit demam", false],
    ["STD003", "seed-session-3", "PRESENT", staffUser.id, "Menyelesaikan latihan dengan baik", true],
    ["STD004", "seed-session-3", "ABSENT", adminUser.id, "Tidak ada konfirmasi", false],
    ["STD005", "seed-session-5", "PRESENT", staffUser.id, "Percaya diri saat berhitung", true],
    ["STD006", "seed-session-5", "PRESENT", adminUser.id, "Butuh pendampingan ringan", true],
    ["STD007", "seed-session-5", "LATE", staffUser.id, "Terlambat karena macet", true],
    ["STD008", "seed-session-5", "PRESENT", admin.id, "Sangat antusias", true],
    ["STD009", "seed-session-7", "PRESENT", admin.id, "Menyelesaikan seluruh soal", true],
    ["STD010", "seed-session-7", "PRESENT", instructorUser.id, "Diskusi aktif", true],
    ["STD011", "seed-session-7", "LATE", instructorUser.id, "Terlambat 5 menit", true],
    ["STD012", "seed-session-7", "EXCUSED", adminUser.id, "Izin tryout sekolah", false]
  ];

  for (const [studentCode, sessionId, status, recordedById, note, checkedOut] of attendanceSeeds) {
    const session = sessionById[sessionId];
    const checkInAt =
      status === "PRESENT" || status === "LATE"
        ? new Date(new Date(session.date).getTime() + 10 * 60 * 1000)
        : null;

    await prisma.attendance.upsert({
      where: {
        studentId_sessionId: {
          studentId: studentByCode[studentCode].id,
          sessionId: session.id
        }
      },
      update: {
        status,
        note,
        recordedById,
        checkInAt,
        checkOutAt: checkedOut && checkInAt ? new Date(checkInAt.getTime() + 110 * 60 * 1000) : null
      },
      create: {
        studentId: studentByCode[studentCode].id,
        sessionId: session.id,
        status,
        note,
        recordedById,
        checkInAt,
        checkOutAt: checkedOut && checkInAt ? new Date(checkInAt.getTime() + 110 * 60 * 1000) : null
      }
    });
  }

  const evaluationSeeds = [
    ["STD001", "seed-session-1", instructorUser.id, "GOOD", "EXCELLENT", "GOOD", "DEVELOPING", "Alya aktif bertanya dan cukup fokus selama sesi berlangsung.", "Latih kembali soal pecahan di rumah."],
    ["STD002", "seed-session-1", instructorUser.id, "GOOD", "GOOD", "GOOD", "GOOD", "Raka memahami konsep inti, tetapi perlu membenahi manajemen waktu.", "Kerjakan 10 soal latihan tambahan."],
    ["STD003", "seed-session-3", instructorUser.id, "EXCELLENT", "GOOD", "EXCELLENT", "GOOD", "Nabila sangat kuat pada pemahaman bacaan dan kosakata baru.", "Pertahankan ritme membaca harian."],
    ["STD005", "seed-session-5", instructorUser.id, "GOOD", "GOOD", "GOOD", "GOOD", "Tasya mampu mengikuti langkah berhitung dengan baik.", "Ulangi latihan numerasi dasar 15 menit per hari."],
    ["STD006", "seed-session-5", instructorUser.id, "DEVELOPING", "GOOD", "GOOD", "DEVELOPING", "Arkan butuh penguatan pada ketelitian saat menghitung bertingkat.", "Gunakan kartu angka untuk latihan di rumah."],
    ["STD009", "seed-session-7", instructorUser.id, "EXCELLENT", "EXCELLENT", "GOOD", "GOOD", "Keisha stabil, cepat memahami pola fungsi, dan aktif berdiskusi.", "Mulai kerjakan soal campuran UTBK tingkat lanjut."],
    ["STD010", "seed-session-7", instructorUser.id, "GOOD", "GOOD", "EXCELLENT", "GOOD", "Rizky sangat komunikatif dan progresnya konsisten.", "Tingkatkan ketelitian pada grafik fungsi."],
    ["STD011", "seed-session-7", instructorUser.id, "GOOD", "DEVELOPING", "GOOD", "GOOD", "Mikaila memahami konsep, namun fokus sempat turun di tengah sesi.", "Gunakan teknik ringkas catatan per subtopik."]
  ];

  for (const [studentCode, sessionId, evaluatorId, disciplineScore, focusScore, participationScore, homeworkScore, summary, recommendation] of evaluationSeeds) {
    await prisma.evaluation.upsert({
      where: {
        studentId_sessionId: {
          studentId: studentByCode[studentCode].id,
          sessionId: sessionById[sessionId].id
        }
      },
      update: {
        evaluatorId,
        disciplineScore,
        focusScore,
        participationScore,
        homeworkScore,
        summary,
        recommendation
      },
      create: {
        studentId: studentByCode[studentCode].id,
        sessionId: sessionById[sessionId].id,
        evaluatorId,
        disciplineScore,
        focusScore,
        participationScore,
        homeworkScore,
        summary,
        recommendation
      }
    });
  }

  const qrSeeds = [
    ["seed-qr-1", "seed-session-2", "seed-qr-demo-1", admin.id, new Date(makeDate(1, 18).getTime())],
    ["seed-qr-2", "seed-session-6", "seed-qr-demo-2", staffUser.id, new Date(makeDate(2, 17).getTime())],
    ["seed-qr-3", "seed-session-8", "seed-qr-demo-3", instructorUser.id, new Date(makeDate(4, 12).getTime())]
  ];

  for (const [id, sessionId, code, createdById, expiresAt] of qrSeeds) {
    await prisma.qRSession.upsert({
      where: { id },
      update: {
        sessionId: sessionById[sessionId].id,
        code,
        expiresAt,
        createdById,
        isActive: true
      },
      create: {
        id,
        sessionId: sessionById[sessionId].id,
        code,
        expiresAt,
        createdById,
        isActive: true
      }
    });
  }

  const attendanceRecords = await prisma.attendance.findMany({
    include: {
      student: true,
      session: {
        include: {
          classRoom: true
        }
      }
    }
  });

  const attendanceByKey = Object.fromEntries(
    attendanceRecords.map((item) => [`${item.student.studentCode}-${item.sessionId}`, item])
  );

  const notificationSeeds = [
    ["seed-notif-1", "STD001", "seed-session-1", adminUser.id, "081234567890", "SENT", "WHATSAPP_SIMULATOR", "MSG-001", null, "Notifikasi kehadiran berhasil dikirim."],
    ["seed-notif-2", "STD002", "seed-session-1", staffUser.id, "081234567891", "SENT", "WHATSAPP_SIMULATOR", "MSG-002", null, "Status terlambat sudah diinformasikan ke orang tua."],
    ["seed-notif-3", "STD004", "seed-session-3", adminUser.id, "081234567893", "FAILED", "DISABLED", null, "WHATSAPP_API_URL belum diatur.", "Notifikasi gagal karena integrasi WhatsApp belum aktif."],
    ["seed-notif-4", "STD009", "seed-session-7", staffUser.id, "081234567898", "SENT", "WHATSAPP_SIMULATOR", "MSG-004", null, "Evaluasi singkat dan kehadiran sudah dikirim."]
  ];

  for (const [id, studentCode, sessionId, triggeredById, targetPhone, status, provider, providerRef, errorMessage, message] of notificationSeeds) {
    const attendance = attendanceByKey[`${studentCode}-${sessionById[sessionId].id}`];

    await prisma.notificationLog.upsert({
      where: { id },
      update: {
        studentId: studentByCode[studentCode].id,
        attendanceId: attendance?.id || null,
        triggeredById,
        targetPhone,
        message,
        status,
        provider,
        providerRef,
        errorMessage
      },
      create: {
        id,
        studentId: studentByCode[studentCode].id,
        attendanceId: attendance?.id || null,
        triggeredById,
        targetPhone,
        message,
        status,
        provider,
        providerRef,
        errorMessage
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
