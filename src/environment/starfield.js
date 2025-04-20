import * as THREE from "three";
import { scene } from "../sharedScene.js";

const textureLoader = new THREE.TextureLoader(); // 🛠️ Fix för glow-textur

let starfield = null;
let nebulaSprites = [];
let meteors = [];
let particles = [];
let starOpacities = [];
let blinkIndices = [];
let ambientSound = null;

export function createStarfield() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const colors = [];
  starOpacities = [];
  blinkIndices = [];

  for (let i = 0; i < 10000; i++) {
    const x = THREE.MathUtils.randFloatSpread(3000);
    const y = THREE.MathUtils.randFloatSpread(3000);
    const z = THREE.MathUtils.randFloatSpread(3000);
    vertices.push(x, y, z);

    const color = new THREE.Color();
    color.setHSL(Math.random(), 1.0, 0.7 + Math.random() * 0.3);
    colors.push(color.r, color.g, color.b);

    starOpacities.push(Math.random() * Math.PI * 2);
    if (Math.random() < 0.1) blinkIndices.push(i);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const sprite = textureLoader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/spark1.png"
  );

  const material = new THREE.PointsMaterial({
    map: sprite,
    vertexColors: true,
    size: 3.5,
    transparent: true,
    alphaTest: 0.2,
    opacity: 1.0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  starfield = new THREE.Points(geometry, material);
  starfield.name = "Starfield";
  scene.add(starfield);

  const nebulaTexture = textureLoader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/lensflare/lensflare0.png"
  );

  const nebulaColors = [0x6622aa, 0x3366ff, 0xff66cc, 0x66ffcc];
  for (let i = 0; i < 16; i++) {
    const color = nebulaColors[i % nebulaColors.length];
    const material = new THREE.SpriteMaterial({
      map: nebulaTexture,
      color,
      opacity: 0.2,
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(400, 400, 1);
    sprite.position.set(
      THREE.MathUtils.randFloatSpread(1000),
      THREE.MathUtils.randFloatSpread(1000),
      THREE.MathUtils.randFloatSpread(1000)
    );
    scene.add(sprite);
    nebulaSprites.push(sprite);
  }
}

let blinkTime = 0;
let pulseTime = 0;
let pulseIntensity = 1.0;

export function updateStarfield() {
  if (!starfield) return;

  pulseTime += 0.02;
  pulseIntensity = 1.0 + Math.sin(pulseTime * 0.5) * 0.5;

  starfield.rotation.y += 0.0005;
  starfield.position.z += 0.1;

  nebulaSprites.forEach((sprite, i) => {
    sprite.position.z += 0.15;
    sprite.material.opacity = 0.15 + 0.1 * Math.sin(blinkTime * 0.5 + i);
  });

  blinkTime += 0.02;
  const colorAttr = starfield.geometry.getAttribute("color");

  blinkIndices.forEach(i => {
    const baseOpacity = 0.6 + Math.sin(blinkTime * 2.5 + starOpacities[i]) * 0.4;
    const hueShift = (blinkTime * 0.02 + i * 0.001) % 1;
    const tempColor = new THREE.Color().setHSL(hueShift, 1.0, 0.65);
    colorAttr.setXYZ(i, tempColor.r * baseOpacity, tempColor.g * baseOpacity, tempColor.b * baseOpacity);
  });

  colorAttr.needsUpdate = true;

  // 🔥 Meteorer med glow & svans
  if (Math.random() < 0.05) {
    const geometry = new THREE.SphereGeometry(1.2, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const meteor = new THREE.Mesh(geometry, material);

    // ✴️ Glow runt meteor (utan kant)
    const glowTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/glow.png"
    );
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(5, 5, 1);
    meteor.add(glow);

    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 5, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      })
    );

    meteor.position.set(
      Math.random() * 500 - 250,
      Math.random() * 500 - 250,
      -1000
    );
    trail.position.copy(meteor.position);
    trail.rotation.x = Math.PI;

    const velocity = new THREE.Vector3(3, -2, 8);
    meteor.userData.velocity = velocity;
    meteor.userData.trail = trail;

    trail.userData.velocity = velocity;

    scene.add(meteor);
    scene.add(trail);
    meteors.push(meteor);
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const meteor = meteors[i];
    const trail = meteor.userData.trail;

    meteor.position.add(meteor.userData.velocity);
    trail.position.copy(meteor.position);
    trail.lookAt(meteor.position.clone().sub(meteor.userData.velocity));

    meteor.rotation.x += 0.05;
    meteor.rotation.y += 0.05;

    if (meteor.position.z > 100) {
      // 💥 Mini-explosion
      const flash = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffffcc,
          transparent: true,
          opacity: 1
        })
      );
      flash.position.copy(meteor.position);
      scene.add(flash);

      let opacity = 1;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
          scene.remove(flash);
          clearInterval(fadeInterval);
        } else {
          flash.material.opacity = opacity;
        }
      }, 30);

      scene.remove(meteor);
      scene.remove(trail);
      meteors.splice(i, 1);
    }
  }

  // ✨ Sparkles
  if (Math.random() < 0.05) {
    const sparkleColor = new THREE.Color().setHSL(Math.random(), 1, 0.85);
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: sparkleColor, transparent: true, opacity: 0.8 });
    const sparkle = new THREE.Mesh(geometry, material);
    sparkle.position.set(
      Math.random() * 1000 - 500,
      Math.random() * 800 - 400,
      -800
    );
    sparkle.userData.velocity = new THREE.Vector3(
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
      Math.random() * 3 + 2
    );
    scene.add(sparkle);
    particles.push(sparkle);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.userData.velocity);
    p.material.opacity -= 0.01;
    if (p.material.opacity <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
    }
  }
}

export function removeStarfield() {
  if (starfield) scene.remove(starfield);
  starfield = null;

  nebulaSprites.forEach(sprite => scene.remove(sprite));
  nebulaSprites = [];

  meteors.forEach(meteor => {
    if (meteor.userData.trail) scene.remove(meteor.userData.trail);
    scene.remove(meteor);
  });
  meteors = [];

  particles.forEach(p => scene.remove(p));
  particles = [];

  if (ambientSound) {
    ambientSound.pause();
    ambientSound = null;
  }
}

export function getStarPoints() {
  return starfield?.geometry?.attributes?.position?.array;
}
