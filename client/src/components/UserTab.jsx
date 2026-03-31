import SimpleTable from "./SimpleTable";

const roleNameMap = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    STAFF: "Staf",
    INSTRUCTOR: "Pengajar"
};

function UserTab({ form, onSubmit, updateForm, users }) {
    return (
        <section className="panel-grid">
            <form className="panel-card form-card" onSubmit={onSubmit}>
                <div className="panel-head">
                    <div>
                        <p className="eyebrow">Hak akses</p>
                        <h3>Tambah operator</h3>
                    </div>
                </div>
                <label>
                    Nama
                    <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
                </label>
                <label>
                    Email
                    <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
                </label>
                <label>
                    Kata sandi
                    <input type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} />
                </label>
                <label>
                    Peran
                    <select value={form.role} onChange={(e) => updateForm("role", e.target.value)}>
                        <option value="ADMIN">Admin</option>
                        <option value="STAFF">Staf</option>
                        <option value="INSTRUCTOR">PENGAJAR</option>
                    </select>
                </label>
                <button className="primary-button">Simpan Pengguna</button>
            </form>
            <section className="panel-card">
                <SimpleTable
                    headers={["Nama", "Email", "Peran", "Status"]}
                    rows={users.map((item) => [
                        item.name,
                        item.email,
                        roleNameMap[item.role] || item.role,
                        item.isActive ? "Aktif" : "Nonaktif"
                    ])}
                />
            </section>
        </section>
    );
}

export default UserTab;