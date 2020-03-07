import { BaseContext, Context } from "koa";
import { RouterContext } from "koa-router";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";

import { User } from "../models/user";
import { Token } from "../models/token";
import { ProfileModel } from "../validations/profile-model";

import * as bcrypt from "bcryptjs";

export default class UserController {
  public static async getProfile(ctx: Context & RouterContext) {
    try {
      const profileModel: ProfileModel = new ProfileModel();
      profileModel.Authorization = ctx.get("Authorization");
      const profileErrors = await validate(profileModel);
      if (profileErrors.length > 0) {
        throw profileErrors;
      }

      const tokenParsed = profileModel.Authorization.split(" ");
      if (tokenParsed.length < 2 || tokenParsed[0] !== "Bearer") {
        throw "token type was wrong!";
      }

      if (!tokenParsed[1] || tokenParsed[1].length < 1) {
        throw "Authorization is required!";
      }

      const tokenRepository: Repository<Token> = getManager().getRepository(
        Token
      );
      const token = await tokenRepository.findOne({
        access_token: tokenParsed[1]
      });

      if (!token) {
        throw "Not found access token!";
      }

      if (!token.scope.includes("profile")) {
        throw "403 Forbidden!";
      }
      if (new Date() > new Date(token.expires_in)) {
        throw "access token expired!";
      }
      //   token.user_id
      const userRepository: Repository<User> = getManager().getRepository(User);
      const user = await userRepository.findOne(token.user_id);

      ctx.body = {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: "invalid_request",
        error_description: error
      };
    }
  }
  //   public static async getUsers(ctx: BaseContext) {
  //     // get a user repository to perform operations with user
  //     const userRepository: Repository<User> = getManager().getRepository(User);
  //     // load all users
  //     const users: User[] = await userRepository.find();
  //     // return OK status code and loaded users array
  //     ctx.status = 200;
  //     ctx.body = users;
  //   }
  //   public static async getUser(ctx: Context & RouterContext) {
  //     // get a user repository to perform operations with user
  //     const userRepository: Repository<User> = getManager().getRepository(User);
  //     // load user by id
  //     const user: User = await userRepository.findOne(ctx.params.id);
  //     if (user) {
  //       // return OK status code and loaded user object
  //       ctx.status = 200;
  //       ctx.body = user;
  //     } else {
  //       // return a BAD REQUEST status code and error message
  //       ctx.status = 400;
  //       ctx.body = "The user you are trying to retrieve doesn't exist in the db";
  //     }
  //   }
  public static async createUser(ctx: Context & RouterContext) {
    try {
      // get a user repository to perform operations with user
      const userRepository: Repository<User> = getManager().getRepository(User);

      // build up entity user to be saved
      const userToBeSaved: User = new User();

      const salt: string = bcrypt.genSaltSync(10);
      const hashedPassword: string = bcrypt.hashSync(
        ctx.request.body.password,
        salt
      );

      userToBeSaved.username = ctx.request.body.username;
      userToBeSaved.email = ctx.request.body.email;
      userToBeSaved.password = hashedPassword;
      //validate(ctx.request.body.username);
      // validate user entity
      const errors: ValidationError[] = await validate(userToBeSaved, {
        skipMissingProperties: true
      }); // errors is an array of validation errors
      if (errors.length > 0) {
        // return BAD REQUEST status code and errors array
        ctx.status = 400;
        ctx.body = errors;
      } else if (await userRepository.findOne({ email: userToBeSaved.email })) {
        // return BAD REQUEST status code and email already exists error
        ctx.status = 400;
        ctx.body = "The specified e-mail address already exists";
      } else {
        // save the user contained in the POST body
        const user = await userRepository.save(userToBeSaved);
        // return CREATED status code and updated user
        ctx.status = 201;
        ctx.body = user;
      }
    } catch (error) {
      console.log(error);
      ctx.status = 500;
      ctx.body = "Server Interval Error";
    }
  }
  //   public static async updateUser(ctx: BaseContext) {
  //     // get a user repository to perform operations with user
  //     const userRepository: Repository<User> = getManager().getRepository(User);
  //     // load the user by id
  //     const userToBeUpdated: User = await userRepository.findOne(ctx.params.id);
  //     // return a BAD REQUEST status code and error message if the user cannot be found
  //     if (!userToBeUpdated) {
  //       ctx.status = 400;
  //       ctx.body = "The user you are trying to retrieve doesn't exist in the db";
  //     }
  //     if (ctx.request.body.username) {
  //       userToBeUpdated.username = ctx.request.body.username;
  //     }
  //     if (ctx.request.body.email) {
  //       userToBeUpdated.email = ctx.request.body.email;
  //     }
  //     if (ctx.request.body.password) {
  //       userToBeUpdated.password = ctx.request.body.password;
  //     }
  //     // validate user entity
  //     const errors: ValidationError[] = await validate(userToBeUpdated); // errors is an array of validation errors
  //     if (errors.length > 0) {
  //       // return BAD REQUEST status code and errors array
  //       ctx.status = 400;
  //       ctx.body = errors;
  //     } else if (!(await userRepository.findOne(userToBeUpdated.id))) {
  //       // check if a user with the specified id exists
  //       // return a BAD REQUEST status code and error message
  //       ctx.status = 400;
  //       ctx.body = "The user you are trying to update doesn't exist in the db";
  //     } else if (
  //       await userRepository.findOne({
  //         id: Not(Equal(userToBeUpdated.id)),
  //         email: userToBeUpdated.email
  //       })
  //     ) {
  //       // return BAD REQUEST status code and email already exists error
  //       ctx.status = 400;
  //       ctx.body = "The specified e-mail address already exists";
  //     } else {
  //       // save the user contained in the PUT body
  //       const user = await userRepository.save(userToBeUpdated);
  //       // return CREATED status code and updated user
  //       ctx.status = 201;
  //       ctx.body = user;
  //     }
  //   }
  //   public static async deleteUser(ctx: BaseContext) {
  //     // get a user repository to perform operations with user
  //     const userRepository: Repository<User> = getManager().getRepository(User);
  //     // load the user by id
  //     const userToRemove: User = await userRepository.findOne(ctx.params.id);
  //     if (!userToRemove) {
  //       // return a BAD REQUEST status code and error message
  //       ctx.status = 400;
  //       ctx.body = "The user you are trying to delete doesn't exist in the db";
  //     } else {
  //       // the user is there so can be removed
  //       await userRepository.remove(userToRemove);
  //       // return a NO CONTENT status code
  //       ctx.status = 204;
  //     }
  //   }
}
