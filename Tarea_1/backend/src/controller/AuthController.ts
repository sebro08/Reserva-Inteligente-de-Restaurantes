import { Request, Response } from "express";
import { User } from "../model/User";
import { RepositoryFactory } from "../repository/RepositoryFactory";
import axios from "axios";

const userRepository = RepositoryFactory.getUserRepository();
const roleRepository = RepositoryFactory.getRoleRepository();

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080";
const REALM = "restaurante-realm";
const CLIENT_ID = "restaurante-api";

export class AuthController {

  // Función de apoyo para conseguir token de administración de Keycloak
  private static async getAdminToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("client_id", "admin-cli");
    // Usar variables de entorno de KeycloakAdmin, con default por si acaso
    params.append("username", process.env.KEYCLOAK_ADMIN_USER || "admin");
    params.append("password", process.env.KEYCLOAK_ADMIN_PASSWORD || "admin");

    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data.access_token;
  }

  // POST /auth/register - Registro de un nuevo usuario
  static async register(req: Request, res: Response) {
    try {
      const { first_name, last_name, email, password, role_name = "cliente_restaurante" } = req.body;
      
      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: "Faltan campos requeridos (first_name, last_name, email, password)" });
      }

      // 1. Verificar el nombre del rol a nivel de DB y nivel Keycloak
      // En la DB local se llaman "Admin" y "User", y en Keycloak "admin_restaurante" y "cliente_restaurante", entonces hacemos un mapa de traducción
      const dbRoleName = role_name === "admin_restaurante" ? "Admin" : "User";

      // Verificar si el rol existe en PostgreSQL (para que el usuario no lance error al guardar en BD después)
      const role = await roleRepository.findByName(dbRoleName);
      if (!role) {
        return res.status(400).json({ message: `El rol ${dbRoleName} no existe en la base de datos local.` });
      }

      // 2. Obtener Token Admin de Keycloak
      const adminToken = await AuthController.getAdminToken();

      // 3. Crear el usuario en Keycloak
      const keycloakUserUrl = `${KEYCLOAK_URL}/admin/realms/${REALM}/users`;
      const newUserPayload = {
        username: email,
        email: email,
        firstName: first_name,
        lastName: last_name,
        enabled: true,
        emailVerified: true,  // Saltar verificación manual
        credentials: [{
          type: "password",
          value: password,
          temporary: false  // No pedir cambio de clave
        }]
      };

      await axios.post(keycloakUserUrl, newUserPayload, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        }
      });

      // 4. Obtener el keycloak_id que Keycloak le acaba de asignar internamente a este nuevo usuario
      const usersResponse = await axios.get(`${keycloakUserUrl}?username=${email}&exact=true`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const keycloak_id = usersResponse.data[0].id;

      // 5. Asignarle el rol correspondiente dentro de Keycloak
      try {
        const roleResponse = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${role_name}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const roleDef = roleResponse.data;
        await axios.post(`${keycloakUserUrl}/${keycloak_id}/role-mappings/realm`, [roleDef], {
          headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }
        });
      } catch (e) {
        console.error("Advertencia: No se pudo enlazar el rol en Keycloak. Asegúrate de que el rol exista en la consola de Keycloak.", e);
      }

      // 6. Finalmente, guardar el usuario en PostgreSQL
      const user = await userRepository.create({
        first_name: first_name,
        last_name: last_name,
        email: email,
        keycloak_id: keycloak_id, // <-- Guardamos el ID unificado
        is_active: true,
        created_at: new Date(),
        role: role // Enlazamos el objeto Role de TypeORM
      });

      res.status(201).json({ message: "Usuario creado y sincronizado con éxito", user });
    } catch (error: any) {
      if (error.response?.status === 409) {
        return res.status(409).json({ message: "El usuario ya existe (el correo ya está registrado)" });
      }
      console.error("Error en registro:", error.response?.data || error.message);
      res.status(500).json({ message: "Error interno en el registro del usuario" });
    }
  }

  // POST /auth/login - Inicio de sesión y obtención de JWT
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
         return res.status(400).json({ message: "Faltan credenciales" });   
      }

      // Pedir el token directamente a Keycloak
      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("client_id", CLIENT_ID);
      params.append("username", email);
      params.append("password", password);

      const response = await axios.post(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        params,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      // Si todo sale bien, Keycloak nos da el JWT y se lo retornamos al Front-End/Postman
      res.json({ 
        message: "Login exitoso", 
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      });
      
    } catch (error: any) {
      // Usualmente si Keycloak falla es porque la clave es incorrecta -> DA un HTTP 401
      if (error.response && error.response.status === 401) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      console.error("Error al iniciar sesión:", error.response?.data || error.message);
      res.status(500).json({ message: "Error interno al iniciar sesión" });
    }
  }
}
