class AddStoryPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  init() {
    this.#view.bindSubmit(this.handleSubmit.bind(this));
  }

  async handleSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    this.#view.clearAlert();
    this.#view.clearFieldErrors();

    const description = this.#view.getDescription();
    const photo = this.#view.getPhoto();
    const { lat, lon } = this.#view.getCoordinates();

    let hasError = false;

    if (!photo) {
      this.#view.showPhotoError('Foto wajib disertakan. Silakan unggah file gambar atau ambil dari kamera langsung.');
      hasError = true;
    } else if (photo.size > 1024 * 1024) {
      const sizeMB = (photo.size / (1024 * 1024)).toFixed(2);
      this.#view.showPhotoError(`Ukuran foto terlalu besar (${sizeMB} MB). Maksimal ukuran file adalah 1 MB.`);
      hasError = true;
    }

    if (!description || !description.trim()) {
      this.#view.showDescriptionError('Deskripsi cerita tidak boleh kosong.');
      hasError = true;
    } else if (description.trim().length < 5) {
      this.#view.showDescriptionError('Deskripsi cerita terlalu singkat (minimal 5 karakter).');
      hasError = true;
    }

    if (lat !== null && lat !== undefined && lat !== '') {
      const latNum = Number(lat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        this.#view.showLocationError('Nilai latitude tidak valid (-90 s/d 90).');
        hasError = true;
      }
    }

    if (lon !== null && lon !== undefined && lon !== '') {
      const lonNum = Number(lon);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        this.#view.showLocationError('Nilai longitude tidak valid (-180 s/d 180).');
        hasError = true;
      }
    }

    if (hasError) {
      this.#view.showError('Terdapat isian formulir yang belum sesuai. Silakan periksa kembali kolom input di atas.');
      return;
    }

    this.#view.showLoading();

    try {
      const response = await this.#model.addStory({
        description: description.trim(),
        photo,
        lat: (lat !== null && lat !== undefined && lat !== '') ? Number(lat) : undefined,
        lon: (lon !== null && lon !== undefined && lon !== '') ? Number(lon) : undefined,
      });

      this.#view.showSuccess(
        response.message || 'Cerita Anda berhasil dibagikan! Mengalihkan ke beranda...'
      );

      this.#view.stopCamera();

      setTimeout(() => {
        this.#view.navigateTo('#/');
      }, 1200);
    } catch (error) {
      console.error('Error saat menambahkan cerita baru:', error);
      this.#view.showError(
        error.message || 'Gagal mengirimkan cerita baru ke API. Silakan coba kembali.'
      );
    } finally {
      this.#view.hideLoading();
    }
  }
}

export default AddStoryPresenter;
