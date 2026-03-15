import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Role } from "./Role";
import { Restaurant } from "./Restaurant";
import { Reservation } from "./Reservation";
import { Order } from "./Order";

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  keycloak_id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  is_active: boolean;

  @Column({ type: "timestamp" })
  created_at: Date;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @OneToMany(() => Restaurant, restaurant => restaurant.admin)
  restaurants: Restaurant[];

  @OneToMany(() => Reservation, reservation => reservation.user)
  reservations: Reservation[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  getFullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }

}