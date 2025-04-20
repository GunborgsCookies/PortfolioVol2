import { renderer, scene, camera } from "./sharedScene.js";
import { intro } from "./scenes/intro.js";

const app = document.getElementById("app");
if (app && !app.contains(renderer.domElement)) {
  app.appendChild(renderer.domElement);
}

// ✅ Kör init först när sidan är klar
document.addEventListener("DOMContentLoaded", () => {
  intro.init();
});

function animate(time) {
  requestAnimationFrame(animate);
  intro.update(time);
  renderer.render(scene, camera);
}
animate();

