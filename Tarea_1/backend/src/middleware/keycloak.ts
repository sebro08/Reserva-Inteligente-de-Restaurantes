import session from "express-session";
import Keycloak from "keycloak-connect";
import path from "path";
import fs from "fs";

export const memoryStore = new session.MemoryStore();

const keycloakConfigPath = path.resolve(__dirname, "../../keycloak.json");

// [DOCKER COMPOSE] - Úsalo por defecto (carga la URL interna de localhost hardcodeada en el json)
export const keycloak = new Keycloak({ store: memoryStore }, keycloakConfigPath);

// [KUBERNETES] - Cuando pruebes en Kubernetes descomenta lo siguiente y comenta la línea de arriba.
// En Kubernetes 'localhost:8080' apuntará al mismo pod de la API y fallará, con esta configuración
// leemos la variable de entorno KEYCLOAK_URL inyectada en el Deployment.
/*
const rawConfig = fs.readFileSync(keycloakConfigPath, "utf8");
const config = JSON.parse(rawConfig);
if (process.env.KEYCLOAK_URL) {
  config["auth-server-url"] = process.env.KEYCLOAK_URL;
}
export const keycloak = new Keycloak({ store: memoryStore }, config);
*/

