# StereoLab — Visor estereoscópico SBS

Proyecto educativo para la materia **Desarrollo de Soluciones en Ambientes Virtuales**. Es una aplicación web estática, responsiva, construida con **HTML, CSS, Bootstrap 5, Three.js (ES Modules) y lil-gui**. Visualiza fotografías estereoscópicas lado a lado (Side by Side, SBS) en gafas para teléfono tipo Google Cardboard.

## 1. Estructura del proyecto

```text
visor-sbs/
├── index.html                 # Interfaz principal y dependencias CDN
├── css/
│   └── styles.css             # Diseño responsivo y modo inmersivo
├── js/
│   ├── main.js                # Inicialización y eventos
│   ├── scene.js               # WebGLRenderer, cámaras y dos vistas
│   ├── viewer.js              # Mapeo UV SBS y calibración de planos
│   ├── controls.js            # Panel lil-gui
│   ├── fileLoader.js          # Lectura de archivos locales
│   └── ui.js                  # Pantalla completa, Cardboard y avisos
├── assets/
│   ├── images/
│   │   ├── demo-sbs-1.jpg     # Muestra: montaña y bote
│   │   └── demo-sbs-2.jpg     # Muestra: galería y cubo
│   └── icons/
│       └── cardboard.svg
└── README.md
```

## 2. Cómo iniciar la aplicación

No hace falta Node.js, npm, framework de servidor ni clave API. Las bibliotecas se descargan de jsDelivr al abrir la página, por lo que **se requiere Internet** al menos para cargar los CDN.

**En VS Code:** abre la carpeta `visor-sbs` y ejecuta `index.html` con la extensión **Live Server** (opción *Open with Live Server*).

**Alternativa con Python:** en una terminal situada en la carpeta `visor-sbs`, ejecuta:

```bash
python -m http.server 5500
```

Abre `http://localhost:5500/`. **No abras `index.html` con doble clic y `file://`**: los módulos ES y otras funcionalidades requieren un servidor HTTP/HTTPS.

## 3. Cómo usar el visor

1. La app carga **DEMO 01** automáticamente. Comprueba el efecto estereoscópico o abre **DEMO 02**.
2. Haz clic en **Cargar SBS** y selecciona una fotografía SBS (`.jpg`, `.png`, `.webp`, `.avif`, hasta 30 MB). También puedes arrastrarla al visor en computadora.
3. La fotografía debe incluir **la vista izquierda en la mitad izquierda y la derecha en la mitad derecha**. Si están invertidas, utiliza la opción **Intercambiar L/R**.
4. Ajusta parámetros con **lil-gui**. Es preferible comenzar con *Paralaje 0 px, Escala 100%, Alineación 0 px*.
5. Pulsa **Entrar en modo Cardboard**. En móviles compatibles, el navegador solicitará pantalla completa y orientación horizontal; algunas versiones de iOS Safari no permiten estas funciones para elementos HTML arbitrarios. En ese caso el proyecto usa un modo inmersivo CSS y hay que girar manualmente el teléfono.
6. Coloca el teléfono horizontal en las gafas. **Para salir**, pulsa `Esc` en computadora; en el teléfono, toca dos veces rápidamente la pantalla o usa el botón/gesto del sistema para salir de pantalla completa. Puedes sacar primero el teléfono de las gafas para acceder a la pantalla.
7. Si la imagen resulta incómoda, retira el visor y reduce la escala o el paralaje. No fuerces la fusión de fotografías con disparidad excesiva.
8. **Guardar ajustes (JSON)** descarga un archivo con los valores elegidos y metadatos de la fotografía (sin incluir sus píxeles). Restablecer calibración regresa a los valores iniciales.

### Calibración lil-gui

| Control | Descripción | Valor inicial |
|---|---|---|
| Paralaje (px) | Desplaza las vistas en sentidos opuestos para ajustar su alineación/convergencia aparente | 0 |
| Escala (%) | Cambia el tamaño de ambas imágenes sin distorsionar su proporción | 100 |
| Mover X (px) | Desplazamiento horizontal común de las dos vistas | 0 |
| Mover Y (px) | Desplazamiento vertical común de las dos vistas | 0 |
| Desnivel L/R (px) | Corrige la diferencia vertical relativa entre ojos | 0 |
| Tipo de SBS | **Completo:** imágenes de ancho no comprimido. **Half-SBS:** cada mitad comprimida horizontalmente | Completo |
| Intercambiar L/R | Corrige una fotografía cuyo orden de perspectivas está invertido | No |

