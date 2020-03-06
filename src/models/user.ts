//import type definitions from typeorm that describe the physical
//charachteristics of fields that we will store in the database
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
//Import functions from the class-valadiator package that we will
//use to validate data when someone is creating or editing a user
import { Length, IsEmail, IsDefined } from "class-validator";
//This decorator (denoted by the @ symbol) tells type-orm that
//we want to call the database table users
@Entity("users")
//Export the User class so we can use it elsewhere in our project
export class User {
  @PrimaryGeneratedColumn("uuid") //Tell Postgre to generate a Unique Key for this column
  user_id: string; //Name of the column is id and type is string

  @Column("text")
  @IsDefined()
  username: string;

  @Column({
    type: "text",
    unique: true
  })
  @IsDefined()
  @Length(5, 100)
  @IsEmail()
  email: string;

  @Column("text")
  @IsDefined()
  password: string;

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
