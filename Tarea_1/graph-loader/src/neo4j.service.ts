import neo4j from "neo4j-driver";
import { config } from "./config";

export const neo4jDriver = neo4j.driver(
  config.neo4j.uri,
  neo4j.auth.basic(
    config.neo4j.username,
    config.neo4j.password
  )
);

export async function testNeo4j(): Promise<void> {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    await session.run("RETURN 1");
    console.log("Neo4j conectado");
  } finally {
    await session.close();
  }
}

export async function closeNeo4j(): Promise<void> {
  await neo4jDriver.close();
}