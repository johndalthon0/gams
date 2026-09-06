# Despliegue (prueba gratis)

Arquitectura:

```
frontend (React)  ──►  backend (Node/Express)  ──►  MySQL (Railway)
   Vercel                   Render                        │
                              └──►  python_ia (FastAPI)  ──┘
                                       Render
```

| Pieza      | Servicio        | Plan        | Notas                              |
|------------|-----------------|-------------|------------------------------------|
| MySQL      | Railway         | trial ~$5   | sin SSL, `DB_SSL=false`            |
| backend    | Render web      | free        | se duerme a los 15 min             |
| python_ia  | Render web      | free        | build pesado (ver aviso ⚠️)        |
| frontend   | Vercel/Netlify  | free        | estático, no se duerme             |

---

## 1. MySQL en Railway  ✅ HECHO

- Servicio `MySQL-pgC3` con **Public Access** activado.
- Base `gams_mantenimiento` importada (40 tablas + datos) desde el dump local.
- Conexión verificada desde el código del backend (sin SSL).

Datos de conexión (pestaña **Variables** → `MYSQL_PUBLIC_URL`):
```
host = altaria.proxy.rlwy.net   port = 10369   user = root   db = gams_mantenimiento
```
Si rotas la contraseña en Railway, actualízala también en Render.

### Cargar el esquema

El dump de la BD local (`gams_mantenimiento`, 39 tablas, con datos) ya está generado:
`database/gams_full.sql` (estructura + datos) y `database/gams_schema.sql` (solo estructura).
El dump crea la base `gams_mantenimiento` completa — no hace falta `ia_schema.sql` aparte.

**Opción A — HeidiSQL (viene con Laragon):**
1. `C:\laragon\bin\heidisql\heidisql.exe` → nueva sesión.
2. Tipo *MariaDB or MySQL (TCP/IP)*, Host = `RAILWAY_TCP_PROXY_DOMAIN`,
   Puerto = `RAILWAY_TCP_PROXY_PORT`, Usuario = `root`, Contraseña = `MYSQLPASSWORD`. Abrir.
3. Menú **Archivo → Ejecutar archivo SQL** → elige `gams_full.sql`.

**Opción B — línea de comandos:**
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -h <PROXY_DOMAIN> -P <PROXY_PORT> -u root -p<MYSQLPASSWORD> --default-character-set=utf8mb4 < database\gams_full.sql
```

Como el dump crea la base `gams_mantenimiento`, en Render pon **`DB_NAME=gams_mantenimiento`**.

---

## 2. Backend + IA en Render (Blueprint)

1. Render → **New → Blueprint** → conecta este repo. Detecta [`render.yaml`](render.yaml).
2. Tras el primer deploy, en **cada** servicio (`gams-backend` y `gams-ia`) rellena
   las variables marcadas *sync: false*:

   | Variable      | Valor                                  |
   |---------------|----------------------------------------|
   | `DB_HOST`     | `MYSQLHOST` de Railway                  |
   | `DB_PORT`     | `MYSQLPORT` de Railway                  |
   | `DB_USER`     | `MYSQLUSER`                             |
   | `DB_PASSWORD` | `MYSQLPASSWORD`                         |
   | `DB_NAME`     | `MYSQLDATABASE`                         |

3. Solo en `gams-backend`:
   - `CORS_ORIGINS` = URL del frontend (ej. `https://gams.vercel.app`)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` = genera un par nuevo:
     `npx web-push generate-vapid-keys`
   - `IA_URL` ya apunta a `https://gams-ia.onrender.com` (ajústalo si cambias el nombre)
   - `JWT_SECRET` se autogenera.

4. Verifica:
   - `https://gams-backend-xxxx.onrender.com/` → `{"message":"API GAMS TI 🚀"}`
   - `https://gams-ia-xxxx.onrender.com/` → `{"sistema":"GAM IA v2.0",...}`

> ⚠️ **Build de `python_ia`:** `xgboost + lightgbm + scikit-learn + pandas` es pesado
> para el plan free (512 MB RAM). Si el build falla o el servicio hace OOM al arrancar,
> pídeme fijar versiones en `requirements.txt` o mover la IA a otro plan/host.

---

## 3. Frontend en Vercel

1. Vercel → **Add New → Project** → importa el repo.
2. **Root Directory:** `frontend` · **Framework:** Create React App.
3. Variable de entorno:
   - `REACT_APP_API_URL` = `https://gams-backend-xxxx.onrender.com/api`
4. Deploy. Copia la URL final y ponla en `CORS_ORIGINS` del backend (paso 2.3).

---

## 4. Mantener despiertos los servicios de Render (opcional)

El plan free duerme tras 15 min sin tráfico → primer request ~50 s (y aquí son
dos arranques encadenados: backend → IA).

- Crea 2 monitores HTTP en **UptimeRobot** (gratis), cada 5–10 min, a `/` de
  `gams-backend` y `gams-ia`.

---

## Cambiar Railway → Aiven (MySQL permanente, si se acaba el crédito)

Aiven tiene MySQL free que no caduca, pero exige SSL. Solo cambian variables:

- backend: `DB_SSL=true` (opcional `DB_SSL_CA` con el PEM en una línea)
- python_ia: `DB_SSL=true` (opcional `DB_SSL_CA_PATH` a un Secret File de Render)

El código ya soporta ambos modos; no hay que tocar nada más.
