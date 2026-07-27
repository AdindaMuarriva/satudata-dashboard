import "./Footer.css";

import {
  Landmark,
  Mail,
  MapPin,
  Phone,
  ChevronRight,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="app-footer">

      <div className="footer-container">

        {/* ================= LEFT ================= */}

        <div className="footer-brand">

          <div className="footer-logo">
            <div className="logo-icon">
              <Landmark size={32} />
            </div>

            <div>
              <h2>Satu Data Aceh</h2>
              <span>Portal Data Pemerintah Aceh</span>
            </div>
          </div>

          <p className="footer-description">
            Satu Data Aceh merupakan portal resmi Pemerintah Aceh yang
            menyediakan akses terhadap data sektoral, statistik, dan
            informasi pembangunan secara terbuka. Portal ini bertujuan
            mendukung transparansi, kolaborasi antar instansi, serta
            pengambilan keputusan berbasis data yang akurat dan terpercaya.
          </p>

          <div className="footer-contact">

            <div className="contact-item">
              <MapPin size={18} />
              <div> {/* Wrapper baru untuk label dan isi */}
                <strong>Alamat</strong>
                <span>
                  Diskominsa Aceh u/p UPTD Statistik <br />
                  Jl. Sultan Alaidin Mahmudsyah No.14, Banda Aceh
                </span>
              </div>
            </div>

            <div className="contact-item">
              <Phone size={18} />
              <div> {/* Wrapper baru untuk label dan isi */}
                <strong>Telepon</strong>
                <span>(0651) 22221</span>
              </div>
            </div>

            <div className="contact-item">
              <Mail size={18} />
              <div> {/* Wrapper baru untuk label dan isi */}
                <strong>Email</strong>
                <span>uptd.statistik@gmail.com</span>
              </div>
            </div>

          </div>

        </div>

        {/* ================= RIGHT ================= */}

        <div className="footer-links">

          {/* Jelajah */}

          <div className="footer-column">

            <h4>JELAJAH</h4>

            <ul>

              <li>
                <a href="/">
                  <ChevronRight size={14} />
                  Beranda
                </a>
              </li>

              <li>
                <a href="?page=feature&feature=Dataset">
                  <ChevronRight size={14} />
                  Dataset
                </a>
              </li>

              <li>
                <a href="?page=all-orgs">
                  <ChevronRight size={14} />
                  Instansi
                </a>
              </li>

              <li>
                <a href="?page=topic">
                  <ChevronRight size={14} />
                  Topik
                </a>
              </li>

              <li>
                <a href="?page=feature&feature=Dokumen%20Geospasial">
                  <ChevronRight size={14} />
                  Geospasial
                </a>
              </li>

            </ul>

          </div>

          {/* Visualisasi */}

          <div className="footer-column">

            <h4>VISUALISASI</h4>

            <ul>

              <li>
                <a href="?page=feature&feature=Dashboard">
                  <ChevronRight size={14} />
                  Dashboard
                </a>
              </li>

              <li>
                <a href="?page=feature&feature=Infografik">
                  <ChevronRight size={14} />
                  Infografik
                </a>
              </li>

              <li>
                <a href="?page=feature&feature=Videografik">
                  <ChevronRight size={14} />
                  Videografik
                </a>
              </li>

              <li>
                <a href="?page=feature&feature=Publikasi">
                  <ChevronRight size={14} />
                  Produk Statistik
                </a>
              </li>

            </ul>

          </div>

          {/* Lainnya */}

          <div className="footer-column">

            <h4>LAINNYA</h4>

            <ul>

              <li>
                <a
                  href="https://satudata.acehprov.go.id/news"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ChevronRight size={14} />
                  Berita & Rilis
                </a>
              </li>

              <li>
                <a
                  href="https://satudata.acehprov.go.id/about"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ChevronRight size={14} />
                  Tentang Kami
                </a>
              </li>

              <li>
                <a href="?page=admin">
                  <ChevronRight size={14} />
                  Login Admin
                </a>
              </li>

            </ul>

          </div>

        </div>

      </div>

      {/* ================= BOTTOM ================= */}

      <div className="footer-bottom">

        <div className="footer-bottom-container">

          <p>
            © {new Date().getFullYear()} Satu Data Pemerintah Aceh.
            Seluruh Hak Cipta Dilindungi.
          </p>

          <div className="bottom-links">

            <a
              href="https://satudata.acehprov.go.id/about"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tentang Kami
            </a>

            <a href="mailto:uptd.statistik@gmail.com">
              Hubungi Kami
            </a>

            <a
              href="https://satudata.acehprov.go.id/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kebijakan Privasi
            </a>

          </div>

        </div>

      </div>

    </footer>
  );
}