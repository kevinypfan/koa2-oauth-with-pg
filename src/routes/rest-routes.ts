import * as Router from "koa-router";
import controller = require("../controllers");
export const restRouter = new Router();

//Routes for the user entity
restRouter.get("/users", controller.user.getUsers); //Get all users in the database
restRouter.get("/users/:id", controller.user.getUser); //Get a single user by id
restRouter.post("/signup", controller.user.createUser); //Create a single user in the database
