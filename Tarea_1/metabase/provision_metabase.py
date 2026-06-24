#!/usr/bin/env python3
# =============================================================================
# provision_metabase.py  —  "El boton" de Metabase (Track C)
# =============================================================================
# Provisiona Metabase de forma AUTOMATICA e IDEMPOTENTE despues de levantar los
# contenedores, para no armar nada a mano en el video. Crea:
#   1. La conexion al Data Warehouse (Hive, via el driver SparkSQL INTEGRADO en
#      Metabase — no requiere ningun .jar externo).
#   2. Las 9 preguntas (SQL nativo sobre los cubos OLAP de restaurante_olap).
#   3. Los 3 dashboards obligatorios, ya armados con sus graficos.
#
# Como vos haces `docker compose down -v` constantemente (no conservas el volumen
# metabase_data), este script reconstruye TODO desde cero en ~segundos. Esa es la
# "fuente de verdad" versionada en git: si Metabase arranca en blanco, lo corres
# una vez y los 3 dashboards aparecen identicos siempre.
#
# Uso:
#   pip install requests        # unica dependencia
#   # 1) levantar: db + perfil data (hive) + perfil viz (metabase) y correr el ETL
#   # 2) python metabase/provision_metabase.py
#
# Todo es configurable por variables de entorno (ver bloque CONFIG). Por defecto
# apunta a Hive/SparkSQL; si algun dia hiciera falta el fallback a un mart en
# Postgres, basta con exportar MB_DB_ENGINE=postgres y los MB_DB_* respectivos.
# =============================================================================

import os
import sys
import time

try:
    import requests
except ImportError:
    sys.exit("Falta 'requests'. Instalalo con:  pip install requests")

# --------------------------- CONFIG ------------------------------------------
MB_URL = os.environ.get("MB_URL", "http://localhost:3030")

# Cuenta admin local de Metabase (se crea en el asistente la 1a vez)
ADMIN_EMAIL = os.environ.get("MB_ADMIN_EMAIL", "admin@resto.com")
ADMIN_PASSWORD = os.environ.get("MB_ADMIN_PASSWORD", "Restaurante.2026")
ADMIN_FIRST = os.environ.get("MB_ADMIN_FIRST", "Admin")
ADMIN_LAST = os.environ.get("MB_ADMIN_LAST", "Resto")
SITE_NAME = os.environ.get("MB_SITE_NAME", "Reserva Inteligente")

# Conexion al Data Warehouse. Por defecto: Hive via el driver SparkSQL integrado.
DB_DISPLAY_NAME = os.environ.get("MB_DB_NAME", "Data Warehouse (Hive)")
DB_ENGINE = os.environ.get("MB_DB_ENGINE", "sparksql")
DB_HOST = os.environ.get("MB_DB_HOST", "hive-server")
DB_PORT = int(os.environ.get("MB_DB_PORT", "10000"))
DB_DBNAME = os.environ.get("MB_DB_DBNAME", "restaurante_olap")
DB_USER = os.environ.get("MB_DB_USER", "hive")
DB_PASSWORD = os.environ.get("MB_DB_PASSWORD", "")

# Esquema donde viven los cubos (se antepone a cada tabla en el SQL)
OLAP = os.environ.get("MB_OLAP_SCHEMA", "restaurante_olap")

session_token = None  # se setea tras autenticar


# --------------------------- HTTP helpers ------------------------------------
def _headers():
    h = {"Content-Type": "application/json"}
    if session_token:
        h["X-Metabase-Session"] = session_token
    return h


def api(method, path, **kwargs):
    url = f"{MB_URL}{path}"
    resp = requests.request(method, url, headers=_headers(), timeout=60, **kwargs)
    if not resp.ok:
        raise RuntimeError(f"{method} {path} -> HTTP {resp.status_code}: {resp.text[:400]}")
    return resp.json() if resp.text else {}


