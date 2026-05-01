# Licitaciones Intelligence

Sistema modular de inteligencia de licitaciones publicas. Conecta con API real de MercadoPublico.cl.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Engine | Node.js + TypeScript |
| API | Express + REST JSON |
| Frontend | React 18 + Vite + TypeScript |
| Datos | API real MercadoPublico.cl |

## Estructura

```
licitaciones-engine/
  engine/     # Motor puro (scraper, normalizer, scoring, profiles, pipeline)
  api/        # API REST Express
  frontend/   # React + Vite (tema dark)
```

## Perfiles incluidos

- **Importacion Equipo de Buceo** (default)
- Constructora, Tecnologia, Salud, General

## Instrucciones locales (PowerShell)

```powershell
cd licitaciones-engine

# Instalar dependencias
cd engine; npm install; cd ..
cd api; npm install; cd ..
cd frontend; npm install; cd ..

# Compilar
cd engine; npx tsc; cd ..
cd api; npx tsc; cd ..

# Levantar
.\licitaciones.ps1 -Command dev
```

Abrir: http://localhost:3000

## Deploy en Render (gratis)

1. Crear cuenta en https://render.com
2. New Web Service -> Connect GitHub repo
3. O usar Deploy from ZIP:
   - Subir `licitaciones-engine-v2026-final.zip`
   - Runtime: Node
   - Build: `cd engine && npm install && npx tsc && cd ../api && npm install && npx tsc`
   - Start: `cd api && node dist/index.js`
   - Plan: Free

## Endpoints API

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/profiles | Listar perfiles |
| POST | /api/opportunities/run | Ejecutar pipeline |
| GET | /api/opportunities | Obtener licitaciones |
| GET | /api/opportunities/stats | Estadisticas |

## Token MercadoPublico

El sistema usa tu token: `8BBCAB7E-0911-4E40-BD68-C56A0A33FF78`
