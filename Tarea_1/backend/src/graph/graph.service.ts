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

    return result.records.map((record) => ({
      product1: record.get("product1"),
      product2: record.get("product2"),
      times: Number(record.get("times"))
    }));

  } finally {
    await session.close();
  }
}

export async function getRecommendingUsers() {
  const session = getSession();

  try {
    const result = await session.run(`
      MATCH (u1:User)-[r:RECOMMENDS]->(u2:User)
      RETURN
        u1.id AS userId,
        u1.firstName AS userName,
        u2.id AS recommendedId,
        u2.firstName AS recommendedName,
        r.weight AS weight
      ORDER BY weight DESC
      LIMIT 20
    `);

    return result.records.map((record) => ({
      userId: Number(record.get("userId")),
      userName: record.get("userName"),
      recommendedId: Number(record.get("recommendedId")),
      recommendedName: record.get("recommendedName"),
      weight: Number(record.get("weight"))
    }));

  } finally {
    await session.close();
  }
}

export async function getShortestPath(fromId: number, toId: number) {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (start:Location {id: $fromId}), (end:Location {id: $toId})
      MATCH path = shortestPath((start)-[:DISTANCE*]-(end))
      RETURN
        [node IN nodes(path) | node.name] AS locations,
        [rel IN relationships(path) | rel.km] AS distancesKm,
        [rel IN relationships(path) | rel.minutes] AS durationsMin,
        reduce(totalKm = 0.0, rel IN relationships(path) | totalKm + rel.km) AS totalKm,
        reduce(totalMin = 0, rel IN relationships(path) | totalMin + rel.minutes) AS totalMinutes
      `,
      { fromId, toId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];

    return {
      locations: record.get("locations"),
      distancesKm: record.get("distancesKm"),
      durationsMin: record.get("durationsMin"),
      totalKm: Number(record.get("totalKm")),
      totalMinutes: Number(record.get("totalMinutes"))
    };

  } finally {
    await session.close();
  }
}