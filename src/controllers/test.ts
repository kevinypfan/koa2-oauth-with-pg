import { BaseContext, Context } from "koa";
import { RouterContext } from "koa-router";

import { generateRandomToken } from "../utils/token-util";

export default class TestController {
  public static async testGenToken(ctx: BaseContext) {
    const token = await generateRandomToken();
    console.log(typeof token);
    ctx.status = 200;
    ctx.body = token;
  }

  public static async testEjsHello(ctx: Context & RouterContext) {
    await ctx.render("hello", {
      user: ctx.params.user
    });
  }

  public static async testEjsAuth(ctx: Context & RouterContext) {
    // https://access.line.me/oauth2/v2.1/noauto-login?__csrf=XgvdqQ2QgQez9Rmgl16oMz&idProvider=2&errorMessage=ACCOUNT_LOGIN_FAIL&errorCode=445&state=&lang=zh_TW&loginChannelId=1605736550&returnUri=%2Foauth2%2Fv2.1%2Fauthorize%2Fconsent%3Fscope%3Dopenid%2Bprofile%26response_type%3Dcode%26state%3Dinit%26redirect_uri%3Dhttps%253A%252F%252Fwww.learningcity.mlc.edu.tw%252Fapi%252Fauth%26client_id%3D1605736550#/
    console.log(ctx.request.querystring);

    await ctx.render("auth");
  }
  public static async testToken(ctx: Context & RouterContext) {
    // https://access.line.me/oauth2/v2.1/noauto-login?__csrf=XgvdqQ2QgQez9Rmgl16oMz&idProvider=2&errorMessage=ACCOUNT_LOGIN_FAIL&errorCode=445&state=&lang=zh_TW&loginChannelId=1605736550&returnUri=%2Foauth2%2Fv2.1%2Fauthorize%2Fconsent%3Fscope%3Dopenid%2Bprofile%26response_type%3Dcode%26state%3Dinit%26redirect_uri%3Dhttps%253A%252F%252Fwww.learningcity.mlc.edu.tw%252Fapi%252Fauth%26client_id%3D1605736550#/
    const token = await generateRandomToken();
    console.log("here");
    ctx.body = token;
  }
}
