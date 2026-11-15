import { getData } from './api.js';

class HomeModel {
  static async getItems() {
    return await getData();
  }
}

export default HomeModel;
