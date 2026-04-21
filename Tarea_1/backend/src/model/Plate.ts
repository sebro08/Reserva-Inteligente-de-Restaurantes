import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Menu } from "./Menu";
import { OrderItem } from "./OrderItem";
import { Category } from "./Category";

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

  @ManyToOne(() => Category, category => category.plates)
  @JoinColumn({ name: "category_id" })
  category: Category;
  
  @OneToMany(() => OrderItem, item => item.plate)
  orderItems: OrderItem[];
}