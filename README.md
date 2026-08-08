# Test-websites

Sandbox de diseño de UmanoAI para probar tendencias visuales (ej. héroes 3D/WebGL, scroll-storytelling) **antes** de tocar un repo o sitio de producción.

## Reglas

- Nada acá se deploya a un dominio real hasta que el dueño lo apruebe explícitamente.
- Cada prototipo vive en su propia carpeta (`/agricheck`, etc.), en el mismo stack que el sitio de producción al que apunta — así portar el ganador es copiar la carpeta, no migrar build tooling.
- Todo prototipo debe pasar el Loop de Verificación Visual del agente `diseno-web` (chrome-devtools screenshots desktop+mobile + Lighthouse ≥80/90/90) antes de proponerse para producción.
- Todo elemento 3D/WebGL necesita fallback estático para mobile/low-end y respetar `prefers-reduced-motion`.

## Prototipos

- `/agricheck` — hero 3D de prueba para agrichecksrl.com (repo real: `Juan-457/AgriCheck`). Estado: borrador inicial, sin verificar.
