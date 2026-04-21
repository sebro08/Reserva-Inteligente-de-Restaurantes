import { Request, Response } from "express";
import { ElasticService } from "../services/ElasticService";
import { ProductService } from "../services/ProductService";

export class SearchController {

  static async searchProducts(req: Request, res: Response) {
    try {
      const q = req.query.q as string;
      const data = await ElasticService.search(q);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error en búsqueda" });
    }
  }

  static async searchByCategory(req: Request, res: Response) {
    try {
      const { categoria } = req.params;
      const data = await ElasticService.searchByCategory(categoria);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error en búsqueda por categoría" });
    }
  }

  static async reindex(_req: Request, res: Response) {
    try {
      const data = await ProductService.reindex();
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error en reindexación" });
    }
  }
}