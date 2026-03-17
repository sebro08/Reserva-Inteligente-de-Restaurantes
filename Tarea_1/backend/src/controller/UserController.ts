import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { User } from "../model/User";

const userRepository = AppDataSource.getRepository(User);

export class UserController {
  
  // Obtener detalles del usuario autenticado (Placeholder, requiere lógica de token)
  static async getMe(req: Request, res: Response) {
    try {
      // Asumiremos que el ID viene del token validado en req.user
      const userId = (req as any).user?.id || 1; // Placeholder para pruebas
      const user = await userRepository.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener el usuario" });
    }
  }

  // Actualizar información de un usuario
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dataToUpdate = req.body;
      
      const user = await userRepository.findOneBy({ id: parseInt(id) });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      userRepository.merge(user, dataToUpdate);
      const results = await userRepository.save(user);

      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar el usuario" });
    }
  }

  // Eliminar un usuario
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const results = await userRepository.delete(parseInt(id));
      
      if (results.affected === 0) {
         return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({ message: "Usuario eliminado con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar el usuario" });
    }
  }
}
