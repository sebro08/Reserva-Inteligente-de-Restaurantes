"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keycloak = exports.memoryStore = void 0;
const express_session_1 = __importDefault(require("express-session"));
const keycloak_connect_1 = __importDefault(require("keycloak-connect"));
const path_1 = __importDefault(require("path"));
exports.memoryStore = new express_session_1.default.MemoryStore();
const keycloakConfigPath = path_1.default.resolve(__dirname, "../../keycloak.json");
exports.keycloak = new keycloak_connect_1.default({ store: exports.memoryStore }, keycloakConfigPath);
