import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Province } from "./Province";

@Entity()
export class Country {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Province, province => province.country)
  provinces: Province[];

}