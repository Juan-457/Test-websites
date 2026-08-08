import * as THREE from "three";

const canvas = document.getElementById("scene");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;

// Fallback: sin WebGL, sin animación, o pantallas chicas -> queda el degradé CSS del hero, sin canvas 3D.
if (prefersReducedMotion || !window.WebGLRenderingContext) {
  canvas.style.display = "none";
} else {
  initScene();
}

// Paleta real de marca (extraída del sitio en producción, ver index real de AgriCheck).
const GREEN_LIGHT = 0x89c444;
const GREEN_MID = 0x5a9a2e;
const GREEN_DEEP = 0x1b3d10;
const ACCENT_BUD = 0xfacc15;

function createCropStalk() {
  const group = new THREE.Group();
  const height = 0.9 + Math.random() * 0.5;

  const stemGeo = new THREE.CylinderGeometry(0.014, 0.022, height, 6);
  const stemMat = new THREE.MeshStandardMaterial({ color: GREEN_DEEP, roughness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = height / 2;
  group.add(stem);

  // Hojas: planos angostos en abanico alrededor del tallo, tamaño y ángulo variables (aspecto low-poly/orgánico).
  const bladeCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < bladeCount; i++) {
    const bladeLength = 0.35 + Math.random() * 0.35;
    const bladeGeo = new THREE.PlaneGeometry(0.06, bladeLength, 1, 4);
    // Curva la hoja doblando los vértices superiores hacia afuera.
    const pos = bladeGeo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      const t = (y + bladeLength / 2) / bladeLength;
      pos.setZ(v, Math.sin(t * Math.PI * 0.6) * 0.12);
    }
    bladeGeo.computeVertexNormals();

    const bladeMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? GREEN_LIGHT : GREEN_MID,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    const attachHeight = height * (0.35 + 0.55 * (i / bladeCount));
    blade.position.y = attachHeight + bladeLength / 2;
    blade.rotation.y = (i / bladeCount) * Math.PI * 2;
    blade.rotation.z = 0.35 + Math.random() * 0.25;
    blade.userData.baseRotationZ = blade.rotation.z;
    blade.userData.swayPhase = Math.random() * Math.PI * 2;
    group.add(blade);
  }

  // Brote/espiga en la punta.
  const budGeo = new THREE.IcosahedronGeometry(0.07, 0);
  const budMat = new THREE.MeshStandardMaterial({ color: ACCENT_BUD, roughness: 0.4, emissive: 0x3a2e05 });
  const bud = new THREE.Mesh(budGeo, budMat);
  bud.position.y = height + 0.05;
  group.add(bud);

  group.userData.swayPhase = Math.random() * Math.PI * 2;
  group.userData.swaySpeed = 0.6 + Math.random() * 0.4;
  return group;
}

function initScene() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallScreen ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(isSmallScreen ? 1.4 : 2.1, 1.1, isSmallScreen ? 4.6 : 3.6);
  camera.lookAt(0, 0.6, 0);

  const field = new THREE.Group();
  const rows = isSmallScreen ? 3 : 4;
  const cols = isSmallScreen ? 4 : 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const stalk = createCropStalk();
      stalk.position.set(
        (c - cols / 2) * 0.42 + (Math.random() - 0.5) * 0.15,
        0,
        (r - rows / 2) * 0.42 + (Math.random() - 0.5) * 0.15 - 0.4
      );
      field.add(stalk);
    }
  }
  field.rotation.y = -0.35;
  scene.add(field);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xfff4d6, 1.1);
  key.position.set(3, 4, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0x89c444, 0.8);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  const clock = new THREE.Clock();
  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    field.children.forEach((stalk) => {
      stalk.rotation.z = Math.sin(t * stalk.userData.swaySpeed + stalk.userData.swayPhase) * 0.05;
    });
    renderer.render(scene, camera);
  }
  animate();

  // Scroll-driven: la cámara se acerca y el campo gira levemente (movimiento con propósito, no decorativo puro).
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(camera.position, {
      z: isSmallScreen ? 3.4 : 2.4,
      y: 0.85,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(field.rotation, {
      y: -0.35 + 0.5,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else animate();
  });
}