La calibración digital del paralaje **no cambia la distancia interpupilar física** ni repara una fotografía con disparidades o geometría estéreo erróneas. Las lentes Cardboard pueden requerir calibración óptica/distorsión específica no implementada en este visor introductorio.

## 4. Arquitectura técnica

- `Texture` carga el archivo de imagen en GPU.
- Dos geometrías `PlaneGeometry` recortan las regiones izquierda (`U=0…0.5`) y derecha (`U=0.5…1`) mediante coordenadas UV, sin cortar ni alterar el archivo original.
- Cada plano se dibuja en una escena independiente, con una cámara `OrthographicCamera` compartida y un único `WebGLRenderer`, mediante `setViewport()` y `setScissor()`.
- `viewer.js` calcula la escala de ajuste que conserva el aspecto natural de la imagen en la mitad de la pantalla, y aplica los desplazamientos en píxeles CSS.
- `lil-gui` modifica un objeto compartido de configuración y actualiza las transformaciones inmediatamente.
- Las fotos locales se procesan **únicamente en el navegador**. No se suben a servidores.

## 5. Publicar con GitHub Pages

1. Crea un repositorio GitHub, por ejemplo `visor-sbs`.
2. Sube **todo el contenido** de esta carpeta, manteniendo `index.html` en la raíz del repositorio.
3. En el repositorio entra en **Settings → Pages → Build and deployment**.
4. Selecciona **Deploy from a branch**, rama `main` y carpeta `/(root)`. Guarda.
5. Abre la dirección que muestre GitHub Pages, que habitualmente tiene el formato `https://USUARIO.github.io/visor-sbs/`.
6. Desde el navegador del teléfono, visita esa dirección, carga una imagen SBS y utiliza **Modo Cardboard**.

Para crear el repositorio con Git local:

```bash
git init
git add .
git commit -m "Visor SBS con Three.js y lil-gui"
git branch -M main
git remote add origin https://github.com/USUARIO/visor-sbs.git
git push -u origin main
```

Reemplaza `USUARIO` por tu cuenta, y crea primero el repositorio vacío en GitHub. No se incluyen rutas absolutas, así que se puede publicar como *project page* sin reescribir las rutas.

## 6. Evidencias sugeridas

- Captura de la estructura del repositorio en VS Code (HTML, CSS y módulos JS separados).
- Captura del visor con una fotografía propia cargada y sus dos perspectivas visibles.
- Capturas de los controles con valores de calibración antes y después de los ajustes.
- Foto del móvil en las gafas Cardboard y prueba presencial del efecto de profundidad.
- Enlace público de GitHub Pages y archivo `calibracion-sbs.json` descargado.
- Conclusiones técnicas: diferencia entre separación física de lentes, paralaje/desplazamiento digital y formato Half-SBS.

## 7. Resolución de problemas

- **Pantalla negra o panel vacío:** comprueba acceso a Internet para Three.js y lil-gui desde jsDelivr; abre la consola del navegador. Puede estar bloqueado un CDN en la red institucional.
- **No funciona al abrir con doble clic:** usa Live Server o `python -m http.server 5500`.
- **La imagen sale deformada horizontalmente:** verifica la opción *Tipo de SBS*. Half-SBS requiere descomprimir horizontalmente cada ojo.
- **Las vistas están cruzadas:** prueba *Intercambiar L/R*; revisa el archivo original si el problema persiste.
- **Aparece imagen doble:** ajusta primero la escala y luego el paralaje en incrementos pequeños. Si la fotografía tiene un desplazamiento extremo, corrígela en el editor estereoscópico original.
- **El teléfono se mantiene vertical:** activa orientación horizontal manualmente; `screen.orientation.lock()` y pantalla completa no están admitidos en todos los dispositivos.
- **Bordes negros:** el visor preserva la relación de aspecto; esto es intencional para evitar estiramientos.
- **No hay 3D visible:** comprueba que la fotografía contenga dos perspectivas realmente distintas y no dos copias idénticas.

