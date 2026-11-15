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
            <li><strong>Model:</strong> Mengelola data, API endpoints, serta state autentikasi (token & user).</li>
            <li><strong>View:</strong> Merender tampilan antarmuka dan menangkap interaksi pengguna.</li>
            <li><strong>Presenter:</strong> Menjembatani Model dan View serta mengelola logika alur aplikasi.</li>
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
