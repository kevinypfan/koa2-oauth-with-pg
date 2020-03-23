import * as Router from "koa-router";
import createTestData = require("../qa/createTestData");
export const qaRouter = new Router();
qaRouter.prefix(process.env.PREFIX_PATH);
//Routes for the user entity
qaRouter.post("/qa/user", createTestData.TestData.createTestUser);
qaRouter.post("/qa/client", createTestData.TestData.createTestClient);
