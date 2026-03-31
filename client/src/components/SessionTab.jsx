import SimpleTable from "./SimpleTable";

function SessionTab({ form, onSubmit, updateForm, data, classes }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Sesi pembelajaran</p>
                        <h3>Tambah sesi les</h3>
                    </div>
                </div>
                <label>
                    Kelas
                    <select value={form.classId} onChange={(e) => updateForm("classId", e.target.value)}>
                        {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </label>
                <label>
                    Waktu sesi
                    <input type="datetime-local" value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
                </label>
                <label>
                    Topik
                    <input value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} />
                </label>
                <label>
                    Catatan
                    <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
                </label>
                <button className="primary-button">Simpan Sesi</button>
            </form>
            <section className="panel-card">
                <SimpleTable
                    headers={["Kelas", "Tanggal", "Topik", "QR Aktif", "Evaluasi"]}
                    rows={data.map((item) => [
                        item.classRoom.name,
                        new Date(item.date).toLocaleString("id-ID"),
                        item.topic,
                        item.qrSessions[0] ? "Tersedia" : "-",
                        item._count.evaluations
                    ])}
                />
            </section>
        </section>
    );
}

export default SessionTab;