import { BaseContext, Context } from "koa";
import { RouterContext } from "koa-router";
import { CodeModel } from "../validations/code-model";
import { PasswordModel } from "../validations/password-model";
import { TokenModel } from "../validations/token-model";
import { RevokeModel } from "../validations/revoke-model";
import { RefreshModel } from "../validations/refresh-model";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { URL } from "url";
import * as bcrypt from "bcryptjs";
import * as moment from "moment";

import { Client } from "../models/client";
import { Code } from "../models/code";
import { User } from "../models/user";
import { Token } from "../models/token";

import { genToken } from "../utils/access-token-util";

export default class TokenController {
  public static async postRevokeToken(ctx: Context & RouterContext) {
    try {
      const revokeModel: RevokeModel = new RevokeModel();
      revokeModel.client_id = ctx.request.body.client_id;
      revokeModel.client_secret = ctx.request.body.client_secret;
      revokeModel.access_token = ctx.request.body.access_token;
      const tokenErrors = await validate(revokeModel);
      if (tokenErrors.length > 0) {
        throw tokenErrors;
      }

      const tokenRepository: Repository<Token> = getManager().getRepository(
        Token
      );
      const token = await tokenRepository.findOne({
        access_token: revokeModel.access_token
      });

      if (!token) {
        throw "Not found access token!";
      }
      if (new Date() > new Date(token.expires_in)) {
        throw "access token expired!";
      }

      await tokenRepository.update(token.id, {
        revoked: true
      });

      ctx.body = {
        status_code: 200,
        message: "Request successful"
      };
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: "invalid_request",
        error_description: error
      };
    }
  }

  public static async getVerifyToken(ctx: Context & RouterContext) {
    try {
      const tokenRepository: Repository<Token> = getManager().getRepository(
        Token
      );
      const token = await tokenRepository.findOne({
        access_token: ctx.request.query.access_token
      });

      if (!token) {
        throw "Not found access token!";
      }
      if (new Date() > new Date(token.expires_in)) {
        throw "access token expired!";
      }

      const responseAccessToken = { ...token, token_type: "Bearer" };

      delete responseAccessToken["id"];
      delete responseAccessToken["revoked"];
      delete responseAccessToken["created_at"];
      delete responseAccessToken["updated_at"];

      ctx.body = responseAccessToken;
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: "invalid_request",
        error_description: error
      };
    }
  }
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
            code.user_id,
            client.scope
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
            user.user_id,
            client.scope
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

        case "refresh_token":
          const refreshModel: RefreshModel = new RefreshModel();
          refreshModel.refresh_token = ctx.request.body.refresh_token;
          const refreshErrors = await validate(refreshModel);
          if (refreshErrors.length > 0) {
            throw refreshErrors;
          }
          const tokenRepository: Repository<Token> = getManager().getRepository(
            Token
          );
          const oldToken = await tokenRepository.findOne({
            refresh_token: refreshModel.refresh_token
          });

          if (!oldToken) {
            throw "Not found refresh token!";
          }

          if (oldToken.revoked) {
            throw "refresh token has been used!";
          }

          if (
            new Date() >
            moment(new Date(oldToken.expires_in))
              .add(10, "days")
              .toDate()
          ) {
            throw "refresh token expired!";
          }
          await tokenRepository.update(oldToken.id, {
            revoked: true
          });

          const newRefreshModelObj: Object = await genToken(
            client.client_id,
            oldToken.user_id,
            client.scope
          );

          const responseRefreshModel = {
            ...newRefreshModelObj,
            token_type: "Bearer"
          };
          responseRefreshModel["expires_in"] = new Date(
            responseRefreshModel["expires_in"]
          ).valueOf();
          delete responseRefreshModel["id"];
          delete responseRefreshModel["revoked"];
          delete responseRefreshModel["created_at"];
          delete responseRefreshModel["updated_at"];

          return (ctx.body = responseRefreshModel);

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
