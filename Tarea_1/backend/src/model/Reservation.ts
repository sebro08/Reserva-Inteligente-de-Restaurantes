import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Restaurant } from "./Restaurant";
import { RestaurantTable } from "./RestaurantTable";
import { Status } from "./Status";

@Entity()
export class Reservation {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  reservation_date: Date;

  @Column({ type: "time" })
  reservation_time: string;

  @Column()
  people_count: number;

  @ManyToOne(() => Status)
  @JoinColumn({ name: "status_id" })
  status: Status;

  @ManyToOne(() => User, user => user.reservations)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Restaurant, restaurant => restaurant.reservations)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;

  @ManyToOne(() => RestaurantTable, table => table.reservations)
  @JoinColumn({ name: "restaurant_table_id" })
  table: RestaurantTable;

}