import neo4j from "neo4j-driver";
import { config } from "./config";

export const driver = neo4j.driver(
  config.neo4j.uri,
  neo4j.auth.basic(
    config.neo4j.username,
    config.neo4j.password
  )
);

export async function testNeo4j(): Promise<void> {
  const session = driver.session();

  try {
    await session.run(`
      CREATE (n:Test {name:'GraphLoader'})
    `);

    console.log("Neo4j conectado");
  } finally {
    await session.close();
  }
}

export async function closeNeo4j(): Promise<void> {
  await driver.close();
}