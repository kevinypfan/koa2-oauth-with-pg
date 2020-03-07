import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { IsDefined } from "class-validator";
@Entity("clients")
export class Client {
  @PrimaryGeneratedColumn("uuid")
  client_id: string;

  @Column("text")
  @IsDefined()
  client_secret: string;

  @Column({
    type: "text",
    default: ""
  })
  redirect_uris: string;

  @Column({
    type: "text",
    default: ""
  })
  grants: string;

  @Column({
    type: "text",
    default: ""
  })
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
