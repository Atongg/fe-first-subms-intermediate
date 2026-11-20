import leaflet from 'leaflet';
import HomePresenter from './home-presenter.js';
import HomeModel from '../../data/home-model.js';
import markerPinIcon from '@/assets/icons/marker-pin.svg?raw';
import markerPinActiveIcon from '@/assets/icons/marker-pin-active.svg?raw';
import compassIcon from '@/assets/icons/compass.svg?raw';
import searchIcon from '@/assets/icons/search.svg?raw';
import navigationIcon from '@/assets/icons/navigation.svg?raw';
import chevronDownIcon from '@/assets/icons/chevron-down.svg?raw';
import plusIcon from '@/assets/icons/plus.svg?raw';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateString) {
  if (!dateString) return 'Waktu tidak diketahui';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

function createMarkerIcon(isActive = false) {
  return leaflet.divIcon({
    className: `map-marker-wrapper ${isActive ? 'marker-is-active' : ''}`,
    html: `
      <div class="marker-pin ${isActive ? 'pin-active' : ''}">
        ${isActive ? markerPinActiveIcon : markerPinIcon}
        ${isActive ? '<span class="marker-pulse-ring" aria-hidden="true"></span>' : ''}
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 39],
    popupAnchor: [0, -39],
  });
}

export default class HomePage {
  #presenter = null;
  #map = null;
  #markersLayer = null;
  #markerMap = new Map();
  #activeMarkerId = null;
  #onMarkerClickCallback = null;

  async render() {
    return `
      <section class="home-section" aria-label="Halaman Beranda">
        <div class="container py-4">
          <header class="home-header">
            <div class="home-header-content">
              <h1 class="page-title">Peta & Cerita Pengguna</h1>
              <p class="page-subtitle">
                Jelajahi cerita menarik dari berbagai daerah dan visualisasikan persebarannya pada peta digital interaktif.
              </p>
            </div>
            <div class="home-header-actions" aria-label="Aksi Beranda">
              <a href="#/add" class="btn btn-primary btn-sm btn-add-story-header" title="Tambah Cerita Baru">
                ${plusIcon}
                <span>Tambah Cerita</span>
              </a>
            </div>
          </header>

          <div class="map-card card-surface" aria-label="Bagian Peta Digital">
            <div class="map-toolbar">
              <div class="map-toolbar-info">
                <span class="map-toolbar-icon" aria-hidden="true">🗺️</span>
                <h2 class="map-toolbar-title">Peta Persebaran Cerita</h2>
                <span class="map-badge">Multiple Tile Layer</span>
              </div>
              <div class="map-toolbar-actions">
                <button id="btn-reset-map" class="btn btn-sm btn-outline" type="button" title="Pusatkan kembali peta ke seluruh marker">
                  ${compassIcon}
                  <span>Pusatkan Peta</span>
                </button>
              </div>
            </div>

            <div id="map" class="digital-map" role="region" aria-label="Peta Digital Interaktif OpenStreetMap"></div>

            <div class="map-tips-bar">
              <span class="map-tips-icon" aria-hidden="true">💡</span>
              <p class="map-tips-text">
                <strong>Fitur Interaktif:</strong> Gunakan menu <strong>Layer Control</strong> di pojok kanan atas peta untuk mengganti tile layer (OpenStreetMap, HOT, Topografi, Citra Satelit, CyclOSM). Klik marker di peta untuk melihat detail, atau klik <em>"Lihat di Peta"</em> pada kartu cerita untuk memusatkan lokasi secara otomatis.
              </p>
            </div>
          </div>

          <div class="stories-filter-bar card-surface">
            <div class="search-box">
              ${searchIcon}
              <input 
                type="search" 
                id="search-input" 
                class="form-input search-input" 
                placeholder="Cari cerita berdasarkan nama atau deskripsi..." 
                aria-label="Cari cerita"
              />
            </div>

            <div class="filter-group">
              <label for="filter-location-select" class="filter-label">Filter:</label>
              <div class="filter-select-wrapper">
                <select id="filter-location-select" class="form-select filter-select" aria-label="Filter berdasarkan keberadaan lokasi">
                  <option value="all">Semua Cerita</option>
                  <option value="with-location">Hanya dengan Lokasi (Peta)</option>
                  <option value="without-location">Tanpa Lokasi</option>
                </select>
                ${chevronDownIcon}
              </div>
            </div>
          </div>

          <section class="stories-section" aria-label="Daftar Cerita">
            <div class="stories-header">
              <h2 class="stories-title">Daftar Cerita</h2>
              <span id="filtered-count" class="filtered-badge">Memuat data...</span>
            </div>

            <div id="home-loading" class="home-loading-state hidden">
              <div class="btn-spinner large-spinner" aria-hidden="true"></div>
              <p>Memuat cerita dari API...</p>
            </div>

            <div id="home-error" class="alert alert-danger hidden" role="alert"></div>

            <div id="home-empty" class="home-empty-state hidden">
              <span class="empty-emoji" aria-hidden="true">🔍</span>
              <h3>Tidak Ada Cerita yang Cocok</h3>
              <p>Coba gunakan kata kunci pencarian lain atau ubah filter lokasi di atas.</p>
              <button id="btn-reset-filters" class="btn btn-primary btn-sm" type="button">Reset Filter & Pencarian</button>
            </div>

            <div id="stories-grid" class="data-grid"></div>
          </section>
        </div>
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

  destroy() {
    this.destroyMap();
  }

  destroyMap() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
    this.#markerMap.clear();
    this.#activeMarkerId = null;
  }

  initMap(storiesWithLocation, onMarkerClickCallback) {
    this.destroyMap();

    const mapContainer = document.querySelector('#map');
    if (!mapContainer) return;

    this.#onMarkerClickCallback = onMarkerClickCallback;

    this.#map = leaflet.map('map', {
      center: [-2.5489, 118.0149],
      zoom: 5,
      scrollWheelZoom: false,
    });

    this.#map.on('focus', () => {
      this.#map.scrollWheelZoom.enable();
    });
    this.#map.on('blur', () => {
      this.#map.scrollWheelZoom.disable();
    });

    const osmStandard = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor',
    });

    const osmHot = leaflet.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor, Style by <a href="https://www.hotosm.org/" target="_blank" rel="noopener noreferrer">HOT</a>',
    });

    const openTopo = leaflet.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Peta: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, SRTM | Style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
    });

    const esriSatellite = leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, dan GIS User Community',
    });

    const cyclOsm = leaflet.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor, &copy; <a href="https://www.cyclosm.org" target="_blank" rel="noopener noreferrer">CyclOSM</a>',
    });

    osmStandard.addTo(this.#map);

    const baseLayers = {
      'OpenStreetMap (Standar)': osmStandard,
      'OpenStreetMap HOT': osmHot,
      'OpenTopoMap (Topografi)': openTopo,
      'Esri Satelit (Citra Nyata)': esriSatellite,
      'CyclOSM (Siklus & Jalan)': cyclOsm,
    };

    leaflet.control.layers(baseLayers, null, {
      position: 'topright',
      collapsed: false,
    }).addTo(this.#map);

    this.#markersLayer = leaflet.featureGroup().addTo(this.#map);

    this.updateMarkers(storiesWithLocation);

    setTimeout(() => {
      if (this.#map) {
        this.#map.invalidateSize();
      }
    }, 250);
  }

  updateMarkers(storiesWithLocation) {
    if (!this.#map || !this.#markersLayer) return;

    this.#markersLayer.clearLayers();
    this.#markerMap.clear();

    const validStories = storiesWithLocation.filter(
      (s) => s.lat != null && s.lon != null && !isNaN(Number(s.lat)) && !isNaN(Number(s.lon))
    );

    validStories.forEach((story) => {
      const lat = Number(story.lat);
      const lon = Number(story.lon);

      const isActive = this.#activeMarkerId === story.id;
      const markerIcon = createMarkerIcon(isActive);

      const marker = leaflet.marker([lat, lon], {
        icon: markerIcon,
        title: story.name || 'Cerita',
      });

      const popupHtml = `
        <div class="map-popup-card">
          <div class="popup-img-container">
            <img 
              src="${escapeHtml(story.photoUrl)}" 
              alt="Foto cerita oleh ${escapeHtml(story.name || 'Pengguna')}" 
              class="popup-card-img"
              loading="lazy"
              onerror="this.onerror=null; this.src='https://placehold.co/300x180/e2e8f0/475569?text=Foto+Cerita';"
            />
          </div>
          <div class="popup-card-body">
            <h4 class="popup-card-title">${escapeHtml(story.name || 'Tanpa Nama')}</h4>
            <div class="popup-card-meta">
              <span class="popup-card-date">📅 ${formatDate(story.createdAt)}</span>
              <span class="popup-card-coords">📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}</span>
            </div>
            <p class="popup-card-desc">${escapeHtml(story.description || 'Tidak ada deskripsi.')}</p>
            <div class="popup-card-actions">
              <button type="button" class="btn btn-xs btn-primary btn-popup-sync" data-story-id="${story.id}">
                Lihat di Daftar ↓
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 290,
        minWidth: 250,
        className: 'custom-story-popup',
      });

      marker.on('click', () => {
        if (typeof this.#onMarkerClickCallback === 'function') {
          this.#onMarkerClickCallback(story.id);
        }
      });

      marker.addTo(this.#markersLayer);
      this.#markerMap.set(story.id, marker);
    });

    this.#map.off('popupopen');
    this.#map.on('popupopen', (e) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;

      const syncBtn = popupEl.querySelector('.btn-popup-sync');
      if (syncBtn) {
        syncBtn.addEventListener('click', () => {
          const storyId = syncBtn.getAttribute('data-story-id');
          if (storyId) {
            this.highlightCard(storyId);
          }
        });
      }
    });

    this.resetMapView();
  }

  resetMapView() {
    if (!this.#map || !this.#markersLayer) return;

    const bounds = this.#markersLayer.getBounds();
    if (bounds.isValid()) {
      this.#map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 14,
        animate: true,
      });
    } else {
      this.#map.setView([-2.5489, 118.0149], 5);
    }
  }

  focusStoryOnMap(storyId) {
    const marker = this.#markerMap.get(storyId);
    if (!marker || !this.#map) return;

    const mapElement = document.querySelector('#map');
    if (mapElement) {
      const rect = mapElement.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isVisible) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const latLng = marker.getLatLng();
    this.#map.flyTo(latLng, 14, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    this.setActiveMarker(storyId);
    marker.openPopup();
  }

  setActiveMarker(storyId) {
    if (this.#activeMarkerId && this.#markerMap.has(this.#activeMarkerId)) {
      const prevMarker = this.#markerMap.get(this.#activeMarkerId);
      prevMarker.setIcon(createMarkerIcon(false));
      prevMarker.setZIndexOffset(0);
    }

    this.#activeMarkerId = storyId;

    if (storyId && this.#markerMap.has(storyId)) {
      const curMarker = this.#markerMap.get(storyId);
      curMarker.setIcon(createMarkerIcon(true));
      curMarker.setZIndexOffset(1000);
    }
  }

  highlightCard(storyId) {
    const activeCards = document.querySelectorAll('.data-card.card-active');
    activeCards.forEach((c) => c.classList.remove('card-active'));

    const targetCard = document.querySelector(`#story-${storyId}`);
    if (targetCard) {
      targetCard.classList.add('card-active');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderStories(stories) {
    const grid = document.querySelector('#stories-grid');
    const emptyState = document.querySelector('#home-empty');
    if (!grid) return;

    if (!stories || stories.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = stories
      .map((story) => {
        const hasLocation =
          story.lat != null &&
          story.lon != null &&
          !isNaN(Number(story.lat)) &&
          !isNaN(Number(story.lon));

        const lat = hasLocation ? Number(story.lat) : null;
        const lon = hasLocation ? Number(story.lon) : null;

        return `
          <article 
            class="data-card story-card ${hasLocation ? 'has-coords' : ''}" 
            id="story-${story.id}" 
            data-id="${story.id}"
          >
            <div class="data-card-media">
              <img 
                src="${escapeHtml(story.photoUrl)}" 
                alt="Foto cerita oleh ${escapeHtml(story.name || 'Pengguna')}" 
                class="data-card-img" 
                loading="lazy"
                onerror="this.onerror=null; this.src='https://placehold.co/600x400/e2e8f0/475569?text=Foto+Cerita';"
              />
              ${hasLocation
            ? `<span class="card-badge badge-location" title="Memiliki titik koordinat peta">📍 Ada di Peta</span>`
            : `<span class="card-badge badge-muted">Tanpa Lokasi</span>`
          }
            </div>

            <div class="data-card-body">
              <div class="data-card-header">
                <h3 class="data-card-title">${escapeHtml(story.name || 'Tanpa Nama')}</h3>
                <time class="data-card-time" datetime="${escapeHtml(story.createdAt)}">
                  📅 ${formatDate(story.createdAt)}
                </time>
              </div>

              <p class="data-card-desc">${escapeHtml(story.description || 'Tidak ada deskripsi.')}</p>

              <div class="data-card-footer">
                ${hasLocation
            ? `
                    <div class="card-coordinates">
                      <span class="coord-label">Koordinat:</span>
                      <code class="coord-value">${lat.toFixed(4)}, ${lon.toFixed(4)}</code>
                    </div>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-primary btn-focus-map" 
                      data-story-id="${story.id}"
                      aria-label="Lihat lokasi ${escapeHtml(story.name)} di peta"
                    >
                      ${navigationIcon}
                      <span>Lihat di Peta</span>
                    </button>
                  `
            : `
                    <div class="no-coords-notice">
                      <span>Lokasi tidak disertakan pada cerita ini</span>
                    </div>
                  `
          }
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  updateCounts({ filteredTotal, filteredMapped }) {
    const filteredBadgeEl = document.querySelector('#filtered-count');

    if (filteredBadgeEl) {
      filteredBadgeEl.textContent = `Menampilkan ${filteredTotal} cerita (${filteredMapped} pada peta)`;
    }
  }

  resetFilterControls() {
    const searchInput = document.querySelector('#search-input');
    const filterSelect = document.querySelector('#filter-location-select');
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = 'all';
  }

  bindSearch(callback) {
    const searchInput = document.querySelector('#search-input');
    if (!searchInput) return;

    let timeoutId = null;
    searchInput.addEventListener('input', (event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(event.target.value);
      }, 200);
    });
  }

  bindFilterLocation(callback) {
    const filterSelect = document.querySelector('#filter-location-select');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', (event) => {
      callback(event.target.value);
    });
  }

  bindResetMap(callback) {
    const resetBtn = document.querySelector('#btn-reset-map');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => callback());
    }
  }

  bindResetFilters(callback) {
    const resetFilterBtn = document.querySelector('#btn-reset-filters');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => callback());
    }
  }

  bindFocusStoryOnMap(callback) {
    const grid = document.querySelector('#stories-grid');
    if (!grid) return;

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('.btn-focus-map');
      if (button) {
        event.stopPropagation();
        const storyId = button.getAttribute('data-story-id');
        if (storyId) callback(storyId);
        return;
      }

      const card = event.target.closest('.story-card.has-coords');
      if (card) {
        const storyId = card.getAttribute('data-id');
        if (storyId) callback(storyId);
      }
    });
  }

  bindFocusStoryInList(callback) {
    this._focusInListHandler = callback;
  }

  showLoading() {
    const loading = document.querySelector('#home-loading');
    if (loading) loading.classList.remove('hidden');
    const empty = document.querySelector('#home-empty');
    if (empty) empty.classList.add('hidden');
    const error = document.querySelector('#home-error');
    if (error) error.classList.add('hidden');
  }

  hideLoading() {
    const loading = document.querySelector('#home-loading');
    if (loading) loading.classList.add('hidden');
  }

  showEmptyState() {
    const empty = document.querySelector('#home-empty');
    if (empty) empty.classList.remove('hidden');
  }

  showError(message) {
    const errorEl = document.querySelector('#home-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }
}