def esperar_metabase():
    print(f"Esperando a que Metabase responda en {MB_URL} ...")
    for intento in range(60):  # hasta ~5 min
        try:
            r = requests.get(f"{MB_URL}/api/health", timeout=5)
            if r.ok:
                print("Metabase OK.")
                return
        except requests.RequestException:
            pass
        time.sleep(5)
    sys.exit("Metabase no respondio a tiempo. ¿Esta levantado el perfil viz?")


# --------------------------- Autenticacion -----------------------------------
def autenticar():
    """Si Metabase esta en blanco, ejecuta el setup (crea admin). Si ya estaba
    configurado, hace login normal. Devuelve el token de sesion."""
    global session_token
    props = requests.get(f"{MB_URL}/api/session/properties", timeout=30).json()

    if not props.get("has-user-setup"):
        print("Metabase en blanco -> ejecutando setup inicial (creando admin)...")
        token = props.get("setup-token")
        body = {
            "token": token,
            "user": {
                "first_name": ADMIN_FIRST,
                "last_name": ADMIN_LAST,
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "site_name": SITE_NAME,
            },
            "prefs": {"site_name": SITE_NAME, "allow_tracking": False},
        }
        out = requests.post(f"{MB_URL}/api/setup", json=body, timeout=60)
        if not out.ok:
            sys.exit(f"Fallo el setup inicial: HTTP {out.status_code}: {out.text[:400]}")
        session_token = out.json()["id"]
    else:
        print("Metabase ya configurado -> login...")
        out = requests.post(
            f"{MB_URL}/api/session",
            json={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=60,
        )
        if not out.ok:
            sys.exit(
                "Login fallido: Metabase YA tiene una cuenta creada y no coincide\n"
                f"  con MB_ADMIN_EMAIL/MB_ADMIN_PASSWORD (probe: {ADMIN_EMAIL}).\n"
                "  Opcion A (recomendada): dejar Metabase en blanco para que el script\n"
                "    haga el setup solo:\n"
                "       docker compose --profile viz rm -sf metabase\n"
                "       docker volume rm tarea_1_metabase_data\n"
                "       docker compose --profile viz up -d metabase\n"
                "  Opcion B: exportar las credenciales reales de tu Metabase:\n"
                "       $env:MB_ADMIN_EMAIL='...'; $env:MB_ADMIN_PASSWORD='...'"
            )
        session_token = out.json()["id"]
    print("Sesion autenticada.")


# --------------------------- Base de datos -----------------------------------
def _listar(path, key="data"):
    """GET que puede devolver lista plana o {'data': [...]} segun version."""
    out = api("GET", path)
    if isinstance(out, dict):
        return out.get(key, [])
    return out


def asegurar_db():
    """Crea la conexion al DW si no existe; si existe, reutiliza su id."""
    for db in _listar("/api/database"):
        if db.get("name") == DB_DISPLAY_NAME:
            print(f"Conexion '{DB_DISPLAY_NAME}' ya existe (id={db['id']}).")
            api("POST", f"/api/database/{db['id']}/sync_schema")
            return db["id"]

    print(f"Creando conexion '{DB_DISPLAY_NAME}' (engine={DB_ENGINE}, "
          f"{DB_HOST}:{DB_PORT}/{DB_DBNAME})...")
    body = {
        "name": DB_DISPLAY_NAME,
        "engine": DB_ENGINE,
        "details": {
            "host": DB_HOST,
            "port": DB_PORT,
            "dbname": DB_DBNAME,
            "user": DB_USER,
            "password": DB_PASSWORD,
        },
    }
    db = api("POST", "/api/database", json=body)
    db_id = db["id"]
    api("POST", f"/api/database/{db_id}/sync_schema")
    print(f"Conexion creada (id={db_id}).")
    return db_id


def validar_conexion(db_id):
    """Corre una consulta real contra un cubo para confirmar que el driver
    SparkSQL si habla con HiveServer2 y que los datos estan. Falla con un
    mensaje accionable si no (asi no quedan dashboards vacios en silencio)."""
    print("Validando que la conexion realmente lea los cubos...")
    body = {
        "database": db_id,
        "type": "native",
        "native": {"query": f"SELECT COUNT(*) AS n FROM {OLAP}.olap_pedidos_estado"},
    }
    try:
        out = api("POST", "/api/dataset", json=body)
    except RuntimeError as e:
        sys.exit(
            "No se pudo consultar el Data Warehouse.\n"
            f"  Detalle: {e}\n"
            "  Causas tipicas:\n"
            "   - El perfil 'data' (hive-server) no esta arriba, o el ETL no corrio.\n"
            "   - El driver SparkSQL de Metabase no logro el handshake con HiveServer2.\n"
            "  Fallback: exporta MB_DB_ENGINE=postgres y los MB_DB_* de un mart en\n"
            "  Postgres (ver docs/track_c_metabase.md)."
        )
    if out.get("status") != "completed" or not out.get("data", {}).get("rows"):
        sys.exit(f"La consulta de prueba no devolvio datos: {str(out)[:400]}")
    filas = out["data"]["rows"][0][0]
    print(f"Conexion validada: olap_pedidos_estado tiene {filas} filas.")


# --------------------------- Preguntas (cards) -------------------------------
def upsert_card(db_id, name, sql, display, viz):
    """Crea o actualiza una pregunta de SQL nativo. Idempotente por nombre."""
    payload = {
        "name": name,
        "dataset_query": {"type": "native", "native": {"query": sql}, "database": db_id},
        "display": display,
        "visualization_settings": viz,
    }
    for c in _listar("/api/card"):
        if c.get("name") == name and not c.get("archived"):
            api("PUT", f"/api/card/{c['id']}", json=payload)
            print(f"   (=) pregunta actualizada: {name}")
            return c["id"]
    card = api("POST", "/api/card", json=payload)
    print(f"   (+) pregunta creada: {name}")
    return card["id"]


def definir_preguntas(db_id):
    """Devuelve {clave: card_id} para las 9 preguntas sobre los cubos OLAP."""
    t = OLAP  # prefijo de esquema
    ids = {}

    # --- Dashboard 1: Ingresos ---
    ids["ing_mes_cat"] = upsert_card(
        db_id, "Ingresos por mes y categoria",
        f"SELECT periodo, categoria, ingresos FROM {t}.olap_ingresos_mes_categoria "
        f"ORDER BY periodo, categoria",
        "bar",
        {"graph.dimensions": ["periodo", "categoria"], "graph.metrics": ["ingresos"],
         "stackable.stack_type": "stacked"},
    )
    ids["ing_cat"] = upsert_card(
        db_id, "Participacion de ingresos por categoria",
        f"SELECT categoria, ingresos FROM {t}.olap_ingresos_categoria "
        f"ORDER BY ingresos DESC",
        "pie",
        {"pie.dimension": "categoria", "pie.metric": "ingresos"},
    )
    ids["ing_mes"] = upsert_card(
        db_id, "Ingresos totales por mes",
        f"SELECT periodo, SUM(ingresos) AS ingresos FROM {t}.olap_ingresos_mes_categoria "
        f"GROUP BY periodo ORDER BY periodo",
        "bar",
        {"graph.dimensions": ["periodo"], "graph.metrics": ["ingresos"]},
    )

    # --- Dashboard 2: Actividad geografica ---
    ids["geo_mapa"] = upsert_card(
        db_id, "Mapa de actividad por zona",
        f"SELECT zona, latitud, longitud, pedidos, ingresos FROM {t}.olap_actividad_geografica",
        "map",
        {"map.type": "pin", "map.latitude_column": "latitud",
         "map.longitude_column": "longitud"},
    )
    ids["geo_pedidos"] = upsert_card(
        db_id, "Pedidos por zona",
        f"SELECT zona, pedidos FROM {t}.olap_actividad_geografica ORDER BY pedidos DESC",
        "row",
        {"graph.dimensions": ["zona"], "graph.metrics": ["pedidos"]},
    )
    ids["geo_clientes"] = upsert_card(
        db_id, "Clientes unicos por zona",
        f"SELECT zona, clientes FROM {t}.olap_actividad_geografica ORDER BY clientes DESC",
        "bar",
        {"graph.dimensions": ["zona"], "graph.metrics": ["clientes"]},
    )

    # --- Dashboard 3: Estadisticas de pedidos ---
    ids["est_pie"] = upsert_card(
        db_id, "Distribucion de pedidos por estado",
        f"SELECT estado, pedidos FROM {t}.olap_pedidos_estado ORDER BY pedidos DESC",
        "pie",
        {"pie.dimension": "estado", "pie.metric": "pedidos"},
    )
    ids["est_mes"] = upsert_card(
        db_id, "Completados vs Cancelados por mes",
        f"SELECT periodo, estado, pedidos FROM {t}.olap_pedidos_mes_estado "
        f"WHERE estado IN ('Completed','Cancelled') ORDER BY periodo, estado",
        "line",
        {"graph.dimensions": ["periodo", "estado"], "graph.metrics": ["pedidos"]},
    )
    ids["est_tasa"] = upsert_card(
        db_id, "Tasa de cancelacion (%)",
        f"SELECT ROUND(100.0 * SUM(CASE WHEN estado = 'Cancelled' THEN pedidos ELSE 0 END) "
        f"/ SUM(pedidos), 1) AS tasa_cancelacion_pct FROM {t}.olap_pedidos_estado",
        "scalar",
        {},
    )
    return ids


# --------------------------- Dashboards --------------------------------------
def upsert_dashboard(name):
    for d in _listar("/api/dashboard"):
        if d.get("name") == name and not d.get("archived"):
            print(f"   (=) dashboard reutilizado: {name}")
            return d["id"]
    d = api("POST", "/api/dashboard", json={"name": name})
    print(f"   (+) dashboard creado: {name}")
    return d["id"]


def armar_dashboard(name, dashcards):
    """dashcards: lista de (card_id, row, col, size_x, size_y)."""
    dash_id = upsert_dashboard(name)
    cuerpo = {"dashcards": [
        {
            "id": -(i + 1),                # id temporal negativo = card nueva
            "card_id": cid,
            "row": row, "col": col,
            "size_x": sx, "size_y": sy,
            "series": [], "parameter_mappings": [], "visualization_settings": {},
        }
        for i, (cid, row, col, sx, sy) in enumerate(dashcards)
    ]}
    api("PUT", f"/api/dashboard/{dash_id}", json=cuerpo)
    return dash_id


def main():
    esperar_metabase()
    autenticar()
    db_id = asegurar_db()
    validar_conexion(db_id)

    print("Creando preguntas (SQL nativo sobre los cubos OLAP)...")
    q = definir_preguntas(db_id)

    print("Armando los 3 dashboards...")
    # Grid de Metabase = 24 columnas de ancho.
    d1 = armar_dashboard("Ingresos por mes y categoria", [
        (q["ing_mes_cat"], 0, 0, 12, 7),
        (q["ing_cat"],     0, 12, 12, 7),
        (q["ing_mes"],     7, 0, 24, 6),
    ])
    d2 = armar_dashboard("Actividad de clientes por zona geografica", [
        (q["geo_mapa"],     0, 0, 24, 8),
        (q["geo_pedidos"],  8, 0, 12, 7),
        (q["geo_clientes"], 8, 12, 12, 7),
    ])
    d3 = armar_dashboard("Estadisticas de pedidos (completados vs cancelados)", [
        (q["est_pie"],  0, 0, 12, 7),
        (q["est_tasa"], 0, 12, 6, 4),
        (q["est_mes"],  7, 0, 24, 7),
    ])

    print("\n=========================================")
    print(" Metabase provisionado correctamente!")
    print(" Dashboards:")
    print(f"   - {MB_URL}/dashboard/{d1}")
    print(f"   - {MB_URL}/dashboard/{d2}")
    print(f"   - {MB_URL}/dashboard/{d3}")
    print(f" Admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print("=========================================")


if __name__ == "__main__":
    main()
