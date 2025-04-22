import "./output.css"; // 👈 Tailwind eller egen CSS
import "./scripts/toggleProjects.js"; // 👈 Din projekt-toggle
import "./scripts/aboutLoading.js";   // 👈 Din loadinganimation eller text
import { renderer, scene, camera } from "./sharedScene.js";
import { intro } from "./scenes/intro.js";

// Lägg till renderer i DOM
const app = document.getElementById("app");
if (app && !app.contains(renderer.domElement)) {
  app.appendChild(renderer.domElement);
}

// Initiera intro-logik
document.addEventListener("DOMContentLoaded", () => {
  intro.init();
});

// Render loop
function animate(time) {
  requestAnimationFrame(animate);
  intro.update(time);
  renderer.render(scene, camera);
}
animate();
