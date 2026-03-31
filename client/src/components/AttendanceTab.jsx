const attendanceOptions = [
    { value: "PRESENT", label: "Hadir" },
    { value: "LATE", label: "Terlambat" },
    { value: "EXCUSED", label: "Izin" },
    { value: "SICK", label: "Sakit" },
    { value: "ABSENT", label: "Alpha" }
];

function AttendanceTab({ form, onSubmit, updateForm, students, sessions, attendance, onCheckout, onSendNotification, canSendNotifications }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Input absensi</p>
                        <h3>Catat kehadiran siswa</h3>
                    </div>
                </div>
                <label>
                    Siswa
                    <select value={form.studentId} onChange={(e) => updateForm("studentId", e.target.value)}>
                        {students.map((item) => <option key={item.id} value={item.id}>{item.studentCode} - {item.fullName}</option>)}
                    </select>
                </label>
                <label>
                    Sesi
                    <select value={form.sessionId} onChange={(e) => updateForm("sessionId", e.target.value)}>
                        {sessions.map((item) => <option key={item.id} value={item.id}>{item.classRoom.name} - {item.topic}</option>)}
                    </select>
                </label>
                <label>
                    Status
                    <select value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
                        {attendanceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                </label>
                <label>
                    Catatan
                    <textarea value={form.note} onChange={(e) => updateForm("note", e.target.value)} />
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
                            {attendance.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.student.fullName}</td>
                                    <td>{item.session.classRoom.name}</td>
                                    <td>{item.status}</td>
                                    <td>{item.checkInAt ? new Date(item.checkInAt).toLocaleTimeString("id-ID") : "-"}</td>
                                    <td>{item.checkOutAt ? new Date(item.checkOutAt).toLocaleTimeString("id-ID") : "-"}</td>
                                    <td>
                                        <div className="inline-actions">
                                            <button type="button" className="ghost-button small-button" onClick={() => onCheckout(item.id)} disabled={Boolean(item.checkOutAt)}>
                                                Catat Pulang
                                            </button>
                                            {canSendNotifications ? (
                                                <button type="button" className="ghost-button small-button" onClick={() => onSendNotification(item.id)}>
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
    );
}

export default AttendanceTab;