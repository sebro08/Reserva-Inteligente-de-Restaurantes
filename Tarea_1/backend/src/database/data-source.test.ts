import { DataSource } from "typeorm";
import { User } from "../model/User";
import { Role } from "../model/Role";
import { Restaurant } from "../model/Restaurant";
import { Menu } from "../model/Menu";
import { Order } from "../model/Order";
import { OrderItem } from "../model/OrderItem";
import { Reservation } from "../model/Reservation";
import { Location } from "../model/Location";
import { Plate } from "../model/Plate";
import { RestaurantTable } from "../model/RestaurantTable";
import { Canton } from "../model/Canton";
import { Country } from "../model/Country";
import { District } from "../model/District";
import { Province } from "../model/Province";
import { Status } from "../model/Status";

export const TestDataSource = new DataSource({
  type: "better-sqlite3",
  database: ":memory:",
  synchronize: true,
  dropSchema: false,
  logging: false,
  entities: [
    User, Role, Restaurant, Menu, Order, OrderItem,
    Reservation, Location, Plate, RestaurantTable,
    Canton, Country, District, Province, Status
  ],
});