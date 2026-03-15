import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Restaurant } from "./Restaurant";
import { Plate } from "./Plate";

@Entity()
export class Menu {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Restaurant, restaurant => restaurant.menus)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;

  @OneToMany(() => Plate, plate => plate.menu)
  plates: Plate[];

}