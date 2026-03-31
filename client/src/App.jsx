import { useEffect, useState } from "react";
import { api, apiBaseUrl } from "./api";

// Import components
import DashboardTab from "./components/DashboardTab";
import BatchTab from "./components/BatchTab";
import StudentTab from "./components/StudentTab";
import ClassTab from "./components/ClassTab";
import SessionTab from "./components/SessionTab";
import AttendanceTab from "./components/AttendanceTab";
import QrAttendanceTab from "./components/QrAttendanceTab";
import EvaluationTab from "./components/EvaluationTab";
import ReportTab from "./components/ReportTab";
import NotificationTab from "./components/NotificationTab";
import UserTab from "./components/UserTab";
import RoleLimitTab from "./components/RoleLimitTab";
import MobileAppTab from "./components/MobileAppTab";

const initialForms = {
  login: { email: "", password: "" },
  batch: { name: "", level: "", description: "" },
  student: {
    studentCode: "",
    fullName: "",
    gender: "Perempuan",
    parentName: "",
    parentPhone: "",
    schoolName: "",
    address: "",
    batchId: ""
  },
  classRoom: {
    name: "",
    subject: "",
    room: "",
    scheduleDay: "Senin",
    startTime: "16:00",
    endTime: "18:00",
    batchId: ""
  },
  session: {
    classId: "",
    date: "",
    topic: "",
    notes: ""
  },
  attendance: {
    studentId: "",
    sessionId: "",
    status: "PRESENT",
    note: ""
  },
  user: {
    name: "",
    email: "",
    password: "",
    role: "STAFF"
  },
  qr: {
    sessionId: ""
  },
  qrScan: {
    studentId: "",
    code: ""
  },
  evaluation: {
    studentId: "",
    sessionId: "",
    disciplineScore: "GOOD",
    focusScore: "GOOD",
    participationScore: "GOOD",
    homeworkScore: "GOOD",
    summary: "",
    recommendation: ""
  }
};

const roleNameMap = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STAFF: "Staf",
  INSTRUCTOR: "Pengajar"
};

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [forms, setForms] = useState(initialForms);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: null,
    recentAttendances: [],
    roleAccess: null,
    allRoles: {},
    users: [],
    batches: [],
    students: [],
    classes: [],
    sessions: [],
    attendance: [],
    evaluations: [],
    evaluationSummary: [],
    notifications: [],
    reportRows: []
  });
  const [qrPreview, setQrPreview] = useState(null);

  const access = user?.access || data.roleAccess || {};

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.me();
        setUser(me.user);
        await loadAppData();
      } catch (_err) {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadAppData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        dashboard,
        roleAccess,
        batches,
        students,
        classes,
        sessions,
        attendance,
        evaluations,
        evaluationSummary
      ] = await Promise.all([
        api.dashboard(),
        api.roleAccess(),
        api.batches(),
        api.students(),
        api.classes(),
        api.sessions(),
        api.attendance(),
        api.evaluations(),
        api.evaluationSummary()
      ]);

      let users = [];
      let notifications = [];
      let reportRows = [];

      try {
        const [usersResponse, notificationsResponse, reportResponse] = await Promise.all([
          api.users(),
          api.notifications(),
          api.attendanceReport()
        ]);
        users = usersResponse.users;
        notifications = notificationsResponse.notifications;
        reportRows = reportResponse.rows;
      } catch (_err) {
        users = [];
        notifications = [];
        reportRows = [];
      }

      setData({
        stats: dashboard.stats,
        recentAttendances: dashboard.recentAttendances,
        roleAccess: roleAccess.currentAccess,
        allRoles: roleAccess.allRoles,
        users,
        batches: batches.batches,
        students: students.students,
        classes: classes.classes,
        sessions: sessions.sessions,
        attendance: attendance.attendance,
        evaluations: evaluations.evaluations,
        evaluationSummary: evaluationSummary.summary,
        notifications,
        reportRows
      });

      setForms((current) => ({
        ...current,
        student: {
          ...current.student,
          batchId: batches.batches[0]?.id || ""
        },
        classRoom: {
          ...current.classRoom,
          batchId: batches.batches[0]?.id || ""
        },
        session: {
          ...current.session,
          classId: classes.classes[0]?.id || ""
        },
        attendance: {
          ...current.attendance,
          studentId: students.students[0]?.id || "",
          sessionId: sessions.sessions[0]?.id || ""
        },
        qr: {
          sessionId: sessions.sessions[0]?.id || ""
        },
        qrScan: {
          ...current.qrScan,
          studentId: students.students[0]?.id || ""
        },
        evaluation: {
          ...current.evaluation,
          studentId: students.students[0]?.id || "",
          sessionId: sessions.sessions[0]?.id || ""
        }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const visibleTabs = [{ id: "dashboard", label: "dashboard" }];

  if (access.canManageMasterData) {
    visibleTabs.push(
      { id: "angkatan", label: "angkatan" },
      { id: "siswa", label: "siswa" },
      { id: "kelas", label: "kelas" },
      { id: "sesi", label: "sesi" }
    );
  }

  if (access.canManageAttendance) {
    visibleTabs.push({ id: "absensi", label: "absensi" });
  }
  if (access.canCreateQr) {
    visibleTabs.push({ id: "qr-attendance", label: "qr attendance" });
  }
  if (access.canEvaluate || access.canViewAllEvaluations) {
    visibleTabs.push({ id: "evaluasi", label: "evaluasi" });
  }
  if (access.canExportReports) {
    visibleTabs.push({ id: "laporan", label: "laporan" });
  }
  if (access.canSendNotifications) {
    visibleTabs.push({ id: "notifikasi", label: "notifikasi" });
  }
  if (access.canManageUsers) {
    visibleTabs.push({ id: "pengguna", label: "pengguna" });
  }

  visibleTabs.push({ id: "batasan-role", label: "batasan peran" });
  visibleTabs.push({ id: "mobile", label: "aplikasi seluler" });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const updateForm = (group, field, value) => {
    setForms((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value
      }
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await api.login(forms.login);
      setUser(response.user);
      await loadAppData();
      showToast("Login berhasil.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setQrPreview(null);
    setData({
      stats: null,
      recentAttendances: [],
      roleAccess: null,
      allRoles: {},
      users: [],
      batches: [],
      students: [],
      classes: [],
      sessions: [],
      attendance: [],
      evaluations: [],
      evaluationSummary: [],
      notifications: [],
      reportRows: []
    });
  };

  const submitFactory = (key, action, resetValues, transform) => async (event) => {
    event.preventDefault();
    setError("");

    try {
      const payload = transform ? transform(forms[key]) : forms[key];
      const response = await action(payload);
      if (key === "qr") {
        setQrPreview(response);
      }
      setForms((current) => ({
        ...current,
        [key]: resetValues
      }));
      await loadAppData();
      showToast(response.message || "Data berhasil disimpan.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckout = async (id) => {
    try {
      await api.checkoutAttendance(id);
      await loadAppData();
      showToast("Jam pulang berhasil dicatat.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendNotification = async (attendanceId) => {
    try {
      await api.sendAttendanceNotification({ attendanceId });
      await loadAppData();
      showToast("Notifikasi diproses.");
    } catch (err) {
      setError(err.message);
    }
  };

  const metrics = [
    { label: "Siswa Aktif", value: data.stats?.studentCount ?? 0 },
    { label: "Angkatan Aktif", value: data.stats?.batchCount ?? 0 },
    { label: "Kelas Tersimpan", value: data.stats?.classCount ?? 0 },
    { label: "Hadir Hari Ini", value: data.stats?.todayAttendance ?? 0 },
    { label: "Evaluasi", value: data.stats?.evaluationCount ?? 0 },
    { label: "Notifikasi", value: data.stats?.notificationCount ?? 0 }
  ];

  if (!user) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="hero-badge">Platform Operasional Bimbel</span>
          <h1>Absensi, evaluasi, laporan, QR, dan notifikasi dalam satu sistem.</h1>
          <p>
            Sistem dibuat untuk bimbel angkatan yang butuh operasional lengkap,
            profesional, jelas, dan aman di web maupun aplikasi seluler.
          </p>
          <div className="hero-grid">
            <article>
              <strong>QR Absensi</strong>
              <span>Masuk kelas lebih cepat dengan kode sesi khusus.</span>
            </article>
            <article>
              <strong>PDF & Excel</strong>
              <span>Laporan siap unduh untuk owner dan admin.</span>
            </article>
            <article>
              <strong>Evaluasi Peran</strong>
              <span>Setiap peran tahu batas akses dan tanggung jawabnya.</span>
            </article>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleLogin}>
          <div>
            <p className="eyebrow">Masuk ke sistem</p>
            <h2>Login operator</h2>
            <p className="muted">Masukkan email dan kata sandi akun operasional Anda.</p>
          </div>

          <label>
            Email
            <input
              type="email"
              value={forms.login.email}
              onChange={(event) => updateForm("login", "email", event.target.value)}
            />
          </label>
          <label>
            Kata sandi
            <input
              type="password"
              value={forms.login.password}
              onChange={(event) => updateForm("login", "password", event.target.value)}
            />
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          <button type="submit" className="primary-button">
            Masuk
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="brand-mark">AB</span>
          <div>
            <h2>Absensi Bimbel</h2>
            <p>Suite lengkap operasional angkatan</p>
          </div>
        </div>

        <nav className="nav-list">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="profile-card">
          <strong>{user.name}</strong>
          <span>{roleNameMap[user.role] || user.role}</span>
          <span>{data.roleAccess?.label}</span>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel operasional</p>
            <h1>Dashboard absensi dan evaluasi bimbel</h1>
          </div>
          <button type="button" className="secondary-button" onClick={loadAppData}>
            {loading ? "Memuat..." : "Muat Ulang Data"}
          </button>
        </header>

        {toast ? <div className="toast-box">{toast}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}

        {activeTab === "dashboard" && (
          <DashboardTab
            metrics={metrics}
            recentAttendances={data.recentAttendances}
            roleAccess={data.roleAccess}
            access={access}
          />
        )}

        {activeTab === "angkatan" && (
          <BatchTab
            form={forms.batch}
            onSubmit={submitFactory("batch", api.createBatch, initialForms.batch)}
            updateForm={(field, value) => updateForm("batch", field, value)}
            data={data.batches}
          />
        )}

        {activeTab === "siswa" && (
          <StudentTab
            form={forms.student}
            onSubmit={submitFactory("student", api.createStudent, initialForms.student)}
            updateForm={(field, value) => updateForm("student", field, value)}
            data={data.students}
            batches={data.batches}
          />
        )}

        {activeTab === "kelas" && (
          <ClassTab
            form={forms.classRoom}
            onSubmit={submitFactory("classRoom", api.createClass, initialForms.classRoom)}
            updateForm={(field, value) => updateForm("classRoom", field, value)}
            data={data.classes}
            batches={data.batches}
          />
        )}

        {activeTab === "sesi" && (
          <SessionTab
            form={forms.session}
            onSubmit={submitFactory("session", api.createSession, initialForms.session, (payload) => ({
              ...payload,
              date: new Date(payload.date).toISOString()
            }))}
            updateForm={(field, value) => updateForm("session", field, value)}
            data={data.sessions}
            classes={data.classes}
          />
        )}

        {activeTab === "absensi" && (
          <AttendanceTab
            form={forms.attendance}
            onSubmit={submitFactory("attendance", api.saveAttendance, initialForms.attendance)}
            updateForm={(field, value) => updateForm("attendance", field, value)}
            students={data.students}
            sessions={data.sessions}
            attendance={data.attendance}
            onCheckout={handleCheckout}
            onSendNotification={handleSendNotification}
            canSendNotifications={access.canSendNotifications}
          />
        )}

        {activeTab === "qr-attendance" && (
          <QrAttendanceTab
            form={{ ...forms.qr, ...forms.qrScan }}
            onSubmit={submitFactory("qr", api.createQrSession, initialForms.qr)}
            updateForm={(field, value) => {
              if (field === "studentId" || field === "code") {
                updateForm("qrScan", field, value);
              } else {
                updateForm("qr", field, value);
              }
            }}
            sessions={data.sessions}
            students={data.students}
            qrPreview={qrPreview}
          />
        )}

        {activeTab === "evaluasi" && (
          <EvaluationTab
            form={forms.evaluation}
            onSubmit={submitFactory("evaluation", api.createEvaluation, initialForms.evaluation)}
            updateForm={(field, value) => updateForm("evaluation", field, value)}
            students={data.students}
            sessions={data.sessions}
            evaluationSummary={data.evaluationSummary}
            canEvaluate={access.canEvaluate}
          />
        )}

        {activeTab === "laporan" && (
          <ReportTab reportRows={data.reportRows} />
        )}

        {activeTab === "notifikasi" && (
          <NotificationTab notifications={data.notifications} />
        )}

        {activeTab === "pengguna" && (
          <UserTab
            form={forms.user}
            onSubmit={submitFactory("user", api.createUser, initialForms.user)}
            updateForm={(field, value) => updateForm("user", field, value)}
            users={data.users}
          />
        )}

        {activeTab === "batasan-role" && (
          <RoleLimitTab allRoles={data.allRoles} />
        )}

        {activeTab === "mobile" && (
          <MobileAppTab />
        )}
      </main>
    </div>
  );
}

export default App;