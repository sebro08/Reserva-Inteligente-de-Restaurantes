import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Plate } from "./Plate";

@Entity()
export class Category {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Plate, plate => plate.category)
  plates: Plate[];
}