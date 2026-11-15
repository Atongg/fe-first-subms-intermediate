class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async init() {
    this.#view.showLoading();

    try {
      const items = await this.#model.getItems();

      if (Array.isArray(items) && items.length > 0) {
        this.#view.renderData(items);
      } else {
        this.#view.showEmptyState();
      }
    } catch (error) {
      console.warn('Gagal memuat data API homepage:', error);
      this.#view.showEmptyState();
    } finally {
      this.#view.hideLoading();
    }
  }
}

export default HomePresenter;
