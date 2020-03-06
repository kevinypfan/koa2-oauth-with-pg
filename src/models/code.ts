import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { IsDefined } from "class-validator";
@Entity("codes")
export class Code {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;
  @Column("text")
  @IsDefined()
  client_id: string;

  @Column("text")
  @IsDefined()
  user_id: string;

  @Column("text")
  @IsDefined()
  authorization_code: string;

  @Column("timestamp")
  @IsDefined()
  expires_in: Date;

  @Column("text")
  @IsDefined()
  redirect_uri: string;

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
