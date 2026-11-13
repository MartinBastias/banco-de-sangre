# Banco de Sangre

Aplicación web con **Next.js (App Router) + React + TypeScript** en el frontend, API en **Node.js + Express + TypeScript + Drizzle ORM** en el backend y **PostgreSQL** como base de datos. Docker Compose levanta y conecta los tres contenedores y conserva los datos de PostgreSQL en un volumen persistente.

## Arquitectura y estructura

```text
banco-de-sangre/
├── frontend/                   # Contenedor web (Next.js App Router + React + TypeScript)
│   ├── src/
│   │   ├── app/                # Rutas y layouts (App Router)
│   │   ├── components/         # Componentes agrupados por carpeta (CalendarioCitas, EstadoElegibilidad, SeleccionPerfil)
│   │   └── lib/                # Utilidades, hooks y constantes compartidas
│   └── tests/                  # Pruebas automatizadas del frontend
├── backend/                    # Contenedor API (Node.js + Express + TypeScript + Drizzle ORM)
│   ├── drizzle/                # Migraciones SQL gestionadas con drizzle-kit
│   ├── src/
│   │   ├── features/           # Lógica y endpoints por funcionalidad (citas, donantes, elegibilidad, ficha-medica)
│   │   └── lib/                # Esquema Drizzle ORM, conexión a PostgreSQL y utilidades comunes
│   └── tests/                  # Pruebas automatizadas del backend
└── docker-compose.yml          # Orquestación de los 3 contenedores (db, backend, frontend)
```

## Requisitos

- Git
- Docker con Docker Compose v2 (`docker compose`)

Instala Docker según tu sistema operativo:

- Windows o macOS: [Docker Desktop](https://docs.docker.com/get-started/get-docker/)
- Linux: [Docker Engine](https://docs.docker.com/engine/install/) y el plugin [Docker Compose](https://docs.docker.com/compose/install/linux/)

En Linux, asegúrate también de que el servicio Docker esté iniciado y que tu usuario tenga permiso para ejecutar `docker`.

## Obtener y ejecutar el proyecto

Clona el repositorio y entra a su carpeta:

```sh
git clone https://github.com/MartinBastias/banco-de-sangre.git
cd banco-de-sangre
```

Comprueba que Docker está disponible y levanta los tres contenedores (`db`, `backend` y `frontend`):

```sh
docker --version
docker compose version
docker compose up -d --build --remove-orphans
```

La primera ejecución puede tardar mientras Docker descarga imágenes e instala las dependencias de cada contenedor. Cuando termine:

- **Aplicación web (Frontend - Next.js)**: <http://localhost:3000>
- **API (Backend - Express + Drizzle)**: <http://localhost:3001>
- **Base de datos (PostgreSQL)**: `localhost:5432`

Comprueba el estado de los contenedores:

```sh
docker compose ps
```

## Consultar PostgreSQL

Abre la consola interactiva de la base de datos dentro del contenedor `db`:

```sh
docker compose exec db psql -U banco_sangre -d banco_sangre
```

El prompt `banco_sangre=#` indica que ya estás dentro de PostgreSQL. Algunos comandos útiles:

```sql
\dt
SELECT * FROM donantes;
SELECT * FROM citas;
SELECT * FROM ficha_medica;
\q
```

Las consultas SQL terminan en `;`. `\q` sale de `psql`. También puedes ejecutar una consulta directamente desde la terminal, sin abrir la consola interactiva:

```sh
docker compose exec -T db psql -U banco_sangre -d banco_sangre -c "SELECT * FROM donantes;"
docker compose exec -T db psql -U banco_sangre -d banco_sangre -c "SELECT * FROM citas;"
docker compose exec -T db psql -U banco_sangre -d banco_sangre -c "SELECT * FROM ficha_medica;"
```

## Operación diaria y comandos útiles

Ver logs de todos los servicios en tiempo real:

```sh
docker compose logs -f
```

Ver solo los logs de un contenedor específico (`frontend`, `backend` o `db`):

```sh
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

Ejecutar pruebas, verificación de tipos o migraciones en los contenedores:

```sh
# Pruebas y verificación de tipos en el backend
docker compose exec backend npm test
docker compose exec backend npm run typecheck

# Generación/aplicación de migraciones de Drizzle ORM y limpieza de citas en el backend
docker compose exec backend npm run db:generate
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:clear

# Pruebas, lint y verificación de tipos en el frontend
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
```

Detener los contenedores sin borrar la base de datos:

```sh
docker compose down
```

Volver a iniciar los servicios ya creados:

```sh
docker compose up -d
```

Los datos están en el volumen `pgdata` y se conservan al ejecutar `docker compose down`. **No ejecutes `docker compose down -v`** salvo que quieras borrar también los volúmenes y sus datos.

## Configuración local

Docker Compose usa valores de desarrollo predeterminados para las credenciales de PostgreSQL y la URL de la API. Para personalizarlos, copia `.env.example` a `.env` en la raíz del proyecto:

```sh
cp .env.example .env
```

```env
DB_USER=banco_sangre
DB_PASSWORD=cambia_esta_clave
DB_NAME=banco_sangre
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Usa los mismos valores para conectar una herramienta gráfica (como DBeaver o pgAdmin) a PostgreSQL: host `localhost`, puerto `5432`, base de datos `DB_NAME`, usuario `DB_USER` y contraseña `DB_PASSWORD`.
