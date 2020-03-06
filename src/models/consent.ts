import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { IsDefined, IsBoolean } from "class-validator";
@Entity("consents")
export class Consent {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column("text")
  @IsDefined()
  client_id: string;

  @Column("text")
  @IsDefined()
  user_id: string;

  @Column({
    type: "boolean"
  })
  @IsDefined()
  @IsBoolean()
  allow: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
