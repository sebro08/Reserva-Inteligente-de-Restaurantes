import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { Restaurant } from "./Restaurant";
import { Location } from "./Location";
import { Status } from "./Status";
import { OrderItem } from "./OrderItem";

@Entity()
export class Order {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pickup: boolean;

  @Column({ type: "timestamp" })
  created_at: Date;

  @ManyToOne(() => Location, location => location.orders, { nullable: true })
  @JoinColumn({ name: "location_id" })
  location: Location;

  @ManyToOne(() => Status)
  @JoinColumn({ name: "status_id" })
  status: Status;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Restaurant, restaurant => restaurant.orders)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;

  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];

}