# Test-websites

Sandbox de diseño de UmanoAI para probar tendencias visuales (ej. héroes 3D/WebGL, scroll-storytelling) **antes** de tocar un repo o sitio de producción.

## Reglas

- Nada acá se deploya a un dominio real hasta que el dueño lo apruebe explícitamente.
- Cada prototipo vive en su propia carpeta (`/agricheck`, etc.), en el mismo stack que el sitio de producción al que apunta — así portar el ganador es copiar la carpeta, no migrar build tooling.
- Todo prototipo debe pasar el Loop de Verificación Visual del agente `diseno-web` (chrome-devtools screenshots desktop+mobile + Lighthouse ≥80/90/90) antes de proponerse para producción.
- Todo elemento 3D/WebGL necesita fallback estático para mobile/low-end y respetar `prefers-reduced-motion`.

## Prototipos

- `/agricheck` — rediseño completo del sitio de agrichecksrl.com (repo real: `Juan-457/AgriCheck`), con el hero 3D de la mazorca de maíz como pieza central de la home. 35 páginas HTML/CSS/JS estático sin build tooling: home, nosotros, catálogo filtrable, contacto/zonas y 31 fichas de producto — todas con contenido real extraído del sitio en producción (sin placeholders). Identidad visual propia (verde monte + dorado trigo + papel crudo) sobre la tipografía Lato original, sin cambios. Estado: **verificado** — pasó el Loop de Verificación Visual (screenshots desktop 1440×900 + mobile 390×844, Lighthouse Performance 87-100 / Accessibility 95-100 / Best Practices 100 en las páginas muestreadas; SEO ronda 60-63 solo por el `noindex` intencional del sandbox). Pendiente: revisión del dueño antes de considerarlo candidato a producción; ver notas de `pendiente_verificar` en el registro de tarea del agente `diseno-web`.
