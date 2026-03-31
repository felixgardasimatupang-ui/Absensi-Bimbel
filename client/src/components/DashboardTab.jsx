function DashboardTab({ metrics, recentAttendances, roleAccess, access }) {
    return (
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
                        {recentAttendances.map((item) => (
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
                    <h3>{roleAccess?.label}</h3>
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
    );
}

export default DashboardTab;