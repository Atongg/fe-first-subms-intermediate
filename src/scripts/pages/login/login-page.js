import LoginPresenter from './login-presenter.js';
import AuthModel from '../../data/auth-model.js';
import eyeIcon from '@/assets/icons/eye.svg?raw';
import eyeOffIcon from '@/assets/icons/eye-off.svg?raw';

/**
 * View untuk fitur Login (View dalam arsitektur MVP).
 * Merender form login yang mendukung akun dummy maupun akun riil.
 */
export default class LoginPage {
  #presenter = null;

  async render() {
    return `
      <section class="auth-section">
        <div class="auth-card">
          <header class="auth-header">
            <h1 class="auth-title">Masuk</h1>
          </header>

          <div id="alert-container" class="alert-container" role="alert" aria-live="polite"></div>

          <form id="login-form" class="auth-form" novalidate>
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
                  autocomplete="current-password"
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
              <span class="btn-text">Masuk</span>
              <span class="btn-spinner hidden" aria-hidden="true"></span>
            </button>
          </form>

          <footer class="auth-footer">
            <p>Belum memiliki akun? <a href="#/register" class="auth-link">Daftar sekarang</a></p>
          </footer>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#setupPasswordToggle();

    // Inisialisasi Presenter (MVP)
    this.#presenter = new LoginPresenter({
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

  getEmailInput() {
    const input = document.querySelector('#email');
    return input ? input.value.trim() : '';
  }

  getPasswordInput() {
    const input = document.querySelector('#password');
    return input ? input.value : '';
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
    const emailError = document.querySelector('#email-error');
    const passwordError = document.querySelector('#password-error');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
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
      if (text) text.textContent = 'Memproses...';
      if (spinner) spinner.classList.remove('hidden');
    }
  }

  hideLoading() {
    const button = document.querySelector('#submit-button');
    if (button) {
      button.disabled = false;
      const text = button.querySelector('.btn-text');
      const spinner = button.querySelector('.btn-spinner');
      if (text) text.textContent = 'Masuk';
      if (spinner) spinner.classList.add('hidden');
    }
  }

  bindSubmit(handler) {
    const form = document.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', handler);
    }
  }

  navigateTo(hash) {
    window.location.hash = hash;
  }
}
