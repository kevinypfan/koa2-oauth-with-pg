import * as Router from "koa-router";
import controller = require("../controllers");
export const userRouter = new Router();
userRouter.prefix(process.env.PREFIX_PATH);
//Routes for the user entity
// userRouter.get("/users", controller.user.getUsers); //Get all users in the database
// userRouter.get("/users/:id", controller.user.getUser); //Get a single user by id
userRouter.post("/signup", controller.user.createUser); //Create a single user in the database
userRouter.post("/profile", controller.user.getProfile); //Create a single user in the database
