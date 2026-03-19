import session from "express-session";
import Keycloak from "keycloak-connect";
import path from "path";

export const memoryStore = new session.MemoryStore();

const keycloakConfigPath = path.resolve(__dirname, "../../keycloak.json");

export const keycloak = new Keycloak({ store: memoryStore }, keycloakConfigPath);
