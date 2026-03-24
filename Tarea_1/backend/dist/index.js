"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.resolve(__dirname, "../../.env") });
const data_source_1 = require("./database/data-source");
const routes_1 = __importDefault(require("./routes"));
const express_session_1 = __importDefault(require("express-session"));
const keycloak_1 = require("./middleware/keycloak");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 1. Añadir el manejo de sesiones (requerido por keycloak-connect)
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'clave-secreta-restaurante',
    resave: false,
    saveUninitialized: true,
    store: keycloak_1.memoryStore
}));
// 2. Inicializar middleware de Keycloak
app.use(keycloak_1.keycloak.middleware());
// Montar las rutas principales
app.use("/", routes_1.default);
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "restaurante-api" });
});
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Entidades cargadas:", data_source_1.AppDataSource.entityMetadatas.map(e => e.name));
    console.log("Conectado a la base de datos");
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    if (error instanceof Error) {
        console.error("Error al conectar la base de datos:", error.message);
    }
    else {
        console.error("Error desconocido:", error);
    }
});
