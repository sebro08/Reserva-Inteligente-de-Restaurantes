import { Request, Response } from "express";
import * as graphService from "./graph.service";

export async function getTopProducts(
  req: Request,
  res: Response
) {
  try {
    const data = await graphService.getTopProducts();

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo productos relacionados"
    });

  }
}