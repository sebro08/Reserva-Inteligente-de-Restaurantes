// src/controller/AuthController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { User } from "../model/User";

const userRepository = AppDataSource.getRepository(User);

export class AuthController {
  
  // POST /auth/register - Registro de un nuevo usuario
  static async register(req: Request, res: Response) {
    try {
      const { first_name, last_name, email, keycloak_id } = req.body;
      
      const user = new User();
      user.first_name = first_name;
      user.last_name = last_name;
      user.email = email;
      user.keycloak_id = keycloak_id || "placeholder-keycloak-id";
      user.is_active = true;
      user.created_at = new Date();
      // Omitiendo la logica de role por simplicidad de momento

      await userRepository.save(user);

      res.status(201).json({ message: "Usuario sincronizado con éxito", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error en el registro del usuario" });
    }
  }

  // POST /auth/login - Inicio de sesión y obtención de JWT
  static async login(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      const user = await userRepository.findOneBy({ email });
      if (!user) {
         return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Con Keycloak usualmente el front trae el JWT directo desde el auth server. 
      // Aquí simulamos que se ha autenticado
      res.json({ message: "Login validado según Keycloak (Simulado)", user_role: user.role });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  }
}
