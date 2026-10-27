# Perfiles de Participación 

Sitio estático, sin servidor ni dependencias. Abre `index.html` en el navegador.

## Secciones
- **Perfiles**: los seis perfiles (Tablas 1 y 4 del documento técnico).
- **Estrategias**: Tabla 5 (mensaje, canal, momento, medición), calendario feb–jun 2027 y las tres transversales.
- **Evidencia**: efecto de cada táctica en experimentos de campo, con su fuente.
- **Clima informativo**: noticias de medios mexicanos (GDELT, últimos 14 días) clasificadas por tema, con la respuesta recomendada para cada tema.
- **Mensajes**: generador por perfil, canal y tema, con validador (sin miedo, culpa, corrupción ni partidos).
- **Piloto 2027**: diseño y calculadora del efecto mínimo detectable.

## Noticias por estado
Las noticias vienen de Google News (RSS público, últimos 14 días, una consulta por estado) y se guardan en `noticias.js`.

El tema de cada nota y el **índice de preocupación mediática** (0–100) se calculan en el navegador con las palabras clave de `data.js`:
70 % × proporción de notas sobre seguridad, confianza o desinformación + 30 % × proporción de titulares con tono negativo.
Mide cobertura en medios, no la opinión de la ciudadanía.

## Datos
Todas las cifras vienen del documento técnico y de las notas metodológicas (`data.js`). No hay datos personales.
