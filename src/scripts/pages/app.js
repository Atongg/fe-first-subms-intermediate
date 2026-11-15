import routes from '../routes/routes.js';
import { getActiveRoute } from '../routes/url-parser.js';
import AuthModel from '../data/auth-model.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    const overlay = document.querySelector('#drawer-overlay');

    const toggleDrawer = () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      if (overlay) {
        overlay.classList.toggle('open', isOpen);
      }
    };

    const closeDrawer = () => {
      this.#navigationDrawer.classList.remove('open');
      if (overlay) {
        overlay.classList.remove('open');
      }
    };

    this.#drawerButton.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleDrawer();
    });

    if (overlay) {
      overlay.addEventListener('click', (event) => {
        event.stopPropagation();
        closeDrawer();
      });
    }

    document.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        closeDrawer();
      }
    });

    this.#navigationDrawer.addEventListener('click', (event) => {
      const clickedEl = event.target.closest('a, button');
      if (clickedEl) {
        closeDrawer();
      }
    });
  }

  #updateNavigation() {
    const navList = document.querySelector('#nav-list');
    const brandLink = document.querySelector('.brand-name');
    if (!navList) return;

    const isAuthenticated = AuthModel.isAuthenticated();
    const activeRoute = getActiveRoute();

    if (brandLink) {
      brandLink.setAttribute('href', isAuthenticated ? '#/' : '#/login');
    }

    if (isAuthenticated) {
      const user = AuthModel.getUser();
      const userName = user?.name ? ` (${user.name})` : '';

      navList.innerHTML = `
        <li><a href="#/" class="${activeRoute === '/' ? 'active' : ''}">Beranda</a></li>
        <li><a href="#/about" class="${activeRoute === '/about' ? 'active' : ''}">About</a></li>
        <li>
          <button id="logout-button" class="nav-logout-btn" type="button" title="Logout${userName}" aria-label="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </li>
      `;

      const logoutBtn = navList.querySelector('#logout-button');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          AuthModel.logout();
          this.#updateNavigation();
          window.location.hash = '#/login';
        });
      }
    } else {
      navList.innerHTML = `
        <li><a href="#/login" class="${activeRoute === '/login' ? 'active' : ''}">Login</a></li>
        <li><a href="#/register" class="${activeRoute === '/register' ? 'active' : ''}">Register</a></li>
      `;
    }
  }

  async renderPage() {
    if (this.#navigationDrawer) {
      this.#navigationDrawer.classList.remove('open');
    }
    const overlay = document.querySelector('#drawer-overlay');
    if (overlay) {
      overlay.classList.remove('open');
    }

    const isAuthenticated = AuthModel.isAuthenticated();
    const url = getActiveRoute();

    if (!isAuthenticated && url !== '/login' && url !== '/register') {
      window.location.hash = '#/login';
      return;
    }

    if (isAuthenticated && (url === '/login' || url === '/register')) {
      window.location.hash = '#/';
      return;
    }

    const page = routes[url] || (isAuthenticated ? routes['/'] : routes['/login']);

    this.#updateNavigation();

    if (document.startViewTransition) {
      const transition = document.startViewTransition(async () => {
        await this.#renderPageContent(page);
      });
      await transition.finished;
    } else {
      await this.#renderWithFallbackTransition(page);
    }
  }

  async #renderPageContent(page) {
    this.#content.innerHTML = await page.render();
    if (typeof page.afterRender === 'function') {
      await page.afterRender();
    }
  }

  async #renderWithFallbackTransition(page) {
    this.#content.classList.add('page-transition-exit');
    await new Promise((resolve) => setTimeout(resolve, 150));

    await this.#renderPageContent(page);

    this.#content.classList.remove('page-transition-exit');
    this.#content.classList.add('page-transition-enter');

    setTimeout(() => {
      this.#content.classList.remove('page-transition-enter');
    }, 250);
  }
}

export default App;
