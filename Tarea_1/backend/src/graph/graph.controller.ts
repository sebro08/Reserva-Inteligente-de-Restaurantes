import { Request, Response } from "express";
import * as graphService from "./graph.service";

export async function getTopProducts(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const data = await graphService.getTopProducts();

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {

    console.error("Graph Error:", error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo productos relacionados"
    });

  }
}

export async function getRecommendingUsers(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const data = await graphService.getRecommendingUsers();

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {

    console.error("Graph Error:", error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo usuarios recomendantes"
    });

  }
}

export async function getShortestPath(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const from = Number(req.query.from);
    const to = Number(req.query.to);

    if (!from || !to) {
      res.status(400).json({
        success: false,
        message: "Debe proporcionar los query params 'from' y 'to' (ids de Location)"
      });
      return;
    }

    const data = await graphService.getShortestPath(from, to);

    if (!data) {
      res.status(404).json({
        success: false,
        message: "No se encontró un camino entre esas ubicaciones"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error("Graph Error:", error);

    res.status(500).json({
      success: false,
      message: "Error calculando la ruta más corta"
    });

  }
}

export async function assignDeliveryRoutes(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const restaurantId = Number(req.query.restaurantId);

    if (!restaurantId) {
      res.status(400).json({
        success: false,
        message: "Debe proporcionar el query param 'restaurantId'"
      });
      return;
    }

    const data = await graphService.assignDeliveryRoutes(restaurantId);

    if (!data) {
      res.status(404).json({
        success: false,
        message: "Restaurante no encontrado o sin ubicación asociada"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error("Graph Error:", error);

    res.status(500).json({
      success: false,
      message: "Error asignando rutas de entrega"
    });

  }
}