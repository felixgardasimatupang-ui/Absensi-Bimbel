import SimpleTable from "./SimpleTable";

const dayOptions = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function ClassTab({ form, onSubmit, updateForm, data, batches }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Master kelas</p>
                        <h3>Buat kelas les</h3>
                    </div>
                </div>
                <div className="field-grid">
                    <label>
                        Nama kelas
                        <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
                    </label>
                    <label>
                        Mapel
                        <input value={form.subject} onChange={(e) => updateForm("subject", e.target.value)} />
                    </label>
                    <label>
                        Ruangan
                        <input value={form.room} onChange={(e) => updateForm("room", e.target.value)} />
                    </label>
                    <label>
                        Hari
                        <select value={form.scheduleDay} onChange={(e) => updateForm("scheduleDay", e.target.value)}>
                            {dayOptions.map((day) => <option key={day}>{day}</option>)}
                        </select>
                    </label>
                    <label>
                        Mulai
                        <input type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} />
                    </label>
                    <label>
                        Selesai
                        <input type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} />
                    </label>
                </div>
                <label>
                    Angkatan
                    <select value={form.batchId} onChange={(e) => updateForm("batchId", e.target.value)}>
                        {batches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </label>
                <button className="primary-button">Simpan Kelas</button>
            </form>
            <section className="panel-card">
                <SimpleTable
                    headers={["Kelas", "Mapel", "Angkatan", "Jadwal"]}
                    rows={data.map((item) => [
                        item.name,
                        item.subject,
                        item.batch.name,
                        `${item.scheduleDay}, ${item.startTime} - ${item.endTime}`
                    ])}
                />
            </section>
        </section>
    );
}

export default ClassTab;