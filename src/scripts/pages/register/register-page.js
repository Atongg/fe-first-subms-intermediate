import RegisterPresenter from './register-presenter.js';
import AuthModel from '../../data/auth-model.js';
import eyeIcon from '@/assets/icons/eye.svg?raw';
import eyeOffIcon from '@/assets/icons/eye-off.svg?raw';

/**
 * View untuk fitur Register (View dalam arsitektur MVP).
 * Mengatur tampilan formulir registrasi, interaksi input DOM,
 * dan menyediakan antarmuka bagi RegisterPresenter.
 */
export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="auth-section">
        <div class="auth-card">
          <header class="auth-header">
            <h1 class="auth-title">Daftar Akun Baru</h1>
          </header>

          <div id="alert-container" class="alert-container" role="alert" aria-live="polite"></div>

          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="name" class="form-label">Nama Lengkap</label>
              <input
                type="text"
                id="name"
                name="name"
                class="form-input"
                placeholder="Masukkan nama Anda"
                required
                autocomplete="name"
              />
              <span id="name-error" class="field-error" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input"
                placeholder="nama@email.com"
                required
                autocomplete="email"
              />
              <span id="email-error" class="field-error" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <div class="password-wrapper">
                <input
                  type="password"
                  id="password"
                  name="password"
                  class="form-input"
                  placeholder="Masukkan password"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  id="toggle-password"
                  class="toggle-password-btn"
                  aria-label="Tampilkan atau sembunyikan password"
                  title="Tampilkan password"
                >
                  ${eyeIcon}
                </button>
              </div>
              <span id="password-error" class="field-error" aria-live="polite"></span>
            </div>

            <button type="submit" id="submit-button" class="btn btn-primary auth-submit-btn">
              <span class="btn-text">Daftar Akun</span>
              <span class="btn-spinner hidden" aria-hidden="true"></span>
            </button>
          </form>

          <footer class="auth-footer">
            <p>Sudah memiliki akun? <a href="#/login" class="auth-link">Masuk di sini</a></p>
          </footer>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#setupPasswordToggle();

    // Inisialisasi Presenter (MVP)
    this.#presenter = new RegisterPresenter({
      view: this,
      model: AuthModel,
    });
    this.#presenter.init();
  }

  #setupPasswordToggle() {
    const passwordInput = document.querySelector('#password');
    const toggleButton = document.querySelector('#toggle-password');

    if (passwordInput && toggleButton) {
      toggleButton.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        toggleButton.innerHTML = isPassword ? eyeOffIcon : eyeIcon;
        toggleButton.setAttribute(
          'title',
          isPassword ? 'Sembunyikan password' : 'Tampilkan password'
        );
      });
    }
  }

  // --- Metode antarmuka View untuk Presenter ---

  getNameInput() {
    const input = document.querySelector('#name');
    return input ? input.value.trim() : '';
  }

  getEmailInput() {
    const input = document.querySelector('#email');
    return input ? input.value.trim() : '';
  }

  getPasswordInput() {
    const input = document.querySelector('#password');
    return input ? input.value : '';
  }

  showNameError(message) {
    const el = document.querySelector('#name-error');
    const input = document.querySelector('#name');
    if (el) el.textContent = message;
    if (input) input.classList.add('input-invalid');
  }

  showEmailError(message) {
    const el = document.querySelector('#email-error');
    const input = document.querySelector('#email');
    if (el) el.textContent = message;
    if (input) input.classList.add('input-invalid');
  }

  showPasswordError(message) {
    const el = document.querySelector('#password-error');
    const input = document.querySelector('#password');
    if (el) el.textContent = message;
    if (input) input.classList.add('input-invalid');
  }

  clearFieldErrors() {
    const nameError = document.querySelector('#name-error');
    const emailError = document.querySelector('#email-error');
    const passwordError = document.querySelector('#password-error');
    const nameInput = document.querySelector('#name');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (nameInput) nameInput.classList.remove('input-invalid');
    if (emailInput) emailInput.classList.remove('input-invalid');
    if (passwordInput) passwordInput.classList.remove('input-invalid');
  }

  showError(message) {
    const container = document.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <span>${message}</span>
        </div>
      `;
    }
  }

  showSuccess(message) {
    const container = document.querySelector('#alert-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-success" role="alert">
          <span>${message}</span>
        </div>
      `;
    }
  }

  clearAlert() {
    const container = document.querySelector('#alert-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  showLoading() {
    const button = document.querySelector('#submit-button');
    if (button) {
      button.disabled = true;
      const text = button.querySelector('.btn-text');
      const spinner = button.querySelector('.btn-spinner');
      if (text) text.textContent = 'Mendaftarkan...';
      if (spinner) spinner.classList.remove('hidden');
    }
  }

  hideLoading() {
    const button = document.querySelector('#submit-button');
    if (button) {
      button.disabled = false;
      const text = button.querySelector('.btn-text');
      const spinner = button.querySelector('.btn-spinner');
      if (text) text.textContent = 'Daftar Akun';
      if (spinner) spinner.classList.add('hidden');
    }
  }

  bindSubmit(handler) {
    const form = document.querySelector('#register-form');
    if (form) {
      form.addEventListener('submit', handler);
    }
  }

  navigateTo(hash) {
    window.location.hash = hash;
  }
}
