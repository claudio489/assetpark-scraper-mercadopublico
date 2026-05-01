# Licitaciones Intelligence

Sistema modular de inteligencia de licitaciones públicas. Motor independiente + API REST + Frontend desacoplado.

## Arquitectura

```
licitaciones-engine/
├── engine/          # Motor puro (lógica, sin framework web)
│   ├── src/
│   │   ├── types/      # Tipos core
│   │   ├── scraper/    # Extracción de datos
│   │   ├── normalizer/ # Normalización a formato estándar
│   │   ├── scoring/    # Motor de puntuación unificado
│   │   ├── profiles/   # Perfiles de cliente
│   │   └── pipeline/   # Orquestador scrape → normalize → score
│   └── dist/
├── api/             # API REST simple (Express, sin auth, sin tRPC)
│   └── src/
└── frontend/        # Módulo React ligero (Vite)
    └── src/
        ├── components/   # Dashboard, Tabla, Modal
        ├── hooks/        # useOpportunities
        └── types/
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Engine | Node.js + TypeScript (puro) |
| API | Express + TypeScript |
| Frontend | React 18 + Vite + TypeScript |
| Estado | React hooks (sin Redux/Zustand) |
| Estilos | CSS puro (sin Tailwind/Bootstrap) |

## Reglas de arquitectura

- **Sin base de datos**: Todo en memoria / mock
- **Sin autenticación**: API pública por diseño (módulo interno)
- **Sin tRPC**: REST JSON simple
- **Sin sesiones**: Stateless
- **Sin OAuth**: Sin flujos de login
- **Engine desacoplado**: Puede usarse standalone o importado

## Instalación y Ejecución (PowerShell)

El proyecto incluye un script `licitaciones.ps1` que automatiza todo.

### 1. Instalar dependencias

```powershell
cd licitaciones-engine
.\licitaciones.ps1 -Command install
```

### 2. Modo desarrollo (abre 2 ventanas de PowerShell)

```powershell
.\licitaciones.ps1 -Command dev
```

Esto abre automáticamente:
- API en http://localhost:3001
- Frontend en http://localhost:3000

### 3. Compilar para producción

```powershell
.\licitaciones.ps1 -Command build
```

### 4. Iniciar en producción

```powershell
.\licitaciones.ps1 -Command start
```

### 5. Test del engine

```powershell
.\licitaciones.ps1 -Command test
```

### 6. Limpiar todo

```powershell
.\licitaciones.ps1 -Command clean
```

### Comandos disponibles

| Comando | Acción |
|---------|--------|
| `install` | Instala dependencias de engine, api y frontend |
| `build` | Compila engine, api y frontend |
| `dev` | Abre API y Frontend en ventanas separadas |
| `start` | Inicia API compilada en producción |
| `test` | Ejecuta tests del engine con todos los perfiles |
| `clean` | Elimina `dist` y `node_modules` de todas las capas |

## Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/profiles` | Listar perfiles |
| POST | `/api/profiles` | Crear/actualizar perfil |
| GET | `/api/opportunities` | Obtener licitaciones |
| GET | `/api/opportunities/stats` | Estadísticas (calculadas del array) |
| POST | `/api/opportunities/run` | Ejecutar pipeline |

### Ejemplo: ejecutar pipeline

```bash
curl -X POST http://localhost:3001/api/opportunities/run \
  -H "Content-Type: application/json" \
  -d '{"profileId": "tecnologia", "limit": 20}'
```

## Perfiles predefinidos

| ID | Nombre | Rubro |
|----|--------|-------|
| `constructora` | Constructora Demo | Obras públicas, infraestructura |
| `tecnologia` | Empresa de Tecnología Demo | Software, TI, desarrollo |
| `salud` | Proveedor Salud Demo | Equipamiento médico |
| `general` | Perfil General Demo | Sin filtros |

## Scoring

Fórmula: `score = aiScore || matchScore || 50`

- **Match score**: Basado en keywords, rubros, región y monto
- **AI score**: Simulado (slot para embeddings/LLM en producción)

Clasificación:
- `≥ 80` → alta
- `60-79` → media
- `< 60` → baja

## Reutilización como módulo

```typescript
import { runPipeline, getProfile } from '@licitaciones/engine';

const profile = getProfile('constructora');
const result = await runPipeline({ profile });
```

## Integración con AssetPark

El frontend se embebe como módulo React importando `<App />` desde el paquete del frontend, o consumiendo la API REST desde cualquier cliente.

## Roadmap a producción

1. **Scraper real**: Reemplazar `MOCK_DATABASE` por fetch a API MercadoPublico
2. **AI Score**: Conectar a servicio de embeddings (OpenAI, etc.)
3. **Persistencia**: Agregar SQLite/Redis para cacheo (opcional)
4. **Multi-cliente**: Perfiles por tenant en base de datos
5. **Notificaciones**: Webhook/email cuando hay nuevas oportunidades "alta"
