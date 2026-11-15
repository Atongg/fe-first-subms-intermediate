import * as api from './api.js';

const ACCESS_TOKEN_KEY = 'AUTH_ACCESS_TOKEN';
const USER_DATA_KEY = 'AUTH_USER_DATA';

class AuthModel {
  static setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  static getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  static removeAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  static setUser(user) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  static getUser() {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static removeUser() {
    localStorage.removeItem(USER_DATA_KEY);
  }

  static isAuthenticated() {
    return Boolean(this.getAccessToken());
  }

  static logout() {
    this.removeAccessToken();
    this.removeUser();
  }

  static async register({ name, email, password }) {
    return await api.register({ name, email, password });
  }

  static async login({ email, password }) {
    const response = await api.login({ email, password });
    if (response && response.token) {
      this.setAccessToken(response.token);
      if (response.user) {
        this.setUser(response.user);
      }
    }
    return response;
  }
}

export default AuthModel;
