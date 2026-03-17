import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./Order";
import { Plate } from "./Plate";

@Entity()
export class OrderItem {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Plate, plate => plate.orderItems)
  @JoinColumn({ name: "plate_id" })
  plate: Plate;

}