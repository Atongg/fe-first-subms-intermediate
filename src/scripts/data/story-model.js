import { addStory } from './api.js';

class StoryModel {
  static async addStory({ description, photo, lat, lon }) {
    return await addStory({ description, photo, lat, lon });
  }
}

export default StoryModel;
