import * as Router from "koa-router";
import controller = require("../controllers");
export const authRouter = new Router();

//Routes for the user entity
authRouter.get("/noauto-login", controller.auth.noautoLogin); //Get all users in the database
authRouter.get("/authorize", controller.auth.authorize); //Get all users in the database
authRouter.get("/authenticate", controller.auth.authenticate); //Get all users in the database
authRouter.post("/authenticate", controller.auth.authenticate); //Get all users in the database
authRouter.get("/authorize/consent", controller.auth.getAuthorizeConsent); //Get all users in the database
authRouter.post("/authorize/consent", controller.auth.postAuthorizeConsent); //Get all users in the database
