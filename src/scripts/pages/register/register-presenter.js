class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  init() {
    this.#view.bindSubmit(this.handleRegister.bind(this));
  }

  async handleRegister(event) {
    event.preventDefault();
    this.#view.clearAlert();
    this.#view.clearFieldErrors();

    const name = this.#view.getNameInput();
    const email = this.#view.getEmailInput();
    const password = this.#view.getPasswordInput();

    let hasValidationError = false;

    // Validasi format email yang benar
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      this.#view.showNameError('Nama lengkap tidak boleh kosong.');
      hasValidationError = true;
    }

    if (!email) {
      this.#view.showEmailError('Email tidak boleh kosong.');
      hasValidationError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      this.#view.showEmailError('Format email tidak valid. Masukkan email yang benar (contoh: nama@email.com).');
      hasValidationError = true;
    }

    if (!password) {
      this.#view.showPasswordError('Password tidak boleh kosong.');
      hasValidationError = true;
    } else if (password.length < 8) {
      this.#view.showPasswordError('Password minimal 8 karakter.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    this.#view.showLoading();

    try {
      const response = await this.#model.register({ name, email, password });
      this.#view.showSuccess(
        response.message || 'Registrasi berhasil! Mengalihkan ke halaman login...'
      );

      setTimeout(() => {
        this.#view.navigateTo('#/login');
      }, 700);
    } catch (error) {
      this.#view.showError(
        error.message || 'Registrasi gagal. Silakan coba lagi.'
      );
    } finally {
      this.#view.hideLoading();
    }
  }
}

export default RegisterPresenter;
