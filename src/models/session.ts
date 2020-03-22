import {
    Entity,
    PrimaryColumn,
    Column
  } from "typeorm";
  @Entity("session")
  export class Session {
    @PrimaryColumn({type: "text", nullable: false})
    id: string;
    
    @Column({type: "timestamp", nullable: false})
    expiry: Date;

    @Column({type: "json", nullable: true})
    session: String;
  }
  