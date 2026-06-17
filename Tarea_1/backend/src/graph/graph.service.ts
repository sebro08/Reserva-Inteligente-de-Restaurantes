import { getSession } from "./neo4j.service";

export async function getTopProducts() {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (p1:Plate)<-[:CONTAINS]-(o:Order)-[:CONTAINS]->(p2:Plate)
      WHERE p1.id < p2.id

      RETURN
        p1.name AS product1,
        p2.name AS product2,
        count(*) AS times

      ORDER BY times DESC
      LIMIT 5
    `);

    return result.records.map(record => ({
      product1: record.get("product1"),
      product2: record.get("product2"),
      times: Number(record.get("times"))
    }));

  } finally {
    await session.close();
  }
}