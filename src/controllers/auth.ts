/*
https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=1234567890&redirect_uri=https%3A%2F%2Fexample.com%2Fauth&state=12345abcde&scope=openid%20profile&nonce=09876xyz
response_type: code
client_id
redirect_uri
state
scope
-------------
HTTP/1.1 302 Found
Location : https://client.example.org/cb?code=abcd1234&state=0987poi&friendship_status_changed=true
-------------
ERROR
https://example.com/callback?error=access_denied&error_description=The+resource+owner+denied+the+request.&state=0987poi
===============
POST https://api.line.me/oauth2/v2.1/token
grant_type: authorization_code
code
redirect_uri
client_id
client_secret
------------
{
    "access_token": "bNl4YEFPI/hjFWhTqexp4MuEw5YPs...",
    "expires_in": 2592000,
    "id_token": "eyJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "Aa1FdeggRhTnPNNpxr8p",
    "scope": "profile",
    "token_type": "Bearer"
}
=============
verify access_token
'https://api.line.me/oauth2/v2.1/verify?access_token=eyJhbGciOiJIUzI1NiJ9.UnQ_o-GP0VtnwDjbK0C8E_NvK...'
------------
SUCESSES
{
   "scope":"profile",
   "client_id":"1440057261",
   "expires_in":2591659
}
*/

import { BaseContext, Context } from "koa";
import { RouterContext, url } from "koa-router";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import * as bcrypt from "bcryptjs";
import * as moment from "moment";

import { User } from "../models/user";
import { Client } from "../models/client";
import { Consent } from "../models/consent";
import { Code } from "../models/code";

import { generateRandomToken } from "../utils/token-util";
import { AuthorizeModel } from "../validations/authorize-model";
import { AuthenticateModel } from "../validations/authenticate-model";
import { URLSearchParams, URL } from "url";
import { Session } from "inspector";

export default class AuthController {
  public static async noautoLogin(ctx: Context & RouterContext) {
    const authorizeModel = new AuthorizeModel();
    authorizeModel.client_id = ctx.request.query.client_id;
    authorizeModel.redirect_uri = ctx.request.query.redirect_uri;
    authorizeModel.response_type = ctx.request.query.response_type;
    authorizeModel.scope = ctx.request.query.scope;
    authorizeModel.state = ctx.request.query.state;

    const errors = await validate(authorizeModel);
    if (errors.length > 0) {
      return await ctx.render("error_page", {
        errorCode: 400,
        errorName: "Bad Request!",
        errorMessage: errors
      });
    }
    // errorMessage=ACCOUNT_LOGIN_FAIL&errorCode=445
    return await ctx.render("auth", {
      query: authorizeModel,
      error: false
    });
  }
  //   public static async postLoginForm(ctx: Context & RouterContext) {
  //     ctx.session.user = await ctx.render("auth");
  //   }

  public static async authenticate(ctx: Context & RouterContext) {
    const authenticateModel = new AuthenticateModel();
    authenticateModel.response_type = ctx.request.body.response_type;
    authenticateModel.client_id = ctx.request.body.client_id;
    authenticateModel.redirect_uri = ctx.request.body.redirect_uri;
    authenticateModel.state = ctx.request.body.state;
    authenticateModel.scope = ctx.request.body.scope;
    authenticateModel.email = ctx.request.body.email;
    authenticateModel.password = ctx.request.body.password;

    const errors = await validate(authenticateModel);
    if (errors.length > 0) {
      console.log(errors);
      return await ctx.render("error_page", {
        errorCode: 400,
        errorName: "Bad Request!",
        errorMessage: errors
      });
    }

    const userRepository: Repository<User> = getManager().getRepository(User);
    // load user by id
    const user: User = await userRepository.findOne({
      email: authenticateModel.email
    });
    if (!user) {
      // return a BAD REQUEST status code and error message
      return await ctx.render("auth", {
        query: authenticateModel,
        error: true
      });
    }
    const comparedPass: boolean = bcrypt.compareSync(
      authenticateModel.password,
      user.password
    );

    if (!comparedPass) {
      return await ctx.render("auth", {
        query: authenticateModel,
        error: true
      });
    }

    ctx.session.user_id = user.user_id;

    const searchParams = new URLSearchParams();
    searchParams.append("response_type", authenticateModel.response_type);
    searchParams.append("client_id", authenticateModel.client_id);
    searchParams.append("redirect_uri", authenticateModel.redirect_uri);
    searchParams.append("state", authenticateModel.state);
    searchParams.append("scope", authenticateModel.scope);

    return ctx.redirect("/authorize/consent?" + searchParams.toString());
    // /oauth2/v2.1/authorize/consent?scope=openid+profile&response_type=code&state=init&redirect_uri=https%3A%2F%2Fwww.learningcity.mlc.edu.tw%2Fapi%2Fauth&client_id=1605736550
  }

