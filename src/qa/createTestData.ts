import { BaseContext } from "koa";
import { getConnection } from "typeorm";
import * as bcrypt from "bcryptjs";

import { generateRandomToken } from "../utils/token-util";
import { User } from "../models/user";
import { Client } from "../models/client";
//Creating a class so we can later extend it to include creation of more test data
export class TestData {
  //This handles creating test users. Seperate functions can be added for other test data later.
  public static async createTestUser(ctx: BaseContext) {
    try {
      const salt: string = bcrypt.genSaltSync(10);
      const hashedPassword: string = bcrypt.hashSync("pass123", salt);
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            username: "Michael",
            email: "michael@osullivan.com",
            password: hashedPassword
          }
        ])
        .execute();
      //Return a success message if theer are no errors
      ctx.body = "Test user created successfully";

      //Catch any errors and return a 500 error status to the user is there are errors
    } catch (err) {
      // will only respond with JSON
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {
        message: err.message
      };
    }
  }
  public static async createTestClient(ctx: BaseContext) {
    try {
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Client)
        .values([
          {
            client_secret: await generateRandomToken(),
            scope: "profile",
            redirect_uris: "http://localhost:3000",
            grants: "authorization_code"
          }
        ])
        .execute();
      //Return a success message if theer are no errors
      ctx.body = "Test client created successfully";

      //Catch any errors and return a 500 error status to the user is there are errors
    } catch (err) {
      // will only respond with JSON
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {
        message: err.message
      };
    }
  }
}
