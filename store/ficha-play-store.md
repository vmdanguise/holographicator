# Ficha de Google Play: Holographicator

Textos para copiar en Play Console (**Crecer → Presencia en Play Store → Ficha principal de Play Store**).
Idioma: Español (Latinoamérica), `es-419`.

## Nombre de la app (máx. 30)

```
Holographicator
```

## Descripción breve (máx. 80)

```
Mirá videos, fotos y la cámara como hologramas 3D con una pirámide de plástico.
```

## Descripción completa (máx. 4000)

```
Convertí tu celular en un proyector holográfico casero.

Holographicator muestra cualquier video, foto o la cámara en vivo cuatro veces en cruz, cada copia girada 90°. Apoyás sobre la pantalla una pirámide de plástico transparente y las cuatro caras reflejan la imagen hacia el centro: parece que flota en el aire.

TRES MODOS
• YouTube: pegá un link o el ID de un video. Las 4 copias se mantienen sincronizadas.
• Archivo: elegí un video o una foto del celular. Funciona sin internet y las copias van siempre perfectamente sincronizadas.
• Cámara: mostrá en vivo lo que ve la cámara trasera o frontal.

FÁCIL DE AJUSTAR
• Ajuste automático: calcula el tamaño más grande en el que las 4 copias no se pisan.
• Tamaño y separación del centro para adaptarlo a tu pirámide.
• Espejar, por si el texto se ve al revés.
• Girar 180° cada copia, por si el holograma aparece cabeza abajo.
• La pantalla se mantiene encendida y con el brillo al máximo mientras usás la app.

ARMÁ TU PIRÁMIDE
La app incluye una guía paso a paso para hacer la pirámide con una botella de plástico, regla, tijera y cinta. La plantilla se muestra en tamaño real: apoyás el plástico sobre la pantalla y la calcás.

CONSEJOS
• Los videos con fondo negro son los que mejor quedan. Buscá en YouTube "hologram pyramid" o "video para holograma".
• Cuanto más oscuro el ambiente, mejor se ve.

¿Es un holograma de verdad? Técnicamente es una proyección estereográfica: la luz de las 4 imágenes se refleja en las caras de la pirámide y coincide en el centro, donde parece formarse una imagen con volumen. Ideal para experimentar en casa o en la escuela.

Sin publicidad, sin cuentas y sin recopilar datos.
```

## Gráficos (en `store/graphics/`)

| Campo de Play Console | Archivo |
| --- | --- |
| Ícono de la app (512×512) | `icon-512.png` |
| Gráfico de funciones (1024×500) | `feature-graphic-1024x500.png` |
| Capturas de pantalla del teléfono | `screenshot-1-menu.png` … `screenshot-4-mirar.png` |

Para regenerarlos: `pip install pillow playwright` y `python store/make_graphics.py` (necesita Google Chrome).

Recomendación: sumá también 1 o 2 **fotos reales** de la pirámide sobre el celular mostrando el holograma; son las que más convencen.

## Datos de la ficha

| Campo | Valor |
| --- | --- |
| Categoría | Entretenimiento (alternativa: Herramientas) |
| Etiquetas | Hologramas, Proyector, Ciencia |
| Correo de contacto | *(tu correo público de desarrollador)* |
| Sitio web | https://vmdanguise.github.io/holographicator/ |
| Política de privacidad | https://vmdanguise.github.io/holographicator/privacy.html |

## Contenido de la app (Política → Contenido de la app)

| Declaración | Respuesta |
| --- | --- |
| Política de privacidad | URL de arriba |
| Acceso a la app | Todas las funciones están disponibles sin acceso especial |
| Anuncios | No contiene anuncios |
| Clasificación del contenido | Categoría "Todas las demás apps" / Utilidad-Entretenimiento. Responder **No** a violencia, sexo, lenguaje, drogas, apuestas. **Sí** a "los usuarios pueden ver contenido de internet sin filtrar" (por el modo YouTube). No hay interacción entre usuarios ni compras. |
| Público objetivo | **13 a 15, 16 a 17 y 18 o más**. No marcar menores de 13 (evita los requisitos del programa Familias). Responder que la app **no** está diseñada para atraer a niños. |
| Seguridad de los datos | ¿Recopila o comparte datos? **No**. (La cámara y los archivos se procesan solo en el dispositivo; las preferencias quedan en el dispositivo. El reproductor de YouTube es un SDK de Google; si Play lo pide, declarar en "Uso de servicios de terceros" según su documentación). |
| Apps gubernamentales | No |
| Funciones financieras | Ninguna |
| Salud | No |
| ID de publicidad | No usa ID de publicidad |
| Permisos: cámara | Usada solo para mostrar la imagen en vivo en el modo Cámara |

## Notas de la versión (primera versión)

```
<es-419>
Primera versión en Google Play: modos YouTube, archivo y cámara, ajuste automático y guía para armar la pirámide.
</es-419>
```
