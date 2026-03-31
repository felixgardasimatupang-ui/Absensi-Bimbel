import SimpleTable from "./SimpleTable";

function NotificationTab({ notifications }) {
    return (
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
                    rows={notifications.map((item) => [
                        item.student.fullName,
                        item.targetPhone,
                        item.provider,
                        item.status,
                        new Date(item.createdAt).toLocaleString("id-ID")
                    ])}
                />
            </article>
        </section>
    );
}

export default NotificationTab;