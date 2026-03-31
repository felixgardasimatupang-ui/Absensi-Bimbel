function MobileAppTab() {
    return (
        <section className="panel-grid">
            <article className="panel-card form-card">
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">React Native</p>
                        <h3>Fondasi aplikasi seluler sudah disiapkan</h3>
                    </div>
                </div>
                <ul className="feature-list">
                    <li>Login aplikasi seluler ke API yang sama dengan web.</li>
                    <li>Layar absensi cepat dan pindai QR manual.</li>
                    <li>Siap dikembangkan ke pemindai kamera native.</li>
                </ul>
                <p className="muted">Folder: /Users/felix/Documents/New project/mobile-app</p>
            </article>
            <article className="panel-card">
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Implementasi</p>
                        <h3>Keselarasan web dan aplikasi seluler</h3>
                    </div>
                </div>
                <p className="muted">
                    Aplikasi seluler memakai endpoint QR, absensi, dan autentikasi yang sama sehingga alur operasional tetap konsisten.
                </p>
            </article>
        </section>
    );
}

export default MobileAppTab;