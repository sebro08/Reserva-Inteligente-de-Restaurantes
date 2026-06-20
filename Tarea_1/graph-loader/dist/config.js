"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const localEnv = path_1.default.resolve(__dirname, "../.env.local");
const rootEnv = path_1.default.resolve(__dirname, "../../.env");
console.log("Buscando .env local en:", localEnv);
console.log("Buscando .env raíz en:", rootEnv);
dotenv_1.default.config({ path: localEnv });
dotenv_1.default.config({ path: rootEnv });
console.log("DB_HOST cargado:", process.env.DB_HOST);
exports.config = {
    postgres: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
    mongo: {
        uri: process.env.MONGO_URI,
        database: process.env.MONGO_DB_NAME,
    },
    neo4j: {
        uri: process.env.NEO4J_URI,
        username: process.env.NEO4J_USERNAME,
        password: process.env.NEO4J_PASSWORD,
    },
};
