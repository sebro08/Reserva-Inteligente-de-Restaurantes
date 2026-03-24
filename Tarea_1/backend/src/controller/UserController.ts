import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { User } from "../model/User";

const userRepository = AppDataSource.getRepository(User);

export class UserController {
  
  // Obtener detalles del usuario autenticado a partir del Token de Keycloak
  static async getMe(req: Request, res: Response) {
    try {
      // Keycloak inyecta la información del token validado en req.kauth
      const kauth = (req as any).kauth;
      if (!kauth || !kauth.grant) {
        return res.status(401).json({ message: "No autorizado" });
      }

      // El 'sub' es el ID único del usuario dentro de Keycloak
      const keycloakId = kauth.grant.access_token.content.sub;

      // Buscamos al usuario en nuestra base de datos que coincida con ese Keycloak ID
      const user = await userRepository.findOneBy({ keycloak_id: keycloakId });
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado en la base de datos local" });
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
