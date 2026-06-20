"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.neo4jDriver = void 0;
exports.testNeo4j = testNeo4j;
exports.closeNeo4j = closeNeo4j;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const config_1 = require("./config");
exports.neo4jDriver = neo4j_driver_1.default.driver(config_1.config.neo4j.uri, neo4j_driver_1.default.auth.basic(config_1.config.neo4j.username, config_1.config.neo4j.password));
async function testNeo4j() {
    const session = exports.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        await session.run("RETURN 1");
        console.log("Neo4j conectado");
    }
    finally {
        await session.close();
    }
}
async function closeNeo4j() {
    await exports.neo4jDriver.close();
}
