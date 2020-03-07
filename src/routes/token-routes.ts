import * as Router from "koa-router";
import controller = require("../controllers");
export const tokenRouter = new Router();

tokenRouter.post("/token", controller.token.postToken);
tokenRouter.get("/verify", controller.token.getVerifyToken);
