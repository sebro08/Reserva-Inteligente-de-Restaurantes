"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
exports.testMongo = testMongo;
exports.closeMongo = closeMongo;
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
let client;
async function connectMongo() {
    client = new mongodb_1.MongoClient(config_1.config.mongo.uri);
    await client.connect();
    console.log("Mongo conectado");
    return client.db(process.env.MONGO_DB_NAME);
}
async function testMongo() {
    const db = await connectMongo();
    const count = await db
        .collection("restaurants")
        .countDocuments();
    console.log("Mongo conectado. Restaurantes:", count);
}
async function closeMongo() {
    if (client) {
        await client.close();
    }
}
