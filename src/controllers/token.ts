import { BaseContext, Context } from "koa";
import { RouterContext } from "koa-router";
import { CodeModel } from "../validations/code-model";
import { PasswordModel } from "../validations/password-model";
import { TokenModel } from "../validations/token-model";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { URL } from "url";
import * as bcrypt from "bcryptjs";

import { Client } from "../models/client";
import { Code } from "../models/code";
import { User } from "../models/user";

import { genToken } from "../utils/access-token-util";

export default class TokenController {
  public static async postToken(ctx: Context & RouterContext) {
    try {
      const tokenModel: TokenModel = new TokenModel();
      tokenModel.client_id = ctx.request.body.client_id;
      tokenModel.grant_type = ctx.request.body.grant_type;
      tokenModel.client_secret = ctx.request.body.client_secret;

      const tokenErrors = await validate(tokenModel);
      if (tokenErrors.length > 0) {
        throw tokenErrors;
      }

      const clientRepository: Repository<Client> = getManager().getRepository(
        Client
      );
      const client: Client = await clientRepository.findOne({
        client_id: tokenModel.client_id,
        client_secret: tokenModel.client_secret
      });

      if (!client) {
        throw "client_id or client_secret has wrong!";
      }

      switch (tokenModel.grant_type) {
        case "authorization_code":
          const codeModel = new CodeModel();
          codeModel.code = ctx.request.body.code;
          codeModel.redirect_uri = ctx.request.body.redirect_uri;

          const codeErrors = await validate(codeModel);
          if (codeErrors.length > 0) {
            throw codeErrors;
          }
          if (!client.grants.includes("authorization_code")) {
            throw "The client no accept authorization_code grant_type!";
          }
          const clientRedirectUris = client.redirect_uris.split(",");

          let redirectUri = new URL(codeModel.redirect_uri);
          let parseUrl = redirectUri.origin + redirectUri.pathname;

          if (!clientRedirectUris.includes(parseUrl)) {
            throw "redirect_uri has wrong";
          }
          const codeRepository: Repository<Code> = getManager().getRepository(
            Code
          );
          const code: Code = await codeRepository.findOne({
            client_id: tokenModel.client_id,
            authorization_code: codeModel.code
          });

          if (!code) {
            throw "code has wrong!";
          }

          if (code.revoked) {
            throw "The authorization_code has been used!";
          }

          if (new Date() > new Date(code.expires_in)) {
            throw "The authorization_code was expired!";
          }
          if (parseUrl !== code.redirect_uri) {
            throw "redirect_uri has wrong!";
          }
          const newAuthorizationCodeTokenObj: Object = await genToken(
            code.client_id,
            code.user_id
          );

          const responseAuthorizationCodeToken = {
            ...newAuthorizationCodeTokenObj,
            token_type: "Bearer"
          };
          responseAuthorizationCodeToken["expires_in"] = new Date(
            responseAuthorizationCodeToken["expires_in"]
          ).valueOf();
          delete responseAuthorizationCodeToken["id"];
          delete responseAuthorizationCodeToken["revoked"];
          delete responseAuthorizationCodeToken["created_at"];
          delete responseAuthorizationCodeToken["updated_at"];

          await codeRepository.update(code.id, {
            revoked: true
          });
          return (ctx.body = responseAuthorizationCodeToken);
        case "password":
          if (!client.grants.includes("password")) {
            throw "The client no accept password grant_type!";
          }
          const passwordModel = new PasswordModel();

          passwordModel.email = ctx.request.body.email;
          passwordModel.password = ctx.request.body.password;

          const passwordErrors = await validate(passwordModel);
          if (passwordErrors.length > 0) {
            throw passwordErrors;
          }

          const userRepository: Repository<User> = getManager().getRepository(
            User
          );
          // load user by id
          const user: User = await userRepository.findOne({
            email: passwordModel.email
          });

          if (!user) {
            // return a BAD REQUEST status code and error message
            throw "email or password has wrong!";
          }
          const comparedPass: boolean = bcrypt.compareSync(
            passwordModel.password,
            user.password
          );

          if (!comparedPass) {
            throw "email or password has wrong!";
          }
          const newPasswordTokenObj: Object = await genToken(
            tokenModel.client_id,
            user.user_id
          );

          const responsePasswordToken = {
            ...newPasswordTokenObj,
            token_type: "Bearer"
          };
          responsePasswordToken["expires_in"] = new Date(
            responsePasswordToken["expires_in"]
          ).valueOf();
          delete responsePasswordToken["id"];
          delete responsePasswordToken["revoked"];
          delete responsePasswordToken["created_at"];
          delete responsePasswordToken["updated_at"];

          return (ctx.body = responsePasswordToken);

        default:
          throw "grant_type has wrong";
      }
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error_code: 400,
        error_name: "Bad Request!",
        error_message: error
      };
    }
  }
}
