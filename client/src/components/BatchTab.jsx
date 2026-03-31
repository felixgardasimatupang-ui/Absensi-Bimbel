import SimpleTable from "./SimpleTable";

function BatchTab({ form, onSubmit, updateForm, data }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Master angkatan</p>
                        <h3>Tambah angkatan</h3>
                    </div>
                </div>
                <label>
                    Nama angkatan
                    <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
                </label>
                <label>
                    Jenjang
                    <input value={form.level} onChange={(e) => updateForm("level", e.target.value)} />
                </label>
                <label>
                    Keterangan
                    <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
                </label>
                <button className="primary-button">Simpan Angkatan</button>
            </form>
            <section className="panel-card">
                <SimpleTable
                    headers={["Nama", "Jenjang", "Siswa", "Kelas"]}
                    rows={data.map((item) => [item.name, item.level, item._count.students, item._count.classes])}
                />
            </section>
        </section>
    );
}

export default BatchTab;