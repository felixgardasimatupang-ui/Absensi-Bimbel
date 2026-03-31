import { useEffect, useState } from "react";
import { api, apiBaseUrl } from "./api";

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

const dayOptions = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const attendanceOptions = [
  { value: "PRESENT", label: "Hadir" },
  { value: "LATE", label: "Terlambat" },
  { value: "EXCUSED", label: "Izin" },
  { value: "SICK", label: "Sakit" },
  { value: "ABSENT", label: "Alpha" }
];
const evaluationOptions = [
  { value: "NEEDS_SUPPORT", label: "Perlu Pendampingan" },
  { value: "DEVELOPING", label: "Berkembang" },
  { value: "GOOD", label: "Baik" },
  { value: "EXCELLENT", label: "Sangat Baik" }
];
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

        {activeTab === "dashboard" ? (
          <>
            <section className="metric-grid metric-grid-six">
              {metrics.map((item) => (
                <article key={item.label} className="metric-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </section>
            <section className="panel-grid">
              <article className="panel-card">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Aktivitas terbaru</p>
                    <h3>Absensi terakhir</h3>
                  </div>
                </div>
                <div className="stack-list">
                  {data.recentAttendances.map((item) => (
                    <div className="list-row" key={item.id}>
                      <div>
                        <strong>{item.student.fullName}</strong>
                        <span>
                          {item.session.classRoom.name} • {item.status}
                        </span>
                      </div>
                      <small>{new Date(item.createdAt).toLocaleString("id-ID")}</small>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel-card accent-card">
                <p className="eyebrow">Ringkasan peran aktif</p>
                <h3>{data.roleAccess?.label}</h3>
                <ul className="feature-list">
                  <li>Kelola master data: {access.canManageMasterData ? "Ya" : "Tidak"}</li>
                  <li>Kelola absensi: {access.canManageAttendance ? "Ya" : "Tidak"}</li>
                  <li>Buat QR absensi: {access.canCreateQr ? "Ya" : "Tidak"}</li>
                  <li>Ekspor laporan: {access.canExportReports ? "Ya" : "Tidak"}</li>
                  <li>Kirim notifikasi: {access.canSendNotifications ? "Ya" : "Tidak"}</li>
                </ul>
              </article>
            </section>
          </>
        ) : null}

        {activeTab === "angkatan" ? (
          <SectionMaster
            title="Tambah angkatan"
            subtitle="Master angkatan"
            onSubmit={submitFactory("batch", api.createBatch, initialForms.batch)}
            form={
              <>
                <label>
                  Nama angkatan
                  <input value={forms.batch.name} onChange={(e) => updateForm("batch", "name", e.target.value)} />
                </label>
                <label>
                  Jenjang
                  <input value={forms.batch.level} onChange={(e) => updateForm("batch", "level", e.target.value)} />
                </label>
                <label>
                  Keterangan
                  <textarea value={forms.batch.description} onChange={(e) => updateForm("batch", "description", e.target.value)} />
                </label>
              </>
            }
            button="Simpan Angkatan"
            table={
              <SimpleTable
                headers={["Nama", "Jenjang", "Siswa", "Kelas"]}
                rows={data.batches.map((item) => [item.name, item.level, item._count.students, item._count.classes])}
              />
            }
          />
        ) : null}

        {activeTab === "siswa" ? (
          <SectionMaster
            title="Tambah siswa baru"
            subtitle="Master siswa"
            onSubmit={submitFactory("student", api.createStudent, initialForms.student)}
            form={
              <>
                <div className="field-grid">
                  <label>
                    Kode siswa
                    <input value={forms.student.studentCode} onChange={(e) => updateForm("student", "studentCode", e.target.value)} />
                  </label>
                  <label>
                    Nama lengkap
                    <input value={forms.student.fullName} onChange={(e) => updateForm("student", "fullName", e.target.value)} />
                  </label>
                  <label>
                    Jenis kelamin
                    <select value={forms.student.gender} onChange={(e) => updateForm("student", "gender", e.target.value)}>
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </label>
                  <label>
                    Angkatan
                    <select value={forms.student.batchId} onChange={(e) => updateForm("student", "batchId", e.target.value)}>
                      {data.batches.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Nama orang tua
                    <input value={forms.student.parentName} onChange={(e) => updateForm("student", "parentName", e.target.value)} />
                  </label>
                  <label>
                    Nomor orang tua
                    <input value={forms.student.parentPhone} onChange={(e) => updateForm("student", "parentPhone", e.target.value)} />
                  </label>
                </div>
                <label>
                  Sekolah
                  <input value={forms.student.schoolName} onChange={(e) => updateForm("student", "schoolName", e.target.value)} />
                </label>
                <label>
                  Alamat
                  <textarea value={forms.student.address} onChange={(e) => updateForm("student", "address", e.target.value)} />
                </label>
              </>
            }
            button="Simpan Siswa"
            table={
              <SimpleTable
                headers={["Kode", "Nama", "Angkatan", "Orang Tua", "Evaluasi Terakhir"]}
                rows={data.students.map((item) => [
                  item.studentCode,
                  item.fullName,
                  item.batch.name,
                  item.parentPhone,
                  item.evaluations[0]?.summary || "-"
                ])}
              />
            }
          />
        ) : null}

        {activeTab === "kelas" ? (
          <SectionMaster
            title="Buat kelas les"
            subtitle="Master kelas"
            onSubmit={submitFactory("classRoom", api.createClass, initialForms.classRoom)}
            form={
              <>
                <div className="field-grid">
                  <label>
                    Nama kelas
                    <input value={forms.classRoom.name} onChange={(e) => updateForm("classRoom", "name", e.target.value)} />
                  </label>
                  <label>
                    Mapel
                    <input value={forms.classRoom.subject} onChange={(e) => updateForm("classRoom", "subject", e.target.value)} />
                  </label>
                  <label>
                    Ruangan
                    <input value={forms.classRoom.room} onChange={(e) => updateForm("classRoom", "room", e.target.value)} />
                  </label>
                  <label>
                    Hari
                    <select value={forms.classRoom.scheduleDay} onChange={(e) => updateForm("classRoom", "scheduleDay", e.target.value)}>
                      {dayOptions.map((day) => <option key={day}>{day}</option>)}
                    </select>
                  </label>
                  <label>
                    Mulai
                    <input type="time" value={forms.classRoom.startTime} onChange={(e) => updateForm("classRoom", "startTime", e.target.value)} />
                  </label>
                  <label>
                    Selesai
                    <input type="time" value={forms.classRoom.endTime} onChange={(e) => updateForm("classRoom", "endTime", e.target.value)} />
                  </label>
                </div>
                <label>
                  Angkatan
                  <select value={forms.classRoom.batchId} onChange={(e) => updateForm("classRoom", "batchId", e.target.value)}>
                    {data.batches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              </>
            }
            button="Simpan Kelas"
            table={
              <SimpleTable
                headers={["Kelas", "Mapel", "Angkatan", "Jadwal"]}
                rows={data.classes.map((item) => [
                  item.name,
                  item.subject,
                  item.batch.name,
                  `${item.scheduleDay}, ${item.startTime} - ${item.endTime}`
                ])}
              />
            }
          />
        ) : null}

        {activeTab === "sesi" ? (
          <SectionMaster
            title="Tambah sesi les"
            subtitle="Sesi pembelajaran"
            onSubmit={submitFactory("session", api.createSession, initialForms.session, (payload) => ({
              ...payload,
              date: new Date(payload.date).toISOString()
            }))}
            form={
              <>
                <label>
                  Kelas
                  <select value={forms.session.classId} onChange={(e) => updateForm("session", "classId", e.target.value)}>
                    {data.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label>
                  Waktu sesi
                  <input type="datetime-local" value={forms.session.date} onChange={(e) => updateForm("session", "date", e.target.value)} />
                </label>
                <label>
                  Topik
                  <input value={forms.session.topic} onChange={(e) => updateForm("session", "topic", e.target.value)} />
                </label>
                <label>
                  Catatan
                  <textarea value={forms.session.notes} onChange={(e) => updateForm("session", "notes", e.target.value)} />
                </label>
              </>
            }
            button="Simpan Sesi"
            table={
              <SimpleTable
                headers={["Kelas", "Tanggal", "Topik", "QR Aktif", "Evaluasi"]}
                rows={data.sessions.map((item) => [
                  item.classRoom.name,
                  new Date(item.date).toLocaleString("id-ID"),
                  item.topic,
                  item.qrSessions[0] ? "Tersedia" : "-",
                  item._count.evaluations
                ])}
              />
            }
          />
        ) : null}

        {activeTab === "absensi" ? (
          <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={submitFactory("attendance", api.saveAttendance, initialForms.attendance)}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Input absensi</p>
                  <h3>Catat kehadiran siswa</h3>
                </div>
              </div>
              <label>
                Siswa
                <select value={forms.attendance.studentId} onChange={(e) => updateForm("attendance", "studentId", e.target.value)}>
                  {data.students.map((item) => <option key={item.id} value={item.id}>{item.studentCode} - {item.fullName}</option>)}
                </select>
              </label>
              <label>
                Sesi
                <select value={forms.attendance.sessionId} onChange={(e) => updateForm("attendance", "sessionId", e.target.value)}>
                  {data.sessions.map((item) => <option key={item.id} value={item.id}>{item.classRoom.name} - {item.topic}</option>)}
                </select>
              </label>
              <label>
                Status
                <select value={forms.attendance.status} onChange={(e) => updateForm("attendance", "status", e.target.value)}>
                  {attendanceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label>
                Catatan
                <textarea value={forms.attendance.note} onChange={(e) => updateForm("attendance", "note", e.target.value)} />
              </label>
              <button className="primary-button">Simpan Absensi</button>
            </form>

            <section className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Riwayat absensi</p>
                  <h3>Kehadiran terbaru</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Siswa</th>
                      <th>Kelas</th>
                      <th>Status</th>
                      <th>Jam masuk</th>
                      <th>Jam pulang</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance.map((item) => (
                      <tr key={item.id}>
                        <td>{item.student.fullName}</td>
                        <td>{item.session.classRoom.name}</td>
                        <td>{item.status}</td>
                        <td>{item.checkInAt ? new Date(item.checkInAt).toLocaleTimeString("id-ID") : "-"}</td>
                        <td>{item.checkOutAt ? new Date(item.checkOutAt).toLocaleTimeString("id-ID") : "-"}</td>
                        <td>
                          <div className="inline-actions">
                              <button type="button" className="ghost-button small-button" onClick={() => handleCheckout(item.id)} disabled={Boolean(item.checkOutAt)}>
                              Catat Pulang
                              </button>
                            {access.canSendNotifications ? (
                              <button type="button" className="ghost-button small-button" onClick={() => handleSendNotification(item.id)}>
                                WhatsApp
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === "qr-attendance" ? (
          <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={submitFactory("qr", api.createQrSession, initialForms.qr)}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">QR absensi</p>
                  <h3>Buat QR sesi</h3>
                </div>
              </div>
              <label>
                Sesi kelas
                <select value={forms.qr.sessionId} onChange={(e) => updateForm("qr", "sessionId", e.target.value)}>
                  {data.sessions.map((item) => <option key={item.id} value={item.id}>{item.classRoom.name} - {item.topic}</option>)}
                </select>
              </label>
              <button className="primary-button">Buat QR</button>
            </form>

            <article className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Preview QR</p>
                  <h3>Token kehadiran sesi</h3>
                </div>
              </div>
              {qrPreview ? (
                <>
                  <div className="qr-preview" dangerouslySetInnerHTML={{ __html: qrPreview.svg }} />
                  <p className="muted">Tautan cepat aplikasi seluler: {qrPreview.deepLink}</p>
                </>
              ) : (
                <p className="muted">Buat QR untuk melihat kode sesi.</p>
              )}

              <form className="stack-form" onSubmit={submitFactory("qrScan", api.scanQr, initialForms.qrScan)}>
                <label>
                  Siswa
                  <select value={forms.qrScan.studentId} onChange={(e) => updateForm("qrScan", "studentId", e.target.value)}>
                    {data.students.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                  </select>
                </label>
                <label>
                  Kode hasil pemindaian
                  <textarea value={forms.qrScan.code} onChange={(e) => updateForm("qrScan", "code", e.target.value)} placeholder="Tempel kode QR atau hasil pemindai aplikasi seluler di sini" />
                </label>
                <button className="secondary-button">Simulasikan Pindai QR</button>
              </form>
            </article>
          </section>
        ) : null}

        {activeTab === "evaluasi" ? (
          <section className="panel-grid">
            {access.canEvaluate ? (
              <form className="panel-card form-card" onSubmit={submitFactory("evaluation", api.createEvaluation, initialForms.evaluation)}>
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Evaluasi siswa</p>
                    <h3>Penilaian sesi</h3>
                  </div>
                </div>
                <label>
                  Siswa
                  <select value={forms.evaluation.studentId} onChange={(e) => updateForm("evaluation", "studentId", e.target.value)}>
                    {data.students.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                  </select>
                </label>
                <label>
                  Sesi
                  <select value={forms.evaluation.sessionId} onChange={(e) => updateForm("evaluation", "sessionId", e.target.value)}>
                    {data.sessions.map((item) => <option key={item.id} value={item.id}>{item.classRoom.name} - {item.topic}</option>)}
                  </select>
                </label>
                <div className="field-grid">
                  {["disciplineScore", "focusScore", "participationScore", "homeworkScore"].map((field) => (
                    <label key={field}>
                      {{
                        disciplineScore: "Kedisiplinan",
                        focusScore: "Fokus",
                        participationScore: "Partisipasi",
                        homeworkScore: "Tugas rumah"
                      }[field]}
                      <select value={forms.evaluation[field]} onChange={(e) => updateForm("evaluation", field, e.target.value)}>
                        {evaluationOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <label>
                  Ringkasan evaluasi
                  <textarea value={forms.evaluation.summary} onChange={(e) => updateForm("evaluation", "summary", e.target.value)} />
                </label>
                <label>
                  Rekomendasi
                  <textarea value={forms.evaluation.recommendation} onChange={(e) => updateForm("evaluation", "recommendation", e.target.value)} />
                </label>
                <button className="primary-button">Simpan Evaluasi</button>
              </form>
            ) : (
              <article className="panel-card"><p className="muted">Peran ini tidak memiliki izin untuk mengisi evaluasi.</p></article>
            )}

            <section className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Ringkasan perkembangan</p>
                  <h3>Monitoring hasil belajar</h3>
                </div>
              </div>
              <div className="stack-list">
                {data.evaluationSummary.map((item) => (
                  <div className="progress-card" key={item.studentId}>
                    <div>
                      <strong>{item.studentName}</strong>
                      <span>{item.latestClass}</span>
                    </div>
                    <div className="progress-meta">
                      <span>{item.progressPercent}%</span>
                      <div className="progress-bar"><div style={{ width: `${item.progressPercent}%` }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === "laporan" ? (
          <section className="panel-grid">
            <article className="panel-card form-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Ekspor laporan</p>
                  <h3>Unduh PDF dan Excel</h3>
                </div>
              </div>
              <p className="muted">File dihasilkan dari data absensi, sesi, dan evaluasi yang tersimpan.</p>
              <div className="inline-actions">
                <a className="primary-button link-button" href={`${apiBaseUrl}/reports/attendance.pdf`} target="_blank" rel="noreferrer">Unduh PDF</a>
                <a className="secondary-button link-button" href={`${apiBaseUrl}/reports/attendance.xlsx`} target="_blank" rel="noreferrer">Unduh Excel</a>
              </div>
            </article>
            <article className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Preview laporan</p>
                  <h3>Data siap diekspor</h3>
                </div>
              </div>
              <SimpleTable
                headers={["Siswa", "Angkatan", "Kelas", "Topik", "Status", "Evaluasi"]}
                rows={data.reportRows.map((item) => [
                  item.studentName,
                  item.batchName,
                  item.className,
                  item.sessionTopic,
                  item.status,
                  item.evaluationSummary || "-"
                ])}
              />
            </article>
          </section>
        ) : null}

        {activeTab === "notifikasi" ? (
          <section className="panel-grid">
            <article className="panel-card form-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">WhatsApp orang tua</p>
                  <h3>Alur notifikasi</h3>
                </div>
              </div>
              <ul className="feature-list">
                <li>Admin/staff kirim notifikasi dari data absensi terbaru.</li>
                <li>Pesan membawa status hadir dan evaluasi singkat siswa.</li>
                <li>Semua pengiriman tercatat untuk audit dan follow up.</li>
              </ul>
            </article>
            <article className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Log pengiriman</p>
                  <h3>Riwayat notifikasi</h3>
                </div>
              </div>
              <SimpleTable
                headers={["Siswa", "No Tujuan", "Provider", "Status", "Waktu"]}
                rows={data.notifications.map((item) => [
                  item.student.fullName,
                  item.targetPhone,
                  item.provider,
                  item.status,
                  new Date(item.createdAt).toLocaleString("id-ID")
                ])}
              />
            </article>
          </section>
        ) : null}

        {activeTab === "pengguna" ? (
          <SectionMaster
            title="Tambah operator"
            subtitle="Hak akses"
            onSubmit={submitFactory("user", api.createUser, initialForms.user)}
            form={
              <>
                <label>
                  Nama
                  <input value={forms.user.name} onChange={(e) => updateForm("user", "name", e.target.value)} />
                </label>
                <label>
                  Email
                  <input type="email" value={forms.user.email} onChange={(e) => updateForm("user", "email", e.target.value)} />
                </label>
                <label>
                  Kata sandi
                  <input type="password" value={forms.user.password} onChange={(e) => updateForm("user", "password", e.target.value)} />
                </label>
                <label>
                  Peran
                  <select value={forms.user.role} onChange={(e) => updateForm("user", "role", e.target.value)}>
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Staf</option>
                    <option value="INSTRUCTOR">PENGAJAR</option>
                  </select>
                </label>
              </>
            }
            button="Simpan Pengguna"
            table={<SimpleTable headers={["Nama", "Email", "Peran", "Status"]} rows={data.users.map((item) => [item.name, item.email, roleNameMap[item.role] || item.role, item.isActive ? "Aktif" : "Nonaktif"])} />}
          />
        ) : null}

        {activeTab === "batasan-role" ? (
          <section className="panel-grid role-grid">
            {Object.entries(data.allRoles).map(([role, item]) => (
              <article className="panel-card" key={role}>
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">{roleNameMap[role] || role}</p>
                    <h3>{item.label}</h3>
                  </div>
                </div>
                <ul className="feature-list">
                  <li>Kelola pengguna: {item.canManageUsers ? "Ya" : "Tidak"}</li>
                  <li>Kelola master data: {item.canManageMasterData ? "Ya" : "Tidak"}</li>
                  <li>Kelola absensi: {item.canManageAttendance ? "Ya" : "Tidak"}</li>
                  <li>QR absensi: {item.canCreateQr ? "Ya" : "Tidak"}</li>
                  <li>Ekspor laporan: {item.canExportReports ? "Ya" : "Tidak"}</li>
                  <li>Notifikasi WhatsApp: {item.canSendNotifications ? "Ya" : "Tidak"}</li>
                  <li>Input evaluasi: {item.canEvaluate ? "Ya" : "Tidak"}</li>
                  <li>Lihat semua evaluasi: {item.canViewAllEvaluations ? "Ya" : "Tidak"}</li>
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "mobile" ? (
          <section className="panel-grid">
            <article className="panel-card form-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">React Native</p>
                  <h3>Fondasi aplikasi seluler sudah disiapkan</h3>
                </div>
              </div>
              <ul className="feature-list">
                <li>Login aplikasi seluler ke API yang sama dengan web.</li>
                <li>Layar absensi cepat dan pindai QR manual.</li>
                <li>Siap dikembangkan ke pemindai kamera native.</li>
              </ul>
              <p className="muted">Folder: /Users/felix/Documents/New project/mobile-app</p>
            </article>
            <article className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Implementasi</p>
                  <h3>Keselarasan web dan aplikasi seluler</h3>
                </div>
              </div>
              <p className="muted">
                Aplikasi seluler memakai endpoint QR, absensi, dan autentikasi yang sama sehingga alur operasional tetap konsisten.
              </p>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function SectionMaster({ subtitle, title, onSubmit, form, button, table }) {
  return (
    <section className="panel-grid">
      <form className="panel-card form-card" onSubmit={onSubmit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h3>{title}</h3>
          </div>
        </div>
        {form}
        <button className="primary-button">{button}</button>
      </form>
      <section className="panel-card">{table}</section>
    </section>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${headers[cellIndex]}-${index}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
