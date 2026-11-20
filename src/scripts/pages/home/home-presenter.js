class HomePresenter {
  #view;
  #model;
  #allStories = [];
  #searchQuery = '';
  #locationFilter = 'all';
  #activeStoryId = null;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async init() {
    this.#view.showLoading();

    try {
      const stories = await this.#model.getItems({ location: 1 });
      this.#allStories = Array.isArray(stories) ? stories : [];

      if (this.#allStories.length === 0) {
        this.#view.showEmptyState();
        return;
      }

      this.#view.renderStories(this.#allStories);

      const storiesWithLocation = this.#allStories.filter(
        (story) => story.lat != null && story.lon != null
      );

      this.#view.initMap(storiesWithLocation, (storyId) => {
        this.handleMarkerSelected(storyId);
      });

      this.#updateStats();

      this.#bindEvents();
    } catch (error) {
      console.error('Error saat inisialisasi halaman beranda:', error);
      this.#view.showError(
        error.message || 'Gagal memuat data dari server. Silakan coba kembali.'
      );
    } finally {
      this.#view.hideLoading();
    }
  }

  #bindEvents() {
    this.#view.bindSearch((query) => {
      this.#searchQuery = (query || '').trim().toLowerCase();
      this.#applyFilter();
    });

    this.#view.bindFilterLocation((filterType) => {
      this.#locationFilter = filterType;
      this.#applyFilter();
    });

    this.#view.bindFocusStoryOnMap((storyId) => {
      this.handleCardFocusOnMap(storyId);
    });

    this.#view.bindFocusStoryInList((storyId) => {
      this.handleMarkerSelected(storyId);
    });

    this.#view.bindResetMap(() => {
      this.#view.resetMapView();
    });

    this.#view.bindResetFilters(() => {
      this.#searchQuery = '';
      this.#locationFilter = 'all';
      this.#view.resetFilterControls();
      this.#applyFilter();
    });
  }

  #applyFilter() {
    let filtered = this.#allStories;

    if (this.#searchQuery) {
      filtered = filtered.filter((story) => {
        const name = (story.name || '').toLowerCase();
        const desc = (story.description || '').toLowerCase();
        return name.includes(this.#searchQuery) || desc.includes(this.#searchQuery);
      });
    }

    if (this.#locationFilter === 'with-location') {
      filtered = filtered.filter((story) => story.lat != null && story.lon != null);
    } else if (this.#locationFilter === 'without-location') {
      filtered = filtered.filter((story) => story.lat == null || story.lon == null);
    }

    this.#view.renderStories(filtered);

    const filteredMapped = filtered.filter((story) => story.lat != null && story.lon != null);
    this.#view.updateMarkers(filteredMapped);

    this.#updateStats(filtered.length, filteredMapped.length);

    if (this.#activeStoryId) {
      const stillVisible = filtered.some((s) => s.id === this.#activeStoryId);
      if (stillVisible) {
        this.#view.highlightCard(this.#activeStoryId);
        this.#view.setActiveMarker(this.#activeStoryId);
      } else {
        this.#activeStoryId = null;
      }
    }
  }

  #updateStats(filteredCount = null, filteredMappedCount = null) {
    const total = this.#allStories.length;
    const mapped = this.#allStories.filter((s) => s.lat != null && s.lon != null).length;

    this.#view.updateCounts({
      filteredTotal: filteredCount !== null ? filteredCount : total,
      filteredMapped: filteredMappedCount !== null ? filteredMappedCount : mapped,
    });
  }

  handleCardFocusOnMap(storyId) {
    this.#activeStoryId = storyId;
    this.#view.highlightCard(storyId);
    this.#view.focusStoryOnMap(storyId);
  }

  handleMarkerSelected(storyId) {
    this.#activeStoryId = storyId;
    this.#view.setActiveMarker(storyId);
    this.#view.highlightCard(storyId);
  }
}

export default HomePresenter;
