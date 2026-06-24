import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { District } from "./District";
import { Restaurant } from "./Restaurant";
import { Order } from "./Order";

@Entity()
export class Location {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Coordenadas geograficas (geonodo) usadas para calcular distancias reales
  // y simular rutas de entrega en Neo4j. Nullable para no romper filas antiguas.
  @Column({ type: "double precision", nullable: true })
  latitude: number;

  @Column({ type: "double precision", nullable: true })
  longitude: number;

  @ManyToOne(() => District, district => district.locations)
  @JoinColumn({ name: "district_id" })
  district: District;

  @OneToMany(() => Restaurant, restaurant => restaurant.location)
  restaurants: Restaurant[];

  @OneToMany(() => Order, order => order.location)
  orders: Order[];

}