import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Location } from "./Location";
import { User } from "./User";
import { RestaurantTable } from "./RestaurantTable";
import { Menu } from "./Menu";
import { Reservation } from "./Reservation";
import { Order } from "./Order";

@Entity()
export class Restaurant {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "timestamp" })
  created_at: Date;

  @ManyToOne(() => Location, location => location.restaurants)
  @JoinColumn({ name: "location_id" })
  location: Location;

  @ManyToOne(() => User, user => user.restaurants)
  @JoinColumn({ name: "admin_id" })
  admin: User;

  @OneToMany(() => RestaurantTable, table => table.restaurant)
  tables: RestaurantTable[];

  @OneToMany(() => Menu, menu => menu.restaurant)
  menus: Menu[];

  @OneToMany(() => Reservation, reservation => reservation.restaurant)
  reservations: Reservation[];

  @OneToMany(() => Order, order => order.restaurant)
  orders: Order[];

}