  public static async authorize(ctx: Context & RouterContext) {
    try {
      const authorizeModel = new AuthorizeModel();
      authorizeModel.client_id = ctx.request.query.client_id;
      authorizeModel.redirect_uri = ctx.request.query.redirect_uri;
      authorizeModel.response_type = ctx.request.query.response_type;
      authorizeModel.scope = ctx.request.query.scope;
      authorizeModel.state = ctx.request.query.state;

      const errors = await validate(authorizeModel);
      if (errors.length > 0) {
        return await ctx.render("error_page", {
          errorCode: 400,
          errorName: "Bad Request!",
          errorMessage: errors
        });
      }
      const clientRepository: Repository<Client> = getManager().getRepository(
        Client
      );

      const client: Client = await clientRepository.findOne(
        authorizeModel.client_id
      );

      if (!client) {
        throw "client_id has not found!";
      }

      const clientRedirectUris = client.redirect_uris.split(",");
      const clientRedirectUrisParsered = clientRedirectUris.map(item => {
        let redirectUri = new URL(item);
        return redirectUri.origin + redirectUri.pathname;
      });

      let redirectUri = new URL(authorizeModel.redirect_uri);
      let parseUrl = redirectUri.origin + redirectUri.pathname;

      if (!clientRedirectUrisParsered.includes(parseUrl)) {
        throw "redirect_uri has wrong";
      }

      const clientScopes = client.scope.split(",");
      const requestScopes = authorizeModel.scope.split(",");
      if (!requestScopes.map(el => clientScopes.includes(el)).every(el => el)) {
        throw "scope has not accept value!";
      }
      // TODO: check user sesion and let choose continue or another account

      if (ctx.session.user_id) {
        const userRepository: Repository<User> = getManager().getRepository(
          User
        );
        // load user by id
        const user: User = await userRepository.findOne({
          user_id: ctx.session.user_id
        });
        if (user) {
          // return a BAD REQUEST status code and error message
          const consentRepository: Repository<Consent> = getManager().getRepository(
            Consent
          );
          // // load user by id
          const consent: Consent = await consentRepository.findOne({
            user_id: user.user_id,
            client_id: authorizeModel.client_id
          });
          if (consent) {
            if (consent.allow) {
              // get a user repository to perform operations with user
              const codeRepository: Repository<Code> = getManager().getRepository(
                Code
              );

              // build up entity user to be saved
              const codeToBeSaved: Code = new Code();

              const authorization_code = await generateRandomToken();
              var expires_in = moment(new Date())
                .add(10, "m")
                .toDate();

              codeToBeSaved.client_id = authorizeModel.client_id;
              codeToBeSaved.user_id = ctx.session.user_id;
              codeToBeSaved.authorization_code = authorization_code;
              codeToBeSaved.expires_in = expires_in;
              codeToBeSaved.redirect_uri = authorizeModel.redirect_uri;
              // validate user entity
              const errors: ValidationError[] = await validate(codeToBeSaved); // errors is an array of validation errors
              if (errors.length > 0) {
                // return BAD REQUEST status code and errors array
                ctx.status = 400;
                ctx.body = errors;
              }
              const code = await codeRepository.save(codeToBeSaved);
              const searchParams = new URLSearchParams();
              searchParams.append("code", code.authorization_code);
              searchParams.append("state", authorizeModel.state);
              return ctx.redirect(
                authorizeModel.redirect_uri + "?" + searchParams.toString()
              );
            } else {
              return ctx.redirect(
                "/authorize/consent?" + ctx.request.querystring
              );
            }
          }
        }
      }
      return ctx.redirect("/noauto-login?" + ctx.request.querystring);
    } catch (error) {
      return await ctx.render("error_page", {
        errorCode: 400,
        errorName: "Bad Request!",
        errorMessage: error
      });
    }

    // TODO: check consent exsits
  }

  public static async postAuthorizeConsent(ctx: Context & RouterContext) {
    const authorizeModel = new AuthorizeModel();
    authorizeModel.response_type = ctx.request.body.response_type;
    authorizeModel.client_id = ctx.request.body.client_id;
    authorizeModel.redirect_uri = ctx.request.body.redirect_uri;
    authorizeModel.state = ctx.request.body.state;
    authorizeModel.scope = ctx.request.body.scope;

    const errors = await validate(authorizeModel);
    if (errors.length > 0) {
      console.log("authorizeModel error");
      console.log(errors);
      return await ctx.render("error_page", {
        errorCode: 400,
        errorName: "Bad Request!",
        errorMessage: errors
      });
    }
    console.log(`allow => ${ctx.request.body.allow === true}`);

    if (ctx.request.body.allow) {
      const consentRepository: Repository<Consent> = getManager().getRepository(
        Consent
      );
      const consentToBeUpdated = await consentRepository.findOne({
        user_id: ctx.session.user_id,
        client_id: authorizeModel.client_id
      });

      if (consentToBeUpdated) {
        consentToBeUpdated.allow = true;
        const errors: ValidationError[] = await validate(consentToBeUpdated); // errors is an array of validation errors
        if (errors.length > 0) {
          console.log("consentToBeUpdated error");
          console.log(errors);
          return await ctx.render("error_page", {
            errorCode: 400,
            errorName: "Bad Request!",
            errorMessage: errors
          });
        } else {
          await consentRepository.save(consentToBeUpdated);
        }
      } else {
        // build up entity user to be saved
        const consentToBeSaved: Consent = new Consent();

        consentToBeSaved.user_id = ctx.session.user_id;
        consentToBeSaved.client_id = authorizeModel.client_id;
        consentToBeSaved.allow = ctx.request.body.allow === "true";
        //validate(ctx.request.body.username);
        // validate user entity
        const errors: ValidationError[] = await validate(consentToBeSaved); // errors is an array of validation errors
        if (errors.length > 0) {
          console.log("consentToBeSaved error");
          console.log(errors);
          return await ctx.render("error_page", {
            errorCode: 400,
            errorName: "Bad Request!",
            errorMessage: errors
          });
        } else {
          await consentRepository.save(consentToBeSaved);
        }
      }
    }
    const searchParams = new URLSearchParams();
    searchParams.append("response_type", authorizeModel.response_type);
    searchParams.append("client_id", authorizeModel.client_id);
    searchParams.append("redirect_uri", authorizeModel.redirect_uri);
    searchParams.append("state", authorizeModel.state);
    searchParams.append("scope", authorizeModel.scope);

    return ctx.redirect("/authorize?" + searchParams.toString());
  }

  public static async getAuthorizeConsent(ctx: Context & RouterContext) {
    const authorizeModel = new AuthorizeModel();
    authorizeModel.client_id = ctx.request.query.client_id;
    authorizeModel.redirect_uri = ctx.request.query.redirect_uri;
    authorizeModel.response_type = ctx.request.query.response_type;
    authorizeModel.scope = ctx.request.query.scope;
    authorizeModel.state = ctx.request.query.state;
    const errors = await validate(authorizeModel);

    if (errors.length > 0 || !ctx.session.user_id) {
      return await ctx.render("error_page", {
        errorCode: 400,
        errorName: "Bad Request!",
        errorMessage: errors || ctx.session
      });
    }
    const consentRepository: Repository<Consent> = getManager().getRepository(
      Consent
    );
    const consent: Consent = await consentRepository.findOne({
      user_id: ctx.session.user_id,
      client_id: authorizeModel.client_id
    });
    if (consent) {
      if (consent.allow) {
        const searchParams = new URLSearchParams();
        searchParams.append("response_type", authorizeModel.response_type);
        searchParams.append("client_id", authorizeModel.client_id);
        searchParams.append("redirect_uri", authorizeModel.redirect_uri);
        searchParams.append("state", authorizeModel.state);
        searchParams.append("scope", authorizeModel.scope);

        return ctx.redirect("/authorize?" + searchParams.toString());
      }
    }

    return await ctx.render("consent", { query: authorizeModel });

    // if (!user) {
    //   // return a BAD REQUEST status code and error message
    //   return await ctx.render("auth", {
    //     query: authenticateModel,
    //     error: true
    //   });
    // }
  }
}
