import HomePage from '../pages/home/home-page.js';
import LoginPage from '../pages/login/login-page.js';
import RegisterPage from '../pages/register/register-page.js';
import AboutPage from '../pages/about/about-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';

const routes = {
  '/': new HomePage(),
  '/add': new AddStoryPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/about': new AboutPage(),
};

export default routes;
