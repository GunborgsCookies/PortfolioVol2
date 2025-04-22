import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createStarfield, updateStarfield } from "../environment/starfield.js";
import { scene, camera } from "../sharedScene.js";

const modelPath = import.meta.env.BASE_URL + "model/Untitled.glb";

export function fadeStarfield(color = 0x223366, opacity = 0.3) {
  const starfield = scene.getObjectByName("Starfield");
  if (starfield && starfield.material) {
    starfield.material.color.set(new THREE.Color(color));
    if (starfield.material.transparent) {
      starfield.material.opacity = opacity;
    }
  }
}

let brain = null;
let speed = 0;
let scanning = false;
let targetFound = false;
let scanTimer = 0;
let exploreTriggered = false;
let brainLoaded = false;
let brainAdded = false;
let dockStarted = false;
let warpTriggered = false;

export function showDockStatusAndScroll() {
  console.log("🧪 Funktion startar!");

  const terminal = document.getElementById("terminal-lines");
  const terminalPopup = document.getElementById("terminal-popup");

  console.log("📦 terminal:", terminal);
  console.log("📦 terminalPopup:", terminalPopup);

  if (!terminal || !terminalPopup) {
    console.warn("❌ Saknar terminal-element. Funktionen avbryts.");
    return;
  }

  terminalPopup.classList.remove("hidden");
  terminal.innerHTML = "";

  const fullText = [
    "> CONNECTED.",
    "> Identity confirmed.",
    "> All systems online.",
    "> Initializing profile...",
    "> Loading subject...",
    "> Docking complete."
  ];

  let index = 0;

  function nextLine() {
    if (index >= fullText.length) {
      terminal.scrollTop = terminal.scrollHeight;
      return;
    }
    const line = document.createElement("p");
    line.textContent = fullText[index];
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;

    index++;
    setTimeout(nextLine, 800);
  }

  nextLine();

  setTimeout(() => {
    const aboutSection = document.getElementById("about-me");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 3000);
}

window.showDockStatusAndScroll = showDockStatusAndScroll;

document.getElementById("open-terminal-btn")?.addEventListener("click", () => {
  showDockStatusAndScroll();
});

function showDockPrompt() {
  if (dockStarted) return;
  dockStarted = true;

  const dockUI = document.getElementById("dock-ui");
  if (dockUI) dockUI.classList.remove("hidden");

  document.getElementById("dock-btn")?.addEventListener("click", () => {
    dockUI.classList.add("hidden");

    const scanUI = document.getElementById("scan-ui");
    if (scanUI) {
      scanUI.classList.add("opacity-0");
      setTimeout(() => {
        scanUI.classList.add("hidden");
      }, 500);
    }

    const targetUI = document.getElementById("target-found-ui");
    if (targetUI) targetUI.classList.add("hidden");

    const popup = document.getElementById("scan-popup");
    if (popup) popup.classList.add("hidden");

    const targetPosition = brain.position.clone();
    const start = camera.position.clone().add(new THREE.Vector3(0, 0, 30));
    const mid = new THREE.Vector3(
      (start.x + targetPosition.x) / 2 + 30,
      (start.y + targetPosition.y) / 2 + 60,
      (start.z + targetPosition.z) / 2
    );
    const control1 = start.clone().add(new THREE.Vector3(0, 80, -100));
    const control2 = targetPosition.clone().add(new THREE.Vector3(0, -80, 100));
    const curve = new THREE.CatmullRomCurve3([
      start, control1, mid, control2, targetPosition
    ]);

    const geometry = new THREE.TubeGeometry(curve, 300, 0.8, 16, false);
    const material = new THREE.MeshBasicMaterial({ color: 0x440000, transparent: true, opacity: 1 });
    const tube = new THREE.Mesh(geometry, material);
    tube.name = "DockCable";
    tube.scale.set(1, 1, 0.01);
    scene.add(tube);

    let growZ = 0.01;
    const growInterval = setInterval(() => {
      growZ += 0.007;
      tube.scale.z = growZ;
      if (growZ >= 1) {
        clearInterval(growInterval);
        const floatSpeed = 0.0015;
        const floatAmplitude = 0.04;
        const baseScale = tube.scale.y;
        function floatCable(time) {
          tube.scale.y = baseScale + Math.sin(time * floatSpeed) * floatAmplitude;
          requestAnimationFrame(floatCable);
        }
        requestAnimationFrame(floatCable);

        if (brain) {
          const originalScale = brain.scale.clone();
          const jumpTarget = 1.3;
          const duration = 200;
          let start = null;
          function animateJump(timestamp) {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const t = Math.min(elapsed / duration, 1);
            const scaleFactor = 1 + (jumpTarget - 1) * Math.sin(t * Math.PI);
            brain.scale.set(
              originalScale.x * scaleFactor,
              originalScale.y * scaleFactor,
              originalScale.z * scaleFactor
            );
            if (t < 1) {
              requestAnimationFrame(animateJump);
            } else {
              brain.scale.copy(originalScale);
              setTimeout(() => {
                console.log("✅ Dockning klar. Visar terminal...");
                showDockStatusAndScroll();
              }, 200);
            }
          }
          requestAnimationFrame(animateJump);
        }

        const starfield = scene.getObjectByName("Starfield");
        if (starfield && starfield.material) {
          starfield.material.color = new THREE.Color(0x8844ff);
        }
      }
    }, 20);
  });
}

export const intro = {
  init() {
    createStarfield();

    const input = document.getElementById("scan-input");
    const button = document.getElementById("start-btn");

    const activateBridge = () => {
      const introUI = document.getElementById("intro-ui");
      if (introUI) {
        introUI.classList.add("opacity-0", "pointer-events-none");
        setTimeout(() => {
          introUI.remove();
        }, 1500);
      }

      scanning = true;
      targetFound = false;
      scanTimer = 0;
      speed = 0.5;

      if (!brainLoaded) loadBrainModel();

      document.getElementById("scan-ui")?.classList.remove("hidden");
      document.getElementById("reticle")?.classList.remove("hidden");
    };

    const triggerScan = () => activateBridge();

    if (button) button.addEventListener("click", triggerScan);
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") triggerScan();
      });
    }
  },

  update(time) {
    updateStarfield();

    if (exploreTriggered && brain && brainLoaded && !window._dockPromptShown) {
      if (!window._orbitStartTime) window._orbitStartTime = time;
      if (time - window._orbitStartTime > 5000) {
        showDockPrompt();
        window._dockPromptShown = true;
      }
    }

    const starfield = scene.getObjectByName("Starfield");
    if (starfield) {
      starfield.position.copy(camera.position);
      starfield.rotation.copy(camera.rotation);
    }

    const reticle = document.getElementById("reticle");
    if (reticle && !reticle.classList.contains("hidden") && scanning && !targetFound) {
      const pulse = 1.0 + Math.sin(time * 0.005) * 0.05;
      const offsetX = Math.sin(time * 0.0015) * 15;
      const offsetY = Math.cos(time * 0.0012) * 15;
      reticle.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${pulse})`;
    }

    if (scanning && brainLoaded) {
      camera.translateZ(-speed);
      scanTimer++;

      if (scanTimer > 300 && !targetFound) {
        targetFound = true;
        showTargetFound();
      }
    }

    if (exploreTriggered && brain) {
      brain.rotation.y += 0.002;

      if (!warpTriggered) {
        speed = 6;
        warpTriggered = true;
      }

      const targetDistance = 400;
      const dist = camera.position.distanceTo(brain.position);

      if (dist > targetDistance) {
        camera.translateZ(-speed);
      } else {
        speed *= 0.94;
        camera.translateZ(-speed);
        if (speed < 0.3) {
          showDockPrompt();
        }
      }

      camera.lookAt(brain.position);
    }

    const speedUI = document.getElementById("speed-indicator");
    if (speedUI) {
      speedUI.innerText = `🚀 Hastighet: ${speed.toFixed(2)} km/s`;
    }
  }
};

function loadBrainModel() {
  if (brainAdded) return;

  const loader = new GLTFLoader();
  loader.load(modelPath, (gltf) => {
    brain = gltf.scene;
    brain.position.set(0, 0, -2000);
    brain.scale.set(20, 20, 20);
    scene.add(brain);
    brainLoaded = true;
    brainAdded = true;

    const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2.5, 1000);
    pointLight.position.set(0, 100, 200);
    scene.add(pointLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 4);
    sunLight.position.set(100, 200, 300);
    scene.add(sunLight);
    scene.add(sunLight.target);
  });
}

function showTargetFound() {
  window._orbitStartTime = null;
  window._dockPromptShown = false;

  const ui = document.getElementById("target-found-ui");
  if (ui) ui.classList.remove("hidden");

  const popup = document.getElementById("scan-popup");
  if (popup) popup.classList.remove("hidden");
  createMiniBrain();

  document.getElementById("explore-btn")?.addEventListener("click", () => {
    const reticle = document.getElementById("reticle");
    if (reticle) reticle.style.display = "none";
    ui.classList.add("hidden");
    popup?.classList.add("hidden");
    exploreTriggered = true;
  });
}

function createMiniBrain() {
  const canvas = document.getElementById("mini-brain");
  if (!canvas) return;

  const miniScene = new THREE.Scene();
  const miniCamera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  miniCamera.position.z = 4.5;

  const miniRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  miniRenderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const loader = new GLTFLoader();
  loader.load(modelPath, (gltf) => {
    const miniBrain = gltf.scene;
    miniBrain.scale.set(0.15, 0.15, 0.15);
    miniBrain.position.set(-1.7, -1.3, 0);
    miniBrain.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x00ccff, metalness: 0.3, roughness: 0.4 });
      }
    });

    miniScene.add(miniBrain);

    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(3, 3, 5);
    miniScene.add(light);

    function animateMiniBrain() {
      miniBrain.rotation.y += 0.01;
      miniRenderer.render(miniScene, miniCamera);
      requestAnimationFrame(animateMiniBrain);
    }

    animateMiniBrain();
  });
}