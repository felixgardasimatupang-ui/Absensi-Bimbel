const evaluationOptions = [
    { value: "NEEDS_SUPPORT", label: "Perlu Pendampingan" },
    { value: "DEVELOPING", label: "Berkembang" },
    { value: "GOOD", label: "Baik" },
    { value: "EXCELLENT", label: "Sangat Baik" }
];

function EvaluationTab({ form, onSubmit, updateForm, students, sessions, evaluationSummary, canEvaluate }) {
    const scoreFields = [
        { key: "disciplineScore", label: "Kedisiplinan" },
        { key: "focusScore", label: "Fokus" },
        { key: "participationScore", label: "Partisipasi" },
        { key: "homeworkScore", label: "Tugas rumah" }
    ];

    return (
        <section className="panel-grid">
            {canEvaluate ? (
                <form className="panel-card form-card" onSubmit={onSubmit}>
                    <div className="panel-head">
                        <div>
                            <p className="eyebrow">Evaluasi siswa</p>
                            <h3>Penilaian sesi</h3>
                        </div>
                    </div>
                    <label>
                        Siswa
                        <select value={form.studentId} onChange={(e) => updateForm("studentId", e.target.value)}>
                            {students.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                        </select>
                    </label>
                    <label>
                        Sesi
                        <select value={form.sessionId} onChange={(e) => updateForm("sessionId", e.target.value)}>
                            {sessions.map((item) => <option key={item.id} value={item.id}>{item.classRoom.name} - {item.topic}</option>)}
                        </select>
                    </label>
                    <div className="field-grid">
                        {scoreFields.map((field) => (
                            <label key={field.key}>
                                {field.label}
                                <select value={form[field.key]} onChange={(e) => updateForm(field.key, e.target.value)}>
                                    {evaluationOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                            </label>
                        ))}
                    </div>
                    <label>
                        Ringkasan evaluasi
                        <textarea value={form.summary} onChange={(e) => updateForm("summary", e.target.value)} />
                    </label>
                    <label>
                        Rekomendasi
                        <textarea value={form.recommendation} onChange={(e) => updateForm("recommendation", e.target.value)} />
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
                    {evaluationSummary.map((item) => (
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
    );
}

export default EvaluationTab;