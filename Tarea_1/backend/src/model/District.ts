import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Canton } from "./Canton";
import { Location } from "./Location";

@Entity()
export class District {

  @PrimaryGeneratedColumn()
  code: number;

  @ManyToOne(() => Canton, canton => canton.districts)
  @JoinColumn({ name: "canton_id" })
  canton: Canton;

  @Column()
  name: string;

  @OneToMany(() => Location, location => location.district)
  locations: Location[];

}