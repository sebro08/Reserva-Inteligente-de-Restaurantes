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
    // apoc.algo.dijkstra busca el camino de MENOR km (peso), no de menos saltos.
    // Como el grafo de distancias es disperso (cada Location solo conecta con sus
    // vecinos mas cercanos), el camino optimo puede atravesar nodos intermedios.
    const result = await session.run(
      `
      MATCH (start:Location {id: $fromId}), (end:Location {id: $toId})
      CALL apoc.algo.dijkstra(start, end, 'DISTANCE', 'km') YIELD path, weight
      RETURN
        [node IN nodes(path) | node.name] AS locations,
        [rel IN relationships(path) | rel.km] AS distancesKm,
        [rel IN relationships(path) | rel.minutes] AS durationsMin,
        weight AS totalKm,
        reduce(totalMin = 0, rel IN relationships(path) | totalMin + rel.minutes) AS totalMinutes
      LIMIT 1
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

interface Stop {
  orderId: number;
  locationId: number;
  locationName: string;
}

interface RouteStop {
  orderId: number;
  locationName: string;
  legKm: number;
  legMinutes: number;
}

interface RouteResult {
  delivererId: number;
  delivererName: string;
  stops: RouteStop[];
  totalKm: number;
  totalMinutes: number;
}

async function nearestNeighborRouteByLocation(
  session: any,
  startLocationId: number,
  stops: Stop[]
): Promise<RouteStop[]> {
  // 1. Agrupar órdenes por ubicación
  const groups = new Map<number, Stop[]>();
  for (const stop of stops) {
    if (!groups.has(stop.locationId)) {
      groups.set(stop.locationId, []);
    }
    groups.get(stop.locationId)!.push(stop);
  }

  const remainingLocations = Array.from(groups.keys());
  const route: RouteStop[] = [];
  let currentLocationId = startLocationId;

  // 2. Vecino más cercano sobre las UBICACIONES únicas
  while (remainingLocations.length > 0) {
    let bestIndex = -1;
    let bestKm = Infinity;
    let bestMinutes = 0;

    for (let i = 0; i < remainingLocations.length; i++) {
      // Costo = camino minimo ponderado (Dijkstra) sobre la red dispersa, no una
      // arista directa: dos ubicaciones pueden no ser vecinas inmediatas.
      const result = await session.run(
        `
        MATCH (a:Location {id: $from}), (b:Location {id: $to})
        CALL apoc.algo.dijkstra(a, b, 'DISTANCE', 'km') YIELD path, weight
        RETURN weight AS km, reduce(t = 0, r IN relationships(path) | t + r.minutes) AS minutes
        LIMIT 1
        `,
        { from: currentLocationId, to: remainingLocations[i] }
      );

      if (result.records.length > 0) {
        const km = Number(result.records[0].get("km"));
        if (km < bestKm) {
          bestKm = km;
          bestMinutes = Number(result.records[0].get("minutes"));
          bestIndex = i;
        }
      }
    }

    if (bestIndex === -1) break;

    const nextLocationId = remainingLocations.splice(bestIndex, 1)[0];
    const ordersAtLocation = groups.get(nextLocationId)!;

    // 3. Todas las órdenes de esa ubicación entran en el mismo "salto"
    ordersAtLocation.forEach((order, idx) => {
      route.push({
        orderId: order.orderId,
        locationName: order.locationName,
        // El costo de viaje solo se cuenta una vez por ubicación (la primera orden del grupo);
        // las siguientes entregas en la misma ubicación no implican desplazamiento adicional.
        legKm: idx === 0 ? bestKm : 0,
        legMinutes: idx === 0 ? bestMinutes : 0
      });
    });

    currentLocationId = nextLocationId;
  }

  return route;
}

export async function assignDeliveryRoutes(restaurantId: number) {
  const session = getSession();

  try {
    const restaurantResult = await session.run(
      `
      MATCH (r:Restaurant {id: $restaurantId})-[:LOCATED_IN]->(l:Location)
      RETURN l.id AS locationId
      `,
      { restaurantId }
    );

    if (restaurantResult.records.length === 0) {
      return null;
    }

    const startLocationId = Number(restaurantResult.records[0].get("locationId"));

    const ordersResult = await session.run(
      `
      MATCH (o:Order)-[:FROM]->(:Restaurant {id: $restaurantId})
      MATCH (o)-[:DELIVERED_TO]->(l:Location)
      RETURN o.id AS orderId, l.id AS locationId, l.name AS locationName
      `,
      { restaurantId }
    );

    const stops: Stop[] = ordersResult.records.map((r) => ({
      orderId: Number(r.get("orderId")),
      locationId: Number(r.get("locationId")),
      locationName: r.get("locationName")
    }));

    if (stops.length === 0) {
      return { restaurantId, routes: [] };
    }

    const deliverersResult = await session.run(`
      MATCH (d:Deliverer)
      RETURN d.id AS id, d.name AS name
      ORDER BY d.id
    `);

    const deliverers = deliverersResult.records.map((r) => ({
      id: Number(r.get("id")),
      name: r.get("name")
    }));

    if (deliverers.length === 0) {
      return { restaurantId, routes: [] };
    }

    const assignments: Stop[][] = deliverers.map(() => []);
    stops.forEach((stop, index) => {
      assignments[index % deliverers.length].push(stop);
    });

    const routes: RouteResult[] = [];

    for (let i = 0; i < deliverers.length; i++) {
      const assignedStops = assignments[i];
      if (assignedStops.length === 0) continue;

      const orderedStops = await nearestNeighborRouteByLocation(
        session,
        startLocationId,
        assignedStops
      );

      const totalKm = orderedStops.reduce((sum, s) => sum + s.legKm, 0);
      const totalMinutes = orderedStops.reduce((sum, s) => sum + s.legMinutes, 0);

      routes.push({
        delivererId: deliverers[i].id,
        delivererName: deliverers[i].name,
        stops: orderedStops,
        totalKm: Number(totalKm.toFixed(2)),
        totalMinutes
      });
    }

    return { restaurantId, routes };

  } finally {
    await session.close();
  }
}