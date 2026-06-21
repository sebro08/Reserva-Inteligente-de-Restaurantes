// src/graph/neo4j.service.ts
import neo4j, { Driver } from "neo4j-driver";

let driverInstance: Driver | null = null;

function getDriver(): Driver {
  if (!driverInstance) {
    driverInstance = neo4j.driver(
      process.env.NEO4J_URI as string,
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME as string,
        process.env.NEO4J_PASSWORD as string
      )
    );
  }
  return driverInstance;
}

export function getSession() {
  return getDriver().session();
}

export async function closeNeo4j() {
  if (driverInstance) {
    await driverInstance.close();
    driverInstance = null;
  }
}