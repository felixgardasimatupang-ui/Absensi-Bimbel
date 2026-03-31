function QrAttendanceTab({ form, onSubmit, updateForm, sessions, students, qrPreview }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">QR absensi</p>
                        <h3>Buat QR sesi</h3>
                    </div>
                </div>
                <label>
                    Sesi kelas
                    <select value={form.sessionId} onChange={(e) => updateForm("sessionId", e.target.value)}>
                        {sessions.map((item) => <option key={item.id} value={item.id}>{item.classRoom.name} - {item.topic}</option>)}
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

                <form className="stack-form">
                    <label>
                        Siswa
                        <select value={form.studentId} onChange={(e) => updateForm("studentId", e.target.value)}>
                            {students.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                        </select>
                    </label>
                    <label>
                        Kode hasil pemindaian
                        <textarea value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder="Tempel kode QR atau hasil pemindai aplikasi seluler di sini" />
                    </label>
                    <button className="secondary-button">Simulasikan Pindai QR</button>
                </form>
            </article>
        </section>
    );
}

export default QrAttendanceTab;