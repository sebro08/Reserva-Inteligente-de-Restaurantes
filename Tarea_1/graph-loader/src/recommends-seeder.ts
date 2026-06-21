import { neo4jDriver } from "./neo4j.service";

export async function seedRecommends(): Promise<void> {
  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    // Dos usuarios "se recomiendan" si compraron el mismo plato
    // El peso = cuántos platos en común tienen
    await session.run(`
      MATCH (u1:User)-[:PLACED]->(:Order)-[:CONTAINS]->(p:Plate)<-[:CONTAINS]-(:Order)<-[:PLACED]-(u2:User)
      WHERE u1.id < u2.id
      WITH u1, u2, count(DISTINCT p) AS sharedPlates
      WHERE sharedPlates >= 2
      MERGE (u1)-[r:RECOMMENDS]->(u2)
      SET r.weight = sharedPlates
      MERGE (u2)-[r2:RECOMMENDS]->(u1)
      SET r2.weight = sharedPlates
    `);

    console.log("Relaciones RECOMMENDS creadas");
  } finally {
    await session.close();
  }
}