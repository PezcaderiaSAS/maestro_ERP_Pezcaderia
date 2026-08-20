# Documentación de Variables de Entorno (Environment Configuration)

Las siguientes variables determinan la configuración de base de datos, puertos, claves de encriptación y servicios en el proyecto.

---

## 🔑 Referencia de Variables (`.env.twenty`)

<!-- AUTO-GENERATED: ENV -->
| Variable | Requerido | Descripción | Ejemplo / Valor por Defecto |
| :--- | :---: | :--- | :--- |
| `TAG` | No | Etiqueta de versión de contenedor Docker. | `latest` |
| `PG_DATABASE_USER` | Sí | Usuario principal de PostgreSQL. | `postgres` |
| `PG_DATABASE_PASSWORD` | Sí | Contraseña del usuario PostgreSQL. | `postgres` |
| `PG_DATABASE_HOST` | Sí | Host / Dirección del servidor PostgreSQL. | `db` |
| `PG_DATABASE_PORT` | Sí | Puerto de conexión de la base de datos. | `5432` |
| `PG_DATABASE_NAME` | Sí | Nombre de la base de datos. | `default` |
| `SERVER_URL` | Sí | URL pública o local del servidor API. | `http://localhost:3000` |
| `REDIS_URL` | No | Cadena de conexión para caché Redis. | `redis://redis:6379` |
| `STORAGE_TYPE` | Sí | Almacenamiento de archivos (local o cloud). | `local` |
| `APP_SECRET` | Sí | Token secreto para firma de sesiones. | `pezcaderia-secret-app-token-...` |
| `ENCRYPTION_KEY` | Sí | Clave base64 de encriptación de datos sensibles. | `N2QxMDM1M2U2YzU5...` |
| `FALLBACK_ENCRYPTION_KEY` | No | Clave secundaria de respaldo para desencriptación. | `N2QxMDM1M2U2YzU5...` |
| `DISABLE_DB_MIGRATIONS` | No | Desactiva las migraciones automáticas al iniciar. | `false` |
| `DISABLE_CRON_JOBS_REGISTRATION` | No | Desactiva la ejecución de tareas programadas. | `false` |
<!-- AUTO-GENERATED: ENV END -->

---
*Documento auto-generado a partir de `.env.twenty`.*
