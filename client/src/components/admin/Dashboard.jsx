import {
  Plus,
  Upload,
  Database,
  FileText,
} from "lucide-react";

function StatCard({ color, value, label }) {
  return (
    <div className={`stat-box ${color}`}>
      <h2>{value}</h2>
      <span>{label}</span>
    </div>
  );
}

export default function Dashboard({
  loading,
  stats,
  datasets,
  error,
  resolveTitle,
  resolveOrgName,
  resolveYear,
  resolveStatus,
  onAddDataset,
  onImportCsv,
  onManageDatasets,
  onViewRecentDatasets,
  onViewReport,
}) {
  return (
    <>

      {/* Statistik */}

      <section className="admin-stats">

        <StatCard
          color="red"
          value={loading ? "..." : stats.totalDatasets}
          label="Total Dataset"
        />

        <StatCard
          color="blue"
          value={loading ? "..." : stats.organizationCount}
          label="Organisasi"
        />

        <StatCard
          color="green"
          value={loading ? "..." : stats.adminCount}
          label="Administrator"
        />

        <StatCard
          color="orange"
          value={loading ? "..." : stats.activeYear}
          label="Tahun Aktif"
        />

      </section>

      {/* Quick Action */}

      <section className="admin-card">

        <div className="card-header">
          <h2>Aksi Cepat</h2>
        </div>

        <div className="quick-grid">

          <button className="quick-card" onClick={onAddDataset}>

            <Plus size={30} />

            <h3>Tambah Dataset</h3>

            <p>
              Tambahkan dataset baru beserta metadata yang diperlukan.
            </p>

          </button>

          <button className="quick-card" onClick={onImportCsv}>

            <Upload size={30} />

            <h3>Import CSV</h3>

            <p>
              Import banyak dataset sekaligus melalui file CSV.
            </p>

          </button>

          <button className="quick-card" onClick={onManageDatasets}>

            <Database size={30} />

            <h3>Kelola Dataset</h3>

            <p>
              Edit, perbarui, maupun menghapus dataset yang tersedia.
            </p>

          </button>

          <button className="quick-card" onClick={onViewRecentDatasets}>

            <FileText size={30} />

            <h3>Dataset Baru</h3>

            <p>
              Lihat dan edit dataset yang baru ditambah atau diimport.
            </p>

          </button>

          <button className="quick-card" onClick={onViewReport}>

            <FileText size={30} />

            <h3>Laporan</h3>

            <p>
              Lihat statistik penggunaan serta aktivitas administrator.
            </p>

          </button>

        </div>

      </section>

      {/* Dataset Terbaru */}

      <section className="admin-card">

        <div className="card-header">

          <h2>Dataset Terbaru</h2>

        </div>

        {error &&

          <div className="admin-empty">

            {error}

          </div>

        }

        <table className="admin-table">

          <thead>

            <tr>

              <th>Nama Dataset</th>

              <th>OPD</th>

              <th>Tahun</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {

              datasets.length === 0 && !loading ?

                (

                  <tr>

                    <td colSpan="4" className="admin-empty">

                      Tidak ada dataset.

                    </td>

                  </tr>

                )

                :

                datasets.map((dataset, index) => (

                  <tr
                    key={
                      dataset.uuid ||
                      dataset.id ||
                      `${resolveTitle(dataset)}-${index}`
                    }
                  >

                    <td>

                      {resolveTitle(dataset)}

                    </td>

                    <td>

                      {resolveOrgName(dataset)}

                    </td>

                    <td>

                      {resolveYear(dataset)}

                    </td>

                    <td>

                      <span
                        className={`status ${
                          resolveStatus(dataset) === "Draft"
                            ? "draft"
                            : "active"
                        }`}
                      >

                        {resolveStatus(dataset)}

                      </span>

                    </td>

                  </tr>

                ))

            }

          </tbody>

        </table>

      </section>

    </>
  );
}