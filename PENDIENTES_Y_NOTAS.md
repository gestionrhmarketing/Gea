# Notas del Proyecto y Pendientes de Confirmación — GEA Environment

Este documento consolida los datos pendientes de confirmación, las afirmaciones proporcionadas por GEA sujetas a validación técnica o legal, y la guía para operar y publicar el sitio web corporativo de **GEA Environment**.

---

## 1. Datos pendientes de confirmación (Placeholders)

Los siguientes datos no venían especificados en el documento fuente y se encuentran marcados con etiquetas visuales `[... POR CONFIRMAR]` en el código y en el archivo de configuración central `site.config.json`:

1. **Razón Social Legal**: Identidad legal y RFC de la compañía para fines contractuales y pie de página.
2. **Teléfono de Atención**: Teléfono corporativo o conmutador de oficinas.
3. **WhatsApp Empresarial**: Número oficial de atención vía WhatsApp.
4. **Correo Electrónico**: Buzón de contacto (ej. `contacto@geaenvironment.com`).
5. **Dirección Física**: Domicilio de las oficinas centrales y/o centros de operación.
6. **Horario de Atención**: Días y rangos horarios de operación comercial y operativa.
7. **Cobertura Geográfica**: Ciudades, estados o regiones exactas atendidas (e.g. Zona Metropolitana, Bajío, cobertura nacional).
8. **Tiempo Promedio de Respuesta**: Tiempo estimado para emitir presupuestos o atender consultas.
9. **Redes Sociales**: Enlaces oficiales a LinkedIn, Facebook, Instagram u otras plataformas.
10. **Números de Autorización y Registros Ambientales**: Folios de autorización ante SEMARNAT, ASEA, dependencias estatales (SEDEMA/SMA) o SCT para recolección, transporte y disposición de residuos peligrosos, RPBI y manejo especial.
11. **Alcance Específico de RPBI**: Confirmación exacta de las etapas que GEA realiza de forma directa frente a las gestionadas mediante terceros autorizados (recolección, transporte, esterilización/incineración y celda especial).
12. **Catálogo Detallado de Estudios Técnicos e Industriales**: Relación específica de estudios ambientales y servicios industriales ofrecidos (MIA, Estudios de Riesgo, E-ET, etc.).
13. **Modalidades de Capacitación**: Si se imparten de manera presencial en planta, en aula o virtual, duración y si otorgan constancias con validez (ej. formato DC-3 ante la STPS).
14. **Aviso de Privacidad Definitivo**: Redacción legal aprobada conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).

---

## 2. Afirmaciones proporcionadas por GEA a validar antes de publicar

El documento describe capacidades e infraestructura que deben ser revalidadas formalmente con los responsables de operaciones antes del lanzamiento definitivo:

- **Infraestructura vehicular**: Unidades con sistemas de rastreo satelital en tiempo real, plataformas hidráulicas y equipos de contención antiderrames a bordo.
- **Centros de operación**: Disponibilidad y capacidades de las instalaciones de acopio o transferencia referidas.
- **Alcance del servicio de residuos**: Confirmación de la cobertura de la cadena completa (recolección, transporte, tratamiento y disposición final) para cada corriente de residuo.
- **Acompañamiento en trámites**: Si incluye firma de perito/responsable técnico ambiental o únicamente gestoría y armado de expedientes (COA, licencias, auditorías).

---

## 3. Arquitectura del sitio generado

El sitio fue construido con una arquitectura estática moderna (JAMstack sin dependencias de runtime), optimizada para carga ultra rápida, accesibilidad (WCAG 2.1 AA) y SEO:

- `dist/index.html`: Página de inicio (Hero con visual de identidad, propuesta de valor, resumen de servicios, pilares de trabajo, confianza y significado de marca).
- `dist/nosotros.html`: Misión, enfoque preventivo y operativo, capacidades operativas y respaldo de marca.
- `dist/servicios.html`: Catálogo general de soluciones ambientales.
- `dist/residuos-peligrosos.html`: Página de servicio especializada para residuos industriales peligrosos.
- `dist/rpbi.html`: Página de servicio para residuos biológico-infecciosos (sector salud, laboratorios e industrias).
- `dist/residuos-manejo-especial.html`: Página de servicio para residuos de procesos, reciclables, chatarra, RAEES y construcción.
- `dist/capacitacion-asesoria-ambiental.html`: Programas de formación técnica y consultoría ambiental.
- `dist/tramites-ambientales.html`: Gestión de COA, licencias, estudios y programas normativos.
- `dist/contacto.html`: Formulario con validación completa, preselección por parámetro URL y datos de contacto.
- `dist/aviso-de-privacidad.html`: Plantilla y estructura de privacidad.
- `dist/404.html`: Página amigable de error con navegación de rescate.
- `dist/sitemap.xml` y `dist/robots.txt`: Generados automáticamente conforme al modo borrador/producción.

---

## 4. Instrucciones para ejecutar y actualizar

### Requisitos previos
- Node.js versión 18 o superior instalado en el equipo.

### Comandos disponibles
Desde la carpeta raíz del proyecto (`gea-environment-web`):

1. **Compilar el sitio**:
   ```bash
   npm run build
   # o bien: node scripts/build.mjs
   ```
   Genera o actualiza todos los archivos HTML y recursos en la carpeta `dist/`, validando enlaces internos y reportando marcadores pendientes.

2. **Iniciar servidor de previsualización local**:
   ```bash
   npm run serve
   # o bien: node scripts/serve.mjs 4321
   ```
   Abre el servidor en `http://localhost:4321`.

3. **Compilar y servir en un solo comando**:
   ```bash
   npm run dev
   ```

---

## 5. Pasos para el lanzamiento a producción

1. **Actualizar `site.config.json`**:
   - Reemplazar los valores de `contact` (teléfono, whatsapp, correo, dirección, horarios, cobertura).
   - Agregar enlaces en `social` si existen.
   - Configurar `formEndpoint` con la URL del servicio receptor (e.g. Formspree, Basin, webhook institucional o API propia).
   - Configurar `baseUrl` con el dominio real final (ej. `https://geaenvironment.com`).
   - Cambiar `"draft": false` para desactivar el banner amarillo preliminar y habilitar la indexación en motores de búsqueda (`robots.txt` y meta tags).

2. **Recompilar**:
   ```bash
   npm run build
   ```

3. **Despliegue**:
   - La carpeta `dist/` contiene la totalidad del sitio estático listo para ser alojado en cualquier proveedor de hosting (Cloudflare Pages, Vercel, Netlify, Firebase Hosting, AWS S3 o servidor Apache/Nginx).
