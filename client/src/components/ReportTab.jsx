import { apiBaseUrl } from "../api";
import SimpleTable from "./SimpleTable";

function ReportTab({ reportRows }) {
    return (
        <section className="panel-grid">
            <article className="panel-card form-card">
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Ekspor laporan</p>
                        <h3>Unduh PDF dan Excel</h3>
                    </div>
                </div>
                <p className="muted">File dihasilkan dari data absensi, sesi, dan evaluasi yang tersimpan.</p>
                <div className="inline-actions">
                    <a className="primary-button link-button" href={`${apiBaseUrl}/reports/attendance.pdf`} target="_blank" rel="noreferrer">Unduh PDF</a>
                    <a className="secondary-button link-button" href={`${apiBaseUrl}/reports/attendance.xlsx`} target="_blank" rel="noreferrer">Unduh Excel</a>
                </div>
            </article>
            <article className="panel-card">
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Preview laporan</p>
                        <h3>Data siap diekspor</h3>
                    </div>
                </div>
                <SimpleTable
                    headers={["Siswa", "Angkatan", "Kelas", "Topik", "Status", "Evaluasi"]}
                    rows={reportRows.map((item) => [
                        item.studentName,
                        item.batchName,
                        item.className,
                        item.sessionTopic,
                        item.status,
                        item.evaluationSummary || "-"
                    ])}
                />
            </article>
        </section>
    );
}

export default ReportTab;