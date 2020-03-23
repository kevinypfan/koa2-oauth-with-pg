import * as Router from "koa-router";
import controller = require("../controllers");
export const testRouter = new Router();
testRouter.prefix(process.env.PREFIX_PATH);
testRouter.get("/test-gentoken", controller.test.testGenToken); //Get all users in the database
testRouter.get("/test-hello/:user", controller.test.testEjsHello); //Get all users in the database
testRouter.get("/test-auth", controller.test.testEjsAuth); //Get all users in the database
testRouter.get("/test-token", controller.test.testToken); //Get all users in the database
