const roleNameMap = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    STAFF: "Staf",
    INSTRUCTOR: "Pengajar"
};

function RoleLimitTab({ allRoles }) {
    return (
        <section className="panel-grid role-grid">
            {Object.entries(allRoles).map(([role, item]) => (
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
    );
}

export default RoleLimitTab;