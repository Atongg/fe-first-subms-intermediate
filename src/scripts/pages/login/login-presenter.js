class LoginPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  init() {
    this.#view.bindSubmit(this.handleLogin.bind(this));
  }

  async handleLogin(event) {
    event.preventDefault();
    this.#view.clearAlert();
    this.#view.clearFieldErrors();

    const email = this.#view.getEmailInput();
    const password = this.#view.getPasswordInput();

    let hasValidationError = false;

    // Validasi format email yang benar
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    }

    if (hasValidationError) {
      return;
    }

    this.#view.showLoading();

    try {
      const response = await this.#model.login({ email, password });
      this.#view.showSuccess(
        response.message || 'Login berhasil! Mengalihkan ke beranda...'
      );

      setTimeout(() => {
        this.#view.navigateTo('#/');
      }, 500);
    } catch (error) {
      this.#view.showError(
        error.message || 'Login gagal. Periksa kembali email dan password Anda.'
      );
    } finally {
      this.#view.hideLoading();
    }
  }
}

export default LoginPresenter;
