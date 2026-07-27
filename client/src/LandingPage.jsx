import { BrainCircuit, Building2, LayoutGrid, ArrowRight, Tractor, Users, Wrench, HeartPulse, GraduationCap, Leaf, BarChart2 } from "lucide-react";
import DataQuestionAssistant from "./components/DataQuestionAssistant";

const THEMATIC_DASHBOARDS = [
  { href: "?page=dashboard-pertanian", icon: Tractor, title: "Pertanian", description: "Analisis produksi, lahan, dan komoditas pertanian." },
  { href: "?page=dashboard-sosial", icon: Users, title: "Sosial", description: "Data kependudukan, kemiskinan, dan kesejahteraan." },
  { href: "?page=dashboard-infrastruktur", icon: Wrench, title: "Infrastruktur", description: "Informasi jalan, jembatan, dan fasilitas publik." },
  { href: "?page=dashboard-kesehatan", icon: HeartPulse, title: "Kesehatan", description: "Statistik layanan, fasilitas, dan indikator kesehatan." },
  { href: "?page=dashboard-pendidikan", icon: GraduationCap, title: "Pendidikan", description: "Data sekolah, siswa, guru, dan partisipasi pendidikan." },
  { href: "?page=dashboard-lingkungan", icon: Leaf, title: "Lingkungan", description: "Kualitas lingkungan, sampah, dan ruang terbuka." },
  { href: "?page=dashboard-statistik", icon: BarChart2, title: "Statistik", description: "Indikator dan data statistik sektoral lainnya." },
];

export default function LandingPage({ datasets }) {
  return (
    <main className="landing-page">
      <style>{`
        .landing-page { padding-top: 2rem; }
        .landing-hero { text-align: center; max-width: 720px; margin: 0 auto 4rem; }
        .landing-hero h1 { font-size: 42px; font-weight: 800; line-height: 1.2; color: #1f2430; margin-bottom: 1rem; }
        .landing-hero p { font-size: 18px; color: #6b7280; }
        .landing-section-header { text-align: center; max-width: 600px; margin: 0 auto 2.5rem; }
        .landing-section-header h2 { font-size: 32px; font-weight: 700; color: #1f2430; margin-bottom: 0.5rem; }
        .landing-section-header p { color: #6b7280; }
        .landing-page .data-question-assistant { margin-bottom: 5rem; }
        .thematic-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 5rem; }
        .thematic-card { display: block; background: #fff; border: 1px solid #e6e8ec; border-radius: 14px; padding: 24px; text-decoration: none; color: inherit; transition: all .2s ease; box-shadow: 0 1px 3px rgba(16,24,40,.04); }
        .thematic-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(16,24,40,.08); border-color: #c7cbd3; }
        .thematic-card-icon { width: 48px; height: 48px; border-radius: 10px; background: #fef2f2; color: #9d1b1b; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .thematic-card h3 { font-size: 18px; font-weight: 700; color: #1f2430; margin: 0 0 0.5rem; }
        .thematic-card p { font-size: 14px; color: #6b7280; margin: 0; }
        .explore-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .explore-card { display: flex; align-items: center; gap: 1.5rem; background: #fff; border: 1px solid #e6e8ec; border-radius: 14px; padding: 24px; text-decoration: none; color: inherit; transition: all .2s ease; box-shadow: 0 1px 3px rgba(16,24,40,.04); }
        .explore-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(16,24,40,.08); border-color: #c7cbd3; }
        .explore-card-icon { width: 48px; height: 48px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .explore-card-content h3 { font-size: 18px; font-weight: 700; color: #1f2430; margin: 0 0 0.25rem; }
        .explore-card-content p { font-size: 14px; color: #6b7280; margin: 0; }
        .explore-card .arrow { margin-left: auto; color: #9ca3af; }
        @media (max-width: 640px) { .explore-grid { grid-template-columns: 1fr; } }
      `}</style>

      <section className="landing-hero">
        <h1>Analisis & Visualisasi Data Terintegrasi</h1>
        <p>Jelajahi, analisis, dan dapatkan wawasan dari ribuan dataset sektoral Pemerintah Aceh melalui dasbor interaktif dan asisten AI.</p>
      </section>

      <DataQuestionAssistant datasets={datasets} themeLabel="data" />

      <section>
        <div className="landing-section-header">
          <h2>Dashboard Tematik</h2>
          <p>Fokus pada analisis mendalam untuk sektor-sektor prioritas pembangunan Aceh.</p>
        </div>
        <div className="thematic-grid">
          {THEMATIC_DASHBOARDS.map(item => (
            <a href={item.href} className="thematic-card" key={item.title}>
              <div className="thematic-card-icon"><item.icon size={24} /></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section>
        <div className="landing-section-header">
          <h2>Jelajah Data</h2>
          <p>Temukan dataset berdasarkan Organisasi Perangkat Daerah (OPD) atau urusan pemerintahan.</p>
        </div>
        <div className="explore-grid">
          <a href="?page=all-orgs" className="explore-card">
            <div className="explore-card-icon"><Building2 size={24} /></div>
            <div className="explore-card-content">
              <h3>Jelajah per Instansi</h3>
              <p>Lihat semua dataset yang dipublikasikan oleh setiap dinas atau badan.</p>
            </div>
            <ArrowRight className="arrow" size={20} />
          </a>
          <a href="?page=topic" className="explore-card">
            <div className="explore-card-icon"><LayoutGrid size={24} /></div>
            <div className="explore-card-content">
              <h3>Jelajah per Urusan</h3>
              <p>Kelompokkan dataset berdasarkan bidang urusan pemerintahan yang relevan.</p>
            </div>
            <ArrowRight className="arrow" size={20} />
          </a>
        </div>
      </section>
    </main>
  );
}
