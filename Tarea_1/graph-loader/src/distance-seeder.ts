import { neo4jDriver } from "./neo4j.service";

export async function seedDistances(): Promise<void> {
  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    // Trae todas las locations que ya están en el grafo
    const result = await session.run(`
      MATCH (l:Location)
      RETURN l.id AS id
    `);

    const ids = result.records.map((r) => r.get("id"));

    // Genera una distancia simulada entre cada par (no dirigido, simétrico)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const km = +(Math.random() * 20 + 1).toFixed(2);       // 1–21 km
        const minutes = Math.round(km * 2.5);                   // estimado simple

        await session.run(
          `
          MATCH (a:Location {id: $idA}), (b:Location {id: $idB})
          MERGE (a)-[d:DISTANCE]->(b)
          SET d.km = $km, d.minutes = $minutes
          MERGE (b)-[d2:DISTANCE]->(a)
          SET d2.km = $km, d2.minutes = $minutes
          `,
          { idA: ids[i], idB: ids[j], km, minutes }
        );
      }
    }

    console.log(`Distancias creadas entre ${ids.length} ubicaciones`);
  } finally {
    await session.close();
  }
}