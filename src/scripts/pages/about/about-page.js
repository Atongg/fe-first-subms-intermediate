export default class AboutPage {
  async render() {
    return `
      <section class="container about-section">
        <div class="about-card">
          <h1 class="page-title">Tentang Aplikasi</h1>
          <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 1rem;">
            Aplikasi ini dibangun menggunakan arsitektur <strong>Single Page Application (SPA)</strong> dengan 
            metode <strong>Hash Routing</strong> dan pola desain <strong>Model-View-Presenter (MVP)</strong>.
          </p>
          <ul style="color: var(--text-muted); line-height: 1.8; padding-left: 20px;">
            <li><strong>Model:</strong> Mengelola data, API endpoints (Story API Dicoding), serta state autentikasi (token & user).</li>
            <li><strong>View:</strong> Merender antarmuka daftar cerita dan visualisasi peta interaktif menggunakan Leaflet & OpenStreetMap.</li>
            <li><strong>Presenter:</strong> Menjembatani Model dan View serta mengelola logika alur aplikasi dan sinkronisasi list dengan peta.</li>
            <li><strong>Interactive Map:</strong> Visualisasi marker lokasi, popup informatif, filter interaktif, serta sinkronisasi dua arah antara kartu dan peta.</li>
            <li><strong>Tambah Cerita & Geotagging:</strong> Formulir tambah cerita interaktif dengan pemilihan latitude dan longitude melalui event klik di peta digital Leaflet.</li>
            <li><strong>Kamera Langsung & Unggah Berkas:</strong> Mendukung input gambar melalui berkas lokal maupun tangkapan langsung dari kamera pengguna menggunakan MediaStream API dengan pemutusan resource kamera otomatis saat selesai digunakan.</li>
            <li><strong>Multiple Tile Layers:</strong> Mendukung layer control dengan pilihan tile layer bebas API key (OpenStreetMap Standar, HOT Humanitarian, OpenTopoMap, Esri Citra Satelit, dan CyclOSM).</li>
            <li><strong>Custom View Transition:</strong> Menerapkan transisi tampilan halus menggunakan View Transitions API.</li>
          </ul>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Tidak memerlukan operasi tambahan
  }
}
