import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";
import { Reservation } from "./Reservation";

@Entity()
export class RestaurantTable {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  capacity: number;

  @ManyToOne(() => Restaurant, restaurant => restaurant.tables)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;

  @OneToMany(() => Reservation, reservation => reservation.table)
  reservations: Reservation[];

}