import SimpleTable from "./SimpleTable";

function StudentTab({ form, onSubmit, updateForm, data, batches }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Master siswa</p>
                        <h3>Tambah siswa baru</h3>
                    </div>
                </div>
                <div className="field-grid">
                    <label>
                        Kode siswa
                        <input value={form.studentCode} onChange={(e) => updateForm("studentCode", e.target.value)} />
                    </label>
                    <label>
                        Nama lengkap
                        <input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} />
                    </label>
                    <label>
                        Jenis kelamin
                        <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)}>
                            <option>Laki-laki</option>
                            <option>Perempuan</option>
                        </select>
                    </label>
                    <label>
                        Angkatan
                        <select value={form.batchId} onChange={(e) => updateForm("batchId", e.target.value)}>
                            {batches.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Nama orang tua
                        <input value={form.parentName} onChange={(e) => updateForm("parentName", e.target.value)} />
                    </label>
                    <label>
                        Nomor orang tua
                        <input value={form.parentPhone} onChange={(e) => updateForm("parentPhone", e.target.value)} />
                    </label>
                </div>
                <label>
                    Sekolah
                    <input value={form.schoolName} onChange={(e) => updateForm("schoolName", e.target.value)} />
                </label>
                <label>
                    Alamat
                    <textarea value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
                </label>
                <button className="primary-button">Simpan Siswa</button>
            </form>
            <section className="panel-card">
                <SimpleTable
                    headers={["Kode", "Nama", "Angkatan", "Orang Tua", "Evaluasi Terakhir"]}
                    rows={data.map((item) => [
                        item.studentCode,
                        item.fullName,
                        item.batch.name,
                        item.parentPhone,
                        item.evaluations[0]?.summary || "-"
                    ])}
                />
            </section>
        </section>
    );
}

export default StudentTab;