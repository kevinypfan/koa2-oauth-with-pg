import "./utils/config";
import { postgresDB } from "./databases/postgres-db";
import app from "./app";
import { qaRouter } from "./routes/qa-routes";
import { userRouter } from "./routes/user-routes";
import { testRouter } from "./routes/test-routes";
import { authRouter } from "./routes/auth-routes";
import { tokenRouter } from "./routes/token-routes";
import * as views from "koa-views";
import * as path from "path";
import * as bodyParser from "koa-bodyparser";
import * as koaStatic from "koa-static";
import * as session from "koa-session-minimal";
import * as PgStore from "koa-pg-session";

const bootstrap = async () => {
  // Initialize the database
  try {
    await postgresDB();
  } catch (err) {
    console.log(err);
  }
  var pgStore = new PgStore(process.env.PG_URI);

  // const CONFIG = {
  //   key: "koa:sess",
  //   maxAge: 86400000,
  //   autoCommit: true /** (boolean) 自動提交 header 資訊 (預設: true) */,
  //   overwrite: true /** (boolean) 可覆蓋若不覆蓋 (看不懂意思) (預設: true) */,
  //   httpOnly: true /** (boolean) 是否開啟 httpOnly，也就是要不要給 JavaScript 讀取  (預設: true) */,
  //   signed: true /** (boolean) 是否附上簽名 (看不懂意思) (預設: true) */,
  //   rolling: false /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (看不懂意思) (預設: is false) */,
  //   renew: true /** (boolean) 是否 session 即將到期時自動更新，也就是瀏覽器重新整理後會自動給予新的 session (建議給 true) (預設: is false)*/
  // };

  app.use(koaStatic(path.join(__dirname, "./public")));

  app.use(
    session({
      store: pgStore,
      key: "koa:sess"
    })
  );
  app.use(bodyParser());

  app.use(
    views(path.join(__dirname, "./views"), {
      extension: "ejs"
    })
  );

  app.use(qaRouter.routes()).use(qaRouter.allowedMethods());

  app.use(testRouter.routes()).use(userRouter.allowedMethods());

  app.use(userRouter.routes()).use(userRouter.allowedMethods());

  app.use(authRouter.routes()).use(authRouter.allowedMethods());
  app.use(tokenRouter.routes()).use(tokenRouter.allowedMethods());

  //Respond with a message to all client requests
  app.use(async ctx => {
    await ctx.render("not-found");
  });
  //Tell the app to listen on port 3000
  await pgStore.setup();
  app.listen(process.env.NODE_PORT, () => {
    console.log("server start on " + process.env.NODE_PORT + " port");
  });
};
bootstrap();
