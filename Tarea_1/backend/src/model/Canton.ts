import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Province } from "./Province";
import { District } from "./District";

@Entity()
export class Canton {

  @PrimaryGeneratedColumn()
  code: number;

  @Column()
  name: string;

  @ManyToOne(() => Province, province => province.cantons)
  @JoinColumn({ name: "province_id" })
  province: Province;

  @OneToMany(() => District, district => district.canton)
  districts: District[];

}