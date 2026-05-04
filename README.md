# AssetPark Scraper MercadoPublico v4.0

Motor de inteligencia de licitaciones para prospectar oportunidades de negocio en MercadoPublico.cl.

## Arquitectura

- **engine/**: Lógica pura (TypeScript) - scraper, perfiles, scoring, pipeline
- **api/**: Servidor Express REST - expone endpoints + sirve frontend
- **frontend/**: HTML + JavaScript vanilla (sin build) - una sola página funcional
- **render.yaml**: Configuración para deploy en Render.com (gratis)

## Perfiles de búsqueda predefinidos

| Perfil | Rubro |
|--------|-------|
| `constructora` | Construcción, obras civiles, edificación |
| `tecnologia` | Software, servicios TI, ciberseguridad |
| `salud` | Insumos médicos, equipamiento hospitalario |
| `imprenta` | Imprenta, gráfica, publicidad, pendones PVC, letreros, autoadhesivos, troquelado |
| `general` | Todas las licitaciones activas sin filtrar |
| `buceo` | Importación equipo de buceo técnico |

Cada perfil es un **cañón de ventas empaquetado** que busca oportunidades específicas según keywords.

## v4.0 - Cambios principales

- **Scoring porcentual**: Base score calculado como % de keywords matched (+12 bonus si hay match parcial)
- **No todo es EVITAR**: Umbrales ajustados — POSTULAR ≥60, EVALUAR ≥40, EVITAR <40
- **Monto=0 no penaliza**: Score neutral 60 para licitaciones activas con monto oculto
- **Perfil General**: Muestra todas las activas marcadas como EVALUAR para decisión manual
- **Cache-busting**: Headers anti-cache en API y static serving para evitar versiones viejas en Render
- **Frontend robusto**: Logs de debug en consola, try/catch en renders, escaping seguro

## Uso local (Windows)

```powershell
# Instalar dependencias (solo engine + api, frontend no necesita)
.\licitaciones.ps1 -Command install

# Compilar
.\licitaciones.ps1 -Command build

# Levantar (un solo servidor en puerto 3001)
.\licitaciones.ps1 -Command dev

# Abrir navegador: http://localhost:3001
```

## Deploy en Render (recomendado)

```powershell
# Prepara repositorio Git e instrucciones
.\deploy-to-render.ps1 -Command init
```

Seguí las instrucciones que aparecen. Resumen:

1. Crear repo en GitHub (público o privado)
2. Conectar repo local a GitHub (`git remote add origin ...` + `git push`)
3. Registrar en https://render.com con cuenta GitHub
4. En Render: **New + → Blueprint**
5. Seleccionar tu repo → Render lee `render.yaml` → **Apply**
6. Esperar 2-3 minutos → listo en `https://tu-app.onrender.com`

## API REST Endpoints

```
GET  /api/health              → Estado del servicio
GET  /api/profiles            → Listar perfiles
POST /api/profiles            → Crear perfil
GET  /api/opportunities       → Últimas oportunidades
GET  /api/opportunities/stats → Estadísticas
POST /api/opportunities/run   → Ejecutar pipeline

GET    /api/portfolio              → Portfolio guardado
GET    /api/portfolio/stats        → Stats del portfolio
POST   /api/portfolio              → Guardar licitación
PUT    /api/portfolio/:id/score    → Editar score
PUT    /api/portfolio/:id/category → Cambiar categoría
PUT    /api/portfolio/:id/profile  → Cambiar perfil asignado
PUT    /api/portfolio/:id/notes    → Editar notas
DELETE /api/portfolio/:id         → Eliminar
```

## Funcionalidades

- **Pipeline**: Scrapea MercadoPublico.cl en tiempo real
- **Scoring automático**: Match por keywords + simulación AI
- **Portfolio**: Guarda licitaciones para postular con categoría de negocio
- **Score editable**: Click en el badge para cambiar puntaje (0-100)
- **Perfil asignado**: Cada licitación guardada recuerda qué perfil la encontró
- **Filtros**: Por categoría de negocio y por perfil de búsqueda
- **Modo producción**: Un solo servidor sirve API + frontend estático

## Notas

- El monto de licitaciones activas no se expone por la API de MercadoPublico (muestra "No disp.")
- Render free tier se duerme tras 15 min inactivo (despierta en ~30s)
- Portfolio vive en memoria: se reinicia al deployar o al dormir el servicio
