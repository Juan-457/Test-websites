import * as THREE from "three";

const canvas = document.getElementById("scene");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;

// Fallback: sin WebGL, sin animación, o pantallas chicas -> queda el fondo CSS sólido, sin canvas 3D.
if (prefersReducedMotion || !window.WebGLRenderingContext) {
  canvas.style.display = "none";
} else {
  initScene();
}

function initScene() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallScreen ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, isSmallScreen ? 7 : 5.5);

  // Placeholder: nodo icosaédrico ~ "red de chequeo/monitoreo agro". Reemplazar por asset real del brand kit antes de proponer a producción.
  const geometry = new THREE.IcosahedronGeometry(1.6, isSmallScreen ? 0 : 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6fbf73,
    wireframe: true,
    emissive: 0x11241a,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const point = new THREE.PointLight(0xffffff, 1.2);
  point.position.set(4, 4, 4);
  scene.add(point);

  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);
    mesh.rotation.x += 0.0025;
    mesh.rotation.y += 0.004;
    renderer.render(scene, camera);
  }
  animate();

  // Scroll-driven zoom sutil (movimiento con propósito, no decorativo puro).
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(camera.position, {
      z: isSmallScreen ? 9 : 7.5,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
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
