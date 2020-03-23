/*
This file initializes your PostgreSQL database. You need to supply
the host name, username, password and database name for your database.
*/
import { createConnection } from "typeorm";
import { postgresTables } from "./postgres-tables";

export const postgresDB = async () => {
  return await createConnection({
    type: "postgres",
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_HOST),
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: false,
    entities: postgresTables,
    logging: ["error"],
    synchronize: true
  }).then(connection => {
    console.log("Database connection established");
  });
};
