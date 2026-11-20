import { getData } from './api.js';

class HomeModel {
  static async getItems(options = {}) {
    return await getData(options);
  }
}

export default HomeModel;
