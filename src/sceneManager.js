import { intro } from "./scenes/intro.js";
import { sceneScan } from "./scenes/sceneScan.js";

const scenes = { intro, sceneScan };
let currentScene = null;

export const sceneManager = {
  start(id) {
    if (scenes[id]) {
      if (currentScene?.dispose) currentScene.dispose();
      currentScene = scenes[id];
      currentScene.init();
    }
  },
  update(time) {
    if (currentScene?.update) currentScene.update(time);
  }
};
