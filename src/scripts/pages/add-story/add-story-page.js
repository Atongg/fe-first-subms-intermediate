import leaflet from 'leaflet';
import AddStoryPresenter from './add-story-presenter.js';
import StoryModel from '../../data/story-model.js';

import markerPinIcon from '@/assets/icons/marker-pin.svg?raw';
import markerPinActiveIcon from '@/assets/icons/marker-pin-active.svg?raw';
import cameraIcon from '@/assets/icons/camera.svg?raw';
import imageIcon from '@/assets/icons/image.svg?raw';
import crosshairIcon from '@/assets/icons/crosshair.svg?raw';
import trashIcon from '@/assets/icons/trash.svg?raw';
import xIcon from '@/assets/icons/x.svg?raw';
import refreshIcon from '@/assets/icons/refresh-cw.svg?raw';

function createMarkerIcon(isActive = true) {
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

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default class AddStoryPage {
  #presenter = null;
  #map = null;
  #marker = null;
  #mediaStream = null;
  #selectedPhotoFile = null;
  #photoSource = null; // 'file' | 'camera'
  #previewUrl = null;
  #onUnloadHandler = () => {
    this.stopCamera();
  };

  async render() {
    return `
      <section class="add-story-section" aria-label="Halaman Tambah Cerita">
        <div class="container py-4">
          <header class="add-story-header">
            <div class="header-breadcrumb">
              <a href="#/" class="back-link">
                <span aria-hidden="true">&larr;</span> Kembali ke Beranda
              </a>
            </div>
            <div class="header-titles">
              <h1 class="page-title">Tambah Cerita Baru</h1>
              <p class="page-subtitle">
                Bagikan pengalaman, kisah, atau foto momen menarik Anda dan sematkan lokasinya pada peta interaktif.
              </p>
            </div>
          </header>

          <div id="alert-container" class="alert-container" role="alert" aria-live="polite"></div>

          <form id="add-story-form" class="add-story-form card-surface" novalidate>
            <fieldset class="form-fieldset">
              <legend class="fieldset-legend">
                <span class="legend-number">1</span>
                <span class="legend-text">Foto Cerita</span>
                <span class="required-badge">*Wajib</span>
              </legend>
              <p class="fieldset-description">
                Pilih metode input gambar: unggah berkas dari perangkat Anda atau langsung menggunakan kamera.
              </p>

              <div class="photo-mode-switcher" role="tablist" aria-label="Pilihan Sumber Foto">
                <button
                  type="button"
                  id="tab-mode-file"
                  class="mode-tab active"
                  role="tab"
                  aria-selected="true"
                  aria-controls="panel-file-upload"
                >
                  ${imageIcon}
                  <span>Unggah Berkas</span>
                </button>
                <button
                  type="button"
                  id="tab-mode-camera"
                  class="mode-tab"
                  role="tab"
                  aria-selected="false"
                  aria-controls="panel-camera-capture"
                >
                  ${cameraIcon}
                  <span>Gunakan Kamera</span>
                </button>
              </div>

              <div id="panel-file-upload" class="photo-panel" role="tabpanel" aria-labelledby="tab-mode-file">
                <div id="dropzone" class="file-dropzone" tabindex="0" role="button" aria-label="Pilih atau seret gambar ke sini">
                  <input
                    type="file"
                    id="photo-input"
                    name="photo"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    class="visually-hidden"
                  />
                  <div class="dropzone-content">
                    <span class="dropzone-icon" aria-hidden="true">📁</span>
                    <p class="dropzone-primary-text">
                      <strong>Klik untuk memilih gambar</strong> atau seret dan lepas gambar ke area ini
                    </p>
                    <p class="dropzone-secondary-text">Format: JPG, PNG, WEBP &bull; Maksimal ukuran 1 MB</p>
                  </div>
                </div>
              </div>

              <div id="panel-camera-capture" class="photo-panel hidden" role="tabpanel" aria-labelledby="tab-mode-camera">
                <div class="camera-stream-container">
                  <div id="camera-loading" class="camera-loading-overlay hidden">
                    <span class="btn-spinner large-spinner" aria-hidden="true"></span>
                    <p>Memulai akses kamera...</p>
                  </div>

                  <div id="camera-error-message" class="camera-error-overlay hidden" role="alert">
                    <p id="camera-error-text">Tidak dapat mengakses kamera.</p>
                    <button type="button" id="btn-retry-camera" class="btn btn-sm btn-outline">
                      ${refreshIcon} <span>Coba Lagi</span>
                    </button>
                  </div>

                  <video
                    id="camera-video"
                    class="camera-video-feed"
                    autoplay
                    playsinline
                    muted
                    aria-label="Feed video kamera langsung"
                  ></video>

                  <div class="camera-overlay-frame" aria-hidden="true">
                    <span class="frame-corner top-left"></span>
                    <span class="frame-corner top-right"></span>
                    <span class="frame-corner bottom-left"></span>
                    <span class="frame-corner bottom-right"></span>
                  </div>
                </div>

                <div class="camera-controls">
                  <button type="button" id="btn-capture-photo" class="btn btn-primary btn-capture" title="Ambil foto saat ini">
                    ${cameraIcon}
                    <span>Jepret Foto</span>
                  </button>
                  <button type="button" id="btn-close-camera" class="btn btn-outline" title="Tutup kamera dan kembali ke unggah berkas">
                    ${xIcon}
                    <span>Tutup Kamera</span>
                  </button>
                </div>
              </div>

              <div id="photo-preview-wrapper" class="photo-preview-wrapper hidden">
                <div class="photo-preview-card">
                  <div class="preview-image-container">
                    <img id="photo-preview-img" src="" alt="Pratinjau foto yang dipilih" class="preview-image" />
                  </div>
                  <div class="preview-details">
                    <div class="preview-info-header">
                      <span id="preview-source-badge" class="badge-source">Unggahan Berkas</span>
                      <span id="preview-file-size" class="preview-file-size">0 KB</span>
                    </div>
                    <p id="preview-file-name" class="preview-file-name">foto-cerita.jpg</p>
                    <div class="preview-actions">
                      <button type="button" id="btn-retake-photo" class="btn btn-sm btn-outline">
                        ${refreshIcon}
                        <span id="btn-retake-text">Pilih Ulang</span>
                      </button>
                      <button type="button" id="btn-remove-photo" class="btn btn-sm btn-outline-danger">
                        ${trashIcon}
                        <span>Hapus Foto</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <span id="photo-error" class="field-error" aria-live="polite"></span>
            </fieldset>

            <fieldset class="form-fieldset">
              <legend class="fieldset-legend">
                <span class="legend-number">2</span>
                <span class="legend-text">Deskripsi Cerita</span>
                <span class="required-badge">*Wajib</span>
              </legend>
              <p class="fieldset-description">
                Tuliskan kisah, kesan, atau keterangan lengkap mengenai foto dan momen yang Anda bagikan.
              </p>

              <div class="form-group">
                <label for="description" class="form-label">Teks Deskripsi</label>
                <textarea
                  id="description"
                  name="description"
                  class="form-input form-textarea"
                  rows="4"
                  placeholder="Ceritakan kisah menarik atau pengalaman Anda di sini (minimal 5 karakter)..."
                  required
                ></textarea>
                <div class="textarea-footer">
                  <span id="description-char-count" class="char-counter">0 karakter</span>
                  <span class="char-hint">Minimal 5 karakter</span>
                </div>
                <span id="description-error" class="field-error" aria-live="polite"></span>
              </div>
            </fieldset>

            <fieldset class="form-fieldset">
              <legend class="fieldset-legend">
                <span class="legend-number">3</span>
                <span class="legend-text">Lokasi pada Peta Digital</span>
                <span class="optional-badge">Disarankan</span>
              </legend>
              <p class="fieldset-description">
                Pilih titik lokasi cerita dengan <strong>mengklik langsung pada peta digital</strong> di bawah. Anda juga dapat menggunakan tombol deteksi lokasi perangkat Anda.
              </p>

              <div class="map-picker-card">
                <div class="map-picker-toolbar">
                  <div class="location-status-badge">
                    <span class="status-indicator" id="status-indicator"></span>
                    <span id="location-status-text">Belum ada titik dipilih (klik peta di bawah)</span>
                  </div>

                  <div class="map-picker-actions">
                    <button type="button" id="btn-current-location" class="btn btn-xs btn-outline" title="Gunakan koordinat GPS perangkat">
                      ${crosshairIcon}
                      <span>Lokasi Saya</span>
                    </button>
                    <button type="button" id="btn-clear-location" class="btn btn-xs btn-outline-danger" title="Kosongkan pilihan titik koordinat">
                      ${trashIcon}
                      <span>Hapus Titik</span>
                    </button>
                  </div>
                </div>

                <div id="add-story-map" class="digital-map form-digital-map" role="region" aria-label="Peta Digital Pemilihan Lokasi"></div>

                <div class="coordinates-input-grid">
                  <div class="form-group">
                    <label for="latitude-input" class="form-label">Latitude</label>
                    <input
                      type="text"
                      id="latitude-input"
                      name="lat"
                      class="form-input coord-input"
                      placeholder="Contoh: -6.208800"
                      readonly
                    />
                  </div>
                  <div class="form-group">
                    <label for="longitude-input" class="form-label">Longitude</label>
                    <input
                      type="text"
                      id="longitude-input"
                      name="lon"
                      class="form-input coord-input"
                      placeholder="Contoh: 106.845600"
                      readonly
                    />
                  </div>
                </div>
                <p class="coords-note">
                  Nilai latitude dan longitude terisi secara otomatis ketika Anda mengklik salah satu titik lokasi di peta.
                </p>
                <span id="location-error" class="field-error" aria-live="polite"></span>
              </div>
            </fieldset>

            <div class="form-actions-wrapper">
              <button type="submit" id="submit-button" class="btn btn-primary btn-submit-story">
                <span class="btn-text">Bagikan Cerita</span>
                <span class="btn-spinner hidden" aria-hidden="true"></span>
              </button>
              <a href="#/" class="btn btn-outline btn-cancel-story">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#initMap();
    this.#setupPhotoSourceTabs();
    this.#setupDropzone();
    this.#setupCameraControls();
    this.#setupPreviewActions();
    this.#setupDescriptionCounter();
    this.#setupLocationButtons();

    // Inisialisasi Presenter (MVP)
    this.#presenter = new AddStoryPresenter({
      view: this,
      model: StoryModel,
    });
    this.#presenter.init();

    window.addEventListener('beforeunload', this.#onUnloadHandler);
    window.addEventListener('pagehide', this.#onUnloadHandler);
  }

  destroy() {
    window.removeEventListener('beforeunload', this.#onUnloadHandler);
    window.removeEventListener('pagehide', this.#onUnloadHandler);

    // Pastikan media stream kamera benar-benar dimatikan
    this.stopCamera();

    // Hapus peta Leaflet
    if (this.#map) {
      try {
        this.#map.remove();
      } catch (err) {
        console.warn('Gagal menghapus instance peta:', err);
      }
      this.#map = null;
    }
    this.#marker = null;

    if (this.#previewUrl) {
      URL.revokeObjectURL(this.#previewUrl);
      this.#previewUrl = null;
    }
  }

  // =========================================================================
  // MAP HANDLING (Leaflet Digital Map with click event)
  // =========================================================================

  #initMap() {
    const mapContainer = document.querySelector('#add-story-map');
    if (!mapContainer) return;

    // Titik pusat awal (Indonesia)
    const defaultLat = -2.5489;
    const defaultLng = 118.0149;

    this.#map = leaflet.map('add-story-map', {
      center: [defaultLat, defaultLng],
      zoom: 5,
      scrollWheelZoom: false,
    });

    this.#map.on('focus', () => {
      this.#map.scrollWheelZoom.enable();
    });
    this.#map.on('blur', () => {
      this.#map.scrollWheelZoom.disable();
    });

    // Pilihan Tile Layers (bebas API key)
    const osmStandard = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    });

    const osmHot = leaflet.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, HOT',
    });

    const esriSatellite = leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    });

    osmStandard.addTo(this.#map);

    const baseLayers = {
      'OpenStreetMap (Standar)': osmStandard,
      'OpenStreetMap HOT': osmHot,
      'Esri Satelit': esriSatellite,
    };

    leaflet.control.layers(baseLayers, null, { position: 'topright' }).addTo(this.#map);

    // Kriteria 1: Pemilihan nilai latitude dan longitude dilakukan melalui event klik di peta digital
    this.#map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      this.setLocation(lat, lng);
    });

    setTimeout(() => {
      if (this.#map) {
        this.#map.invalidateSize();
      }
    }, 200);
  }

  setLocation(lat, lng, zoomLevel = null) {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    const latInput = document.querySelector('#latitude-input');
    const lonInput = document.querySelector('#longitude-input');
    const statusText = document.querySelector('#location-status-text');
    const indicator = document.querySelector('#status-indicator');

    if (latInput) latInput.value = roundedLat;
    if (lonInput) lonInput.value = roundedLng;

    if (statusText) {
      statusText.innerHTML = `<strong>Lokasi Terpilih:</strong> Lat ${roundedLat}, Lon ${roundedLng}`;
    }
    if (indicator) {
      indicator.classList.add('indicator-active');
    }

    if (!this.#map) return;

    if (this.#marker) {
      this.#marker.setLatLng([roundedLat, roundedLng]);
    } else {
      this.#marker = leaflet.marker([roundedLat, roundedLng], {
        icon: createMarkerIcon(true),
        draggable: true,
      }).addTo(this.#map);

      // Sinkronisasi saat marker diseret
      this.#marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        this.setLocation(newPos.lat, newPos.lng);
      });
    }

    this.#marker
      .bindPopup(`
        <div style="font-family: inherit; font-size: 0.85rem; line-height: 1.4;">
          <strong>Titik Cerita Anda</strong><br/>
          <span>Lat: ${roundedLat}</span><br/>
          <span>Lon: ${roundedLng}</span>
        </div>
      `)
      .openPopup();

    if (zoomLevel) {
      this.#map.setView([roundedLat, roundedLng], zoomLevel, { animate: true });
    }

    this.clearLocationError();
  }

  clearLocation() {
    const latInput = document.querySelector('#latitude-input');
    const lonInput = document.querySelector('#longitude-input');
    const statusText = document.querySelector('#location-status-text');
    const indicator = document.querySelector('#status-indicator');

    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';

    if (statusText) {
      statusText.textContent = 'Belum ada titik dipilih (klik peta di bawah)';
    }
    if (indicator) {
      indicator.classList.remove('indicator-active');
    }

    if (this.#marker && this.#map) {
      this.#map.removeLayer(this.#marker);
      this.#marker = null;
    }
  }

  #setupLocationButtons() {
    const btnCurrent = document.querySelector('#btn-current-location');
    const btnClear = document.querySelector('#btn-clear-location');

    if (btnCurrent) {
      btnCurrent.addEventListener('click', () => {
        if (!navigator.geolocation) {
          this.showLocationError('Geolokasi tidak didukung oleh browser Anda.');
          return;
        }

        btnCurrent.disabled = true;
        const originalText = btnCurrent.innerHTML;
        btnCurrent.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> <span>Mencari...</span>`;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            btnCurrent.disabled = false;
            btnCurrent.innerHTML = originalText;
            this.setLocation(position.coords.latitude, position.coords.longitude, 14);
          },
          (error) => {
            btnCurrent.disabled = false;
            btnCurrent.innerHTML = originalText;
            let message = 'Gagal mendeteksi lokasi saat ini.';
            if (error.code === error.PERMISSION_DENIED) {
              message = 'Izin akses lokasi ditolak oleh pengguna.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Informasi lokasi tidak tersedia saat ini.';
            }
            this.showLocationError(message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.clearLocation();
      });
    }
  }

  // =========================================================================
  // PHOTO & CAMERA SOURCE MANAGEMENT (MediaStream)
  // =========================================================================

  #setupPhotoSourceTabs() {
    const tabFile = document.querySelector('#tab-mode-file');
    const tabCamera = document.querySelector('#tab-mode-camera');
    const panelFile = document.querySelector('#panel-file-upload');
    const panelCamera = document.querySelector('#panel-camera-capture');

    if (tabFile && tabCamera) {
      tabFile.addEventListener('click', () => {
        // Matikan kamera jika sebelumnya aktif
        this.stopCamera();

        tabFile.classList.add('active');
        tabFile.setAttribute('aria-selected', 'true');
        tabCamera.classList.remove('active');
        tabCamera.setAttribute('aria-selected', 'false');

        if (panelFile) panelFile.classList.remove('hidden');
        if (panelCamera) panelCamera.classList.add('hidden');
      });

      tabCamera.addEventListener('click', async () => {
        tabCamera.classList.add('active');
        tabCamera.setAttribute('aria-selected', 'true');
        tabFile.classList.remove('active');
        tabFile.setAttribute('aria-selected', 'false');

        if (panelCamera) panelCamera.classList.remove('hidden');
        if (panelFile) panelFile.classList.add('hidden');

        // Mulai stream kamera
        await this.startCamera();
      });
    }
  }

  #setupDropzone() {
    const dropzone = document.querySelector('#dropzone');
    const fileInput = document.querySelector('#photo-input');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('dropzone-active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dropzone-active');
    });

    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('dropzone-active');
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.#handleSelectedFile(files[0], 'file');
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.#handleSelectedFile(fileInput.files[0], 'file');
      }
    });
  }

  #handleSelectedFile(file, source = 'file') {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showPhotoError('Berkas yang dipilih harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.showPhotoError(`Ukuran foto terlalu besar (${sizeMB} MB). Maksimal ukuran file adalah 1 MB.`);
      return;
    }

    this.clearPhotoError();
    this.#selectedPhotoFile = file;
    this.#photoSource = source;

    this.#renderPhotoPreview(file, source);
  }

  #renderPhotoPreview(file, source) {
    const previewWrapper = document.querySelector('#photo-preview-wrapper');
    const previewImg = document.querySelector('#photo-preview-img');
    const fileNameEl = document.querySelector('#preview-file-name');
    const fileSizeEl = document.querySelector('#preview-file-size');
    const sourceBadge = document.querySelector('#preview-source-badge');
    const panelFile = document.querySelector('#panel-file-upload');
    const panelCamera = document.querySelector('#panel-camera-capture');

    if (!previewWrapper || !previewImg) return;

    if (this.#previewUrl) {
      URL.revokeObjectURL(this.#previewUrl);
    }

    this.#previewUrl = URL.createObjectURL(file);
    previewImg.src = this.#previewUrl;

    if (fileNameEl) fileNameEl.textContent = file.name || 'foto-cerita.jpg';
    if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);

    if (sourceBadge) {
      sourceBadge.textContent = source === 'camera' ? '📷 Dari Kamera' : '📁 Dari Berkas';
      sourceBadge.className = `badge-source ${source === 'camera' ? 'badge-camera' : 'badge-file'}`;
    }

    previewWrapper.classList.remove('hidden');

    // Sembunyikan panel upload / kamera saat preview tampil
    if (panelFile) panelFile.classList.add('hidden');
    if (panelCamera) panelCamera.classList.add('hidden');
  }

  #setupPreviewActions() {
    const btnRemove = document.querySelector('#btn-remove-photo');
    const btnRetake = document.querySelector('#btn-retake-photo');

    if (btnRemove) {
      btnRemove.addEventListener('click', () => {
        this.#clearPhotoSelection();
      });
    }

    if (btnRetake) {
      btnRetake.addEventListener('click', async () => {
        const wasFromCamera = this.#photoSource === 'camera';
        this.#clearPhotoSelection();

        if (wasFromCamera) {
          const tabCamera = document.querySelector('#tab-mode-camera');
          if (tabCamera) tabCamera.click();
        } else {
          const tabFile = document.querySelector('#tab-mode-file');
          if (tabFile) tabFile.click();
          const fileInput = document.querySelector('#photo-input');
          if (fileInput) fileInput.click();
        }
      });
    }
  }

  #clearPhotoSelection() {
    this.#selectedPhotoFile = null;
    this.#photoSource = null;

    if (this.#previewUrl) {
      URL.revokeObjectURL(this.#previewUrl);
      this.#previewUrl = null;
    }

    const previewWrapper = document.querySelector('#photo-preview-wrapper');
    const previewImg = document.querySelector('#photo-preview-img');
    const fileInput = document.querySelector('#photo-input');
    const panelFile = document.querySelector('#panel-file-upload');

    if (previewWrapper) previewWrapper.classList.add('hidden');
    if (previewImg) previewImg.src = '';
    if (fileInput) fileInput.value = '';

    const tabFile = document.querySelector('#tab-mode-file');
    const tabCamera = document.querySelector('#tab-mode-camera');
    if (tabFile && tabFile.classList.contains('active') && panelFile) {
      panelFile.classList.remove('hidden');
    } else if (tabCamera && tabCamera.classList.contains('active')) {
      const panelCamera = document.querySelector('#panel-camera-capture');
      if (panelCamera) panelCamera.classList.remove('hidden');
    } else if (panelFile) {
      panelFile.classList.remove('hidden');
    }
  }

  // =========================================================================
  // CAMERA MEDIA STREAM MANAGEMENT
  // =========================================================================

  async startCamera() {
    const video = document.querySelector('#camera-video');
    const loadingOverlay = document.querySelector('#camera-loading');
    const errorOverlay = document.querySelector('#camera-error-message');
    const errorText = document.querySelector('#camera-error-text');

    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (errorOverlay && errorText) {
        errorText.textContent = 'Browser Anda tidak mendukung akses kamera (MediaStream).';
        errorOverlay.classList.remove('hidden');
      }
      return;
    }

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    if (errorOverlay) errorOverlay.classList.add('hidden');

    try {
      this.#mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (video) {
        video.srcObject = this.#mediaStream;
        await video.play();
      }
    } catch (err) {
      console.warn('Gagal mengakses kamera:', err);
      let message = 'Tidak dapat mengakses kamera perangkat.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Izin kamera ditolak. Silakan berikan izin akses kamera pada browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Tidak ditemukan perangkat kamera yang tersedia.';
      } else if (err.name === 'NotReadableError') {
        message = 'Kamera sedang digunakan oleh aplikasi lain.';
      }

      if (errorOverlay && errorText) {
        errorText.textContent = message;
        errorOverlay.classList.remove('hidden');
      }
    } finally {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
  }

  /**
   * Kriteria 3: Pastikan media stream ditutup ketika sudah tidak digunakan.
   */
  stopCamera() {
    if (this.#mediaStream) {
      this.#mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error saat menghentikan track kamera:', e);
        }
      });
      this.#mediaStream = null;
    }

    const video = document.querySelector('#camera-video');
    if (video) {
      video.srcObject = null;
    }
  }

  #setupCameraControls() {
    const btnCapture = document.querySelector('#btn-capture-photo');
    const btnClose = document.querySelector('#btn-close-camera');
    const btnRetry = document.querySelector('#btn-retry-camera');

    if (btnCapture) {
      btnCapture.addEventListener('click', () => {
        this.#capturePhotoFromStream();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.stopCamera();
        const tabFile = document.querySelector('#tab-mode-file');
        if (tabFile) tabFile.click();
      });
    }

    if (btnRetry) {
      btnRetry.addEventListener('click', async () => {
        await this.startCamera();
      });
    }
  }

  #capturePhotoFromStream() {
    const video = document.querySelector('#camera-video');
    if (!video || !this.#mediaStream || video.videoWidth === 0) {
      this.showPhotoError('Aliran video kamera belum siap untuk dijepret.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror foto agar sesuai dengan tampilan video user
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.showPhotoError('Gagal memproses hasil jepretan kamera.');
          return;
        }

        const fileName = `kamera-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // Kriteria 3: Pastikan media stream ditutup ketika sudah tidak digunakan
        this.stopCamera();

        this.#handleSelectedFile(file, 'camera');
      },
      'image/jpeg',
      0.85
    );
  }

  // =========================================================================
  // DESCRIPTION COUNTER & VALIDATION HELPERS
  // =========================================================================

  #setupDescriptionCounter() {
    const textarea = document.querySelector('#description');
    const counter = document.querySelector('#description-char-count');

    if (textarea && counter) {
      textarea.addEventListener('input', () => {
        const length = textarea.value.trim().length;
        counter.textContent = `${length} karakter`;
        if (length >= 5) {
          this.clearDescriptionError();
        }
      });
    }
  }

  // =========================================================================
  // VIEW INTERFACE FOR PRESENTER (MVP)
  // =========================================================================

  bindSubmit(handler) {
    const form = document.querySelector('#add-story-form');
    if (form) {
      form.addEventListener('submit', handler);
    }
  }

  getDescription() {
    const textarea = document.querySelector('#description');
    return textarea ? textarea.value : '';
  }

  getPhoto() {
    return this.#selectedPhotoFile;
  }

  getCoordinates() {
    const latInput = document.querySelector('#latitude-input');
    const lonInput = document.querySelector('#longitude-input');
    return {
      lat: latInput && latInput.value ? latInput.value : null,
      lon: lonInput && lonInput.value ? lonInput.value : null,
    };
  }

  showDescriptionError(message) {
    const errorEl = document.querySelector('#description-error');
    const textarea = document.querySelector('#description');
    if (errorEl) errorEl.textContent = message;
    if (textarea) textarea.classList.add('input-invalid');
  }

  clearDescriptionError() {
    const errorEl = document.querySelector('#description-error');
    const textarea = document.querySelector('#description');
    if (errorEl) errorEl.textContent = '';
    if (textarea) textarea.classList.remove('input-invalid');
  }

  showPhotoError(message) {
    const errorEl = document.querySelector('#photo-error');
    if (errorEl) errorEl.textContent = message;
  }

  clearPhotoError() {
    const errorEl = document.querySelector('#photo-error');
    if (errorEl) errorEl.textContent = '';
  }

  showLocationError(message) {
    const errorEl = document.querySelector('#location-error');
    if (errorEl) errorEl.textContent = message;
  }

  clearLocationError() {
    const errorEl = document.querySelector('#location-error');
    if (errorEl) errorEl.textContent = '';
  }

  clearFieldErrors() {
    this.clearDescriptionError();
    this.clearPhotoError();
    this.clearLocationError();
  }

  showSuccess(message) {
    const container = document.querySelector('#alert-container');
    if (!container) return;
    container.innerHTML = `
      <div class="alert alert-success" role="alert">
        <span class="alert-icon" aria-hidden="true">✓</span>
        <span class="alert-message">${message}</span>
      </div>
    `;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showError(message) {
    const container = document.querySelector('#alert-container');
    if (!container) return;
    container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <span class="alert-icon" aria-hidden="true">✕</span>
        <span class="alert-message">${message}</span>
      </div>
    `;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  clearAlert() {
    const container = document.querySelector('#alert-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  showLoading() {
    const submitBtn = document.querySelector('#submit-button');
    if (submitBtn) {
      submitBtn.disabled = true;
      const spinner = submitBtn.querySelector('.btn-spinner');
      const text = submitBtn.querySelector('.btn-text');
      if (spinner) spinner.classList.remove('hidden');
      if (text) text.textContent = 'Mengirim Cerita...';
    }
  }

  hideLoading() {
    const submitBtn = document.querySelector('#submit-button');
    if (submitBtn) {
      submitBtn.disabled = false;
      const spinner = submitBtn.querySelector('.btn-spinner');
      const text = submitBtn.querySelector('.btn-text');
      if (spinner) spinner.classList.add('hidden');
      if (text) text.textContent = 'Bagikan Cerita';
    }
  }

  navigateTo(hash) {
    window.location.hash = hash;
  }
}