## 8. Referencias

- Three.js — https://threejs.org/docs/
- Instalación por CDN e import map — https://threejs.org/manual/#en/installation
- lil-gui — https://lil-gui.georgealways.com/
- Bootstrap — https://getbootstrap.com/
- GitHub Pages — https://docs.github.com/en/pages

**Licencia educativa:** El código de esta muestra se entrega para ser adaptado y utilizado en clase. Las imágenes de demostración fueron generadas para este proyecto.

## 9. Calibración persistente y controles táctiles

La distancia inicial entre centros ópticos es **6 cm aproximados**: `6 × 96 / 2.54 × factor de pantalla` píxeles CSS. No se usa `devicePixelRatio` como DPI físico. En el panel, compara la barra de **3 cm** con una regla y ajusta el factor de pantalla. La separación se recalcula al redimensionar, girar o entrar en modo inmersivo; se limita al ancho disponible y se recomienda orientación horizontal si no cabe. Cada ojo permanece recortado a su mitad mediante scissor. El paralaje es un ajuste independiente de la distancia óptica.

- **Mover:** arrastra un dedo para trasladar ambos ojos juntos.
- **Separar / juntar:** arrastra horizontalmente para ajustar el paralaje en sentidos opuestos.
- **Pellizcar:** zoom común de 40 a 220 %, en cualquiera de los dos modos. Al añadir o retirar un dedo se reinicia la referencia del gesto para evitar saltos. El zoom se centra en las imágenes.
- **Teclado Bluetooth:** flechas para el modo seleccionado; `M` o espacio cambia modo; `+`/`-` ajusta zoom; `[`/`]` ajusta paralaje. Los campos del panel conservan su edición normal.
- **Gamepad estándar:** joystick izquierdo/cruceta para mover o separar; botón A cambia modo; LB/RB reduce/aumenta zoom; LT/RT reduce/aumenta paralaje. Zona muerta 20 % y velocidad limitada por tiempo. La asignación depende del mando; los mandos que solo envían eventos multimedia pueden resultar inaccesibles desde la web. Los gestos siguen disponibles.
- **Salir de Cardboard:** Esc, salida de pantalla completa del sistema o dos toques breves consecutivos. Un arrastre o pellizco no cuenta como toque de salida.

No se crean puntos ni marcadores ópticos sobre las fotografías. **Recorte superior (%)** oculta el mismo porcentaje en ambos ojos mediante UV, conserva la proporción visible y nunca modifica el JPG. No hay detección automática de márgenes: para evitar eliminar contenido útil, el valor inicial es cero. El recorte manual es una preferencia global que se conserva al cambiar de imagen; si la siguiente foto no tiene margen, vuelve a cero.

`js/calibration.js` centraliza valores, validación y persistencia; `js/interactions.js` gestiona punteros, teclado y mandos. Panel, gestos y mando modifican el mismo objeto. Se guardan automáticamente en `localStorage` (clave `stereolab-calibration`) con debounce de 250 ms; cambiar de foto, ocultar o abandonar la página fuerza el guardado pendiente. No se almacenan píxeles. Los valores se recuperan al iniciar, se ignoran propiedades desconocidas como `showDots` y se admiten objetos anteriores con `calibracion` o configuración directa en esa clave. Si el almacenamiento está bloqueado, el visor conserva los ajustes en memoria e informa de la limitación. **Restablecer calibración** recupera los valores iniciales y los guarda; cargar una foto nunca restablece la calibración. La exportación JSON continúa disponible.

### Validación automatizada

Con Node.js 24, ejecutar:

```bash
node --test --test-isolation=none tests/*.test.mjs
```

Las pruebas comprueban validación, separación óptica, límites, persistencia, debounce, restablecimiento, almacenamiento inaccesible y transiciones de gestos. La sintaxis se verifica con `node --check` para cada módulo. Las pruebas con dobles de objetos no sustituyen una prueba visual de WebGL.

Pendiente de validar en hardware real: precisión con regla, apariencia Full/Half-SBS, orientación, fullscreen/Cardboard en Android/iOS, pellizco y salida con toques, y mapeo específico del mando Bluetooth. El navegador debe poder acceder a los CDN originales para renderizar.
