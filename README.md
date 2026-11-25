# holographicator

App para Android (y página web) que convierte cualquier video en una imagen "holográfica" para ver con una pirámide de plástico apoyada sobre el celular.

Muestra la misma imagen 4 veces en cruz, cada copia girada 90°, para que las cuatro caras de la pirámide la reflejen hacia el centro.

## Descargar

Bajá el APK desde [Releases](https://github.com/vmdanguise/holographicator/releases/latest) e instalalo en el celular. Android te va a pedir permitir la instalación de "fuentes desconocidas".

## Cómo se usa

| Modo | Qué hace |
| --- | --- |
| **YouTube** | Pegá un link de YouTube (o el ID del video). Las 4 copias se mantienen sincronizadas. |
| **Archivo** | Elegí un video o una imagen del celular. Se dibuja en un canvas, así que las copias van siempre perfectamente sincronizadas y sin logos de YouTube. Funciona sin internet. |
| **Cámara** | Muestra en vivo lo que ve la cámara (trasera o frontal). |

- Tocá la pantalla para mostrar u ocultar el menú.
- **Ajuste automático** calcula el tamaño más grande en el que las 4 copias no se pisan.
- **Tamaño** y **Separación del centro** sirven para ajustarlo a tu pirámide.
- **Espejar**: activalo si el texto se ve al revés en la pirámide.
- **Girar 180° cada copia**: activalo si el holograma aparece cabeza abajo.
- La app mantiene la pantalla encendida y con el brillo al máximo mientras está abierta.

Consejo: los videos con **fondo negro** son los que mejor quedan. Buscá en YouTube "hologram pyramid 4 sided" o "video para holograma" (también hay videos ya preparados en 4 direcciones: para esos conviene usar el modo Archivo o mirarlos directo en YouTube, porque la app los multiplicaría otra vez).

## Cómo armar la pirámide

Estos mismos pasos están dentro de la app: botón **📐 Cómo armar la pirámide** en el menú (también se abre solo la primera vez). En Android la plantilla se muestra en **tamaño real**, para calcarla apoyando el plástico sobre la pantalla.

Pasos basados en la guía de Parque Explora: [Cómo hacer un proyector de imágenes 3D con tu celular](https://www.parqueexplora.org/aprende/como-hacer-un-proyector-de-imagenes-3d-con-tu-celular).

**Materiales:** regla, marcador, tijeras, cinta adhesiva transparente, una botella de plástico reciclada (o un plástico transparente rígido, como la tapa de un estuche de CD) y tu celular.

1. **Trazá la plantilla.** Dibujá en una hoja de papel un triángulo y cortale la punta, de modo que quede un trapecio. Esa va a ser la plantilla de las 4 caras.
2. **Prepará el plástico.** Recortá la parte lisa de la botella. Con la plantilla, marcá y cortá 4 trapecios iguales; cuanto más parecidos sean, mejor se ve el resultado.
3. **Armá la pirámide.** Uní los 4 trapecios por los costados con cinta transparente, formando una pirámide sin punta. Los bordes tienen que quedar bien pegados y la estructura firme.
4. **Prepará el video.** Abrí Holographicator y elegí un video de YouTube, uno del celular o la cámara.
5. **Mirá la proyección.** En un lugar oscuro y con el brillo al máximo, apoyá la pirámide **con la punta (el lado chico) hacia abajo**, justo sobre la cruz celeste que marca el centro. Mirá desde un costado, a la altura de la pirámide: la imagen parece flotar adentro.

### Medidas de referencia

La guía de Parque Explora no da medidas. Estas son las que se usan habitualmente para un celular (las caras quedan a unos 45°, que es lo que hace falta para que el reflejo se vea vertical):

```
        6 cm
  ┌─────────────┐
   \           /
    \         /     alto: 3,5 cm
     \       /
      └─────┘
       1 cm
```

- Lado grande: **6 cm** · lado chico: **1 cm** · alto del trapecio: **3,5 cm**.
- Para una tablet podés duplicar todo (12 cm, 2 cm y 7 cm).

Si con tu pirámide las imágenes quedan cortadas o fuera de las caras, ajustá **Tamaño** y **Separación del centro** en la app.

### Consejos

- Cuanto más oscuro el ambiente, mejor se ve.
- Usá un plástico bien transparente y liso: las rayas o arrugas deforman la imagen.

### ¿Es un holograma de verdad?

No: técnicamente es una **proyección estereográfica**. La luz de las 4 imágenes de la pantalla se refleja en las caras de la pirámide y coincide en el centro, donde parece formarse una imagen con volumen. En un holograma real cada parte contiene la imagen entera; acá, si tapás una cara de la pirámide, esa parte de la imagen deja de verse.

## Para desarrolladores

```
web/       La app (HTML + CSS + JS, sin dependencias). Es lo único que hay que editar para cambiar la interfaz.
android/   Proyecto Android: un WebView que carga web/ como assets.
```

### Probar la versión web

YouTube no se reproduce si abrís `web/index.html` directo como archivo; serví la carpeta con cualquier servidor, por ejemplo:

```
npx serve web
```

### Compilar el APK

Requisitos: JDK 17 y Android SDK (API 37).

```
cd android
./gradlew assembleDebug        # APK de prueba
./gradlew assembleRelease      # APK firmado
```

Para firmar la release, creá `android/keystore.properties` (no se sube a git):

```
storeFile=holographicator-release.jks
storePassword=...
keyAlias=holographicator
keyPassword=...
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`.
