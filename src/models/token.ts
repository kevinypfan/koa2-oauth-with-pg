import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { IsDefined } from "class-validator";
@Entity("tokens")
export class Token {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;
  @Column("text")
  @IsDefined()
  client_id: string;

  @Column("text")
  @IsDefined()
  user_id: string;

  @Column("text")
  access_token: string;

  @Column("timestamp")
  expires_in: Date;

  @Column("text")
  refresh_token: string;

  @Column("text")
  scope: string;

  @Column({
    type: "boolean",
    default: false
  })
  revoked: Boolean;

  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}
