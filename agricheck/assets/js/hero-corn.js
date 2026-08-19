import * as THREE from "three";

const canvas = document.getElementById("scene");
const container = document.getElementById("heroVisual");
const dragHint = document.getElementById("dragHint");
const poster = document.getElementById("heroPoster");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Paleta real de marca AgriCheck + dorado trigo del rediseño.
const HUSK_LIGHT = 0x89c444;
const HUSK_MID = 0x4c9a2a;
const HUSK_DEEP = 0x163a10;
const KERNEL_LIGHT = 0xe0a92f;
const KERNEL_DEEP = 0xa9791f;
const SILK_COLOR = 0xeec468;

function buildCorn() {
  const group = new THREE.Group();
  const cobHeight = 1.5;
  const cobRadius = 0.34;

  const coreGeo = new THREE.CylinderGeometry(cobRadius * 0.85, cobRadius, cobHeight, 12);
  const coreMat = new THREE.MeshStandardMaterial({ color: KERNEL_DEEP, roughness: 0.7 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  const rows = 12;
  const cols = 16;
  const kernelGeo = new THREE.SphereGeometry(0.052, 6, 5);
  kernelGeo.scale(1, 1.35, 0.85);
  const kernelMat = new THREE.MeshStandardMaterial({ color: KERNEL_LIGHT, roughness: 0.55 });
  const kernels = new THREE.InstancedMesh(kernelGeo, kernelMat, rows * cols);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const y = (v - 0.5) * (cobHeight * 0.94);
    const radiusAtY = cobRadius * 0.85 + (cobRadius - cobRadius * 0.85) * (1 - v);
    for (let c = 0; c < cols; c++) {
      const angle = (c / cols) * Math.PI * 2 + (r % 2 === 0 ? 0 : Math.PI / cols);
      dummy.position.set(Math.cos(angle) * radiusAtY, y, Math.sin(angle) * radiusAtY);
      dummy.rotation.set(0, -angle + Math.PI / 2, 0);
      const s = 0.85 + Math.random() * 0.3;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      kernels.setMatrixAt(idx, dummy.matrix);
      kernels.setColorAt(idx, new THREE.Color().lerpColors(
        new THREE.Color(KERNEL_LIGHT),
        new THREE.Color(KERNEL_DEEP),
        Math.random() * 0.4
      ));
      idx++;
    }
  }
  kernels.instanceMatrix.needsUpdate = true;
  if (kernels.instanceColor) kernels.instanceColor.needsUpdate = true;
  group.add(kernels);

  const huskCount = 6;
  for (let i = 0; i < huskCount; i++) {
    const huskHeight = cobHeight * (0.75 + Math.random() * 0.35);
    const huskGeo = new THREE.PlaneGeometry(0.42, huskHeight, 1, 10);
    const pos = huskGeo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      const t = (y + huskHeight / 2) / huskHeight;
      const bend = t > 0.55 ? (t - 0.55) / 0.45 : 0;
      pos.setZ(v, cobRadius * 1.05 + bend * bend * 0.55);
      pos.setX(v, pos.getX(v) * (1 - bend * 0.3));
    }
    huskGeo.computeVertexNormals();

    const huskMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? HUSK_LIGHT : HUSK_MID,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const husk = new THREE.Mesh(huskGeo, huskMat);
    husk.position.y = -cobHeight * 0.08;
    husk.rotation.y = (i / huskCount) * Math.PI * 2;
    group.add(husk);
  }

  for (let i = 0; i < 10; i++) {
    const silkGeo = new THREE.CylinderGeometry(0.004, 0.008, 0.32 + Math.random() * 0.18, 3);
    const silkMat = new THREE.MeshStandardMaterial({ color: SILK_COLOR, roughness: 0.9 });
    const silk = new THREE.Mesh(silkGeo, silkMat);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * cobRadius * 0.5;
    silk.position.set(Math.cos(angle) * r, cobHeight / 2 + 0.14, Math.sin(angle) * r);
    silk.rotation.z = (Math.random() - 0.5) * 0.8;
    silk.rotation.x = (Math.random() - 0.5) * 0.8;
    group.add(silk);
  }

  return group;
}

function initScene() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.15, 3.4);

  const corn = buildCorn();
  corn.rotation.x = 0.15;
  scene.add(corn);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xfff4d6, 1.15);
  key.position.set(3, 4, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0xe0a92f, 0.7);
  rim.position.set(-3, 1, -2);
  scene.add(rim);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  // Una vez que el canvas renderiza el primer frame, ocultamos el poster estático.
  if (poster) poster.style.opacity = "0";

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let velocityY = 0;
  let velocityX = 0;
  let autoRotate = !prefersReducedMotion;
  let hasInteracted = false;

  function markInteracted() {
    if (hasInteracted) return;
    hasInteracted = true;
    autoRotate = false;
    container.classList.add("interacted");
  }

  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velocityX = 0;
    velocityY = 0;
    markInteracted();
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velocityY = dx * 0.006;
    velocityX = dy * 0.004;
    corn.rotation.y += velocityY;
    corn.rotation.x = THREE.MathUtils.clamp(corn.rotation.x + velocityX, -0.5, 0.7);
  });

  function endDrag() {
    isDragging = false;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { if (!isDragging) return; endDrag(); });

  const KEY_STEP = 0.12;
  canvas.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    markInteracted();
    if (e.key === "ArrowLeft") corn.rotation.y -= KEY_STEP;
    if (e.key === "ArrowRight") corn.rotation.y += KEY_STEP;
    if (e.key === "ArrowUp") corn.rotation.x = THREE.MathUtils.clamp(corn.rotation.x - KEY_STEP, -0.5, 0.7);
    if (e.key === "ArrowDown") corn.rotation.x = THREE.MathUtils.clamp(corn.rotation.x + KEY_STEP, -0.5, 0.7);
  });

  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);

    if (!isDragging) {
      if (Math.abs(velocityY) > 0.0002) {
        corn.rotation.y += velocityY;
        velocityY *= 0.94;
      } else if (autoRotate) {
        corn.rotation.y += 0.0035;
      }
      if (Math.abs(velocityX) > 0.0002) {
        corn.rotation.x = THREE.MathUtils.clamp(corn.rotation.x + velocityX, -0.5, 0.7);
        velocityX *= 0.9;
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else animate();
  });
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

// Fallback estático: sin WebGL (o low-end/mobile muy limitado) se queda la
// imagen poster real de la mazorca (_maiz_ia.webp) en vez del canvas 3D.
function boot() {
  try {
    initScene();
  } catch (err) {
    console.error("No se pudo inicializar la escena 3D:", err);
    canvas.style.display = "none";
    if (dragHint) dragHint.style.display = "none";
    if (poster) poster.style.opacity = "1";
  }
}

if (!canvas || !hasWebGL()) {
  if (canvas) canvas.style.display = "none";
  if (dragHint) dragHint.style.display = "none";
  if (poster) poster.style.opacity = "1";
} else {
  // Se difiere la construcción de la geometría 3D (costosa en CPU) a un
  // momento idle, para no competir con el primer pintado del hero (LCP es
  // el <h1>, no el canvas) — sensible sobre todo en mobile/CPU limitada.
  if ("requestIdleCallback" in window) {
    requestIdleCallback(boot, { timeout: 1200 });
  } else {
    setTimeout(boot, 150);
  }
}
