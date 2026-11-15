import HomePresenter from './home-presenter.js';
import HomeModel from '../../data/home-model.js';

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <section class="home-section" aria-label="Halaman Beranda">
        <!-- Container halaman utama (halaman putih kosong sesuai kriteria) -->
        <div id="home-container" class="home-blank-page"></div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: HomeModel,
    });

    await this.#presenter.init();
  }

  showEmptyState() {
    const container = document.querySelector('#home-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  renderData(items) {
    const container = document.querySelector('#home-container');
    if (!container) return;

    if (!items || items.length === 0) {
      this.showEmptyState();
      return;
    }

    container.innerHTML = `
      <div class="container py-4">
        <h1 class="page-title">Daftar Data</h1>
        <div class="data-grid">
          ${items
        .map(
          (item) => `
            <article class="data-card">
              ${item.photoUrl
              ? `<img src="${item.photoUrl}" alt="${item.name || 'Gambar'}" class="data-card-img" />`
              : ''
            }
              <div class="data-card-body">
                <h2 class="data-card-title">${item.name || item.title || 'Tanpa Judul'}</h2>
                <p class="data-card-desc">${item.description || ''}</p>
                ${item.createdAt
              ? `<time class="data-card-time">${new Date(item.createdAt).toLocaleDateString('id-ID')}</time>`
              : ''
            }
              </div>
            </article>
          `
        )
        .join('')}
        </div>
      </div>
    `;
  }

  showLoading() {
    // Bisa digunakan saat loading data API di masa mendatang
  }

  hideLoading() {
    // Sembunyikan loading
  }

  showError(message) {
    const container = document.querySelector('#home-container');
    if (container) {
      container.innerHTML = `
        <div class="container py-4">
          <div class="alert alert-danger" role="alert">
            <span>${message}</span>
          </div>
        </div>
      `;
    }
  }
}
