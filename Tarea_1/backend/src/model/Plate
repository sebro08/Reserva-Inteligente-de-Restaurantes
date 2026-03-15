import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Menu } from "./Menu";
import { OrderItem } from "./OrderItem";

@Entity()
export class Plate {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column("decimal")
  price: number;

  @Column()
  description: string;

  @ManyToOne(() => Menu, menu => menu.plates)
  @JoinColumn({ name: "menu_id" })
  menu: Menu;

  @OneToMany(() => OrderItem, item => item.plate)
  orderItems: OrderItem[];

}