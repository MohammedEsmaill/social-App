import cors from "cors"
import checkConnection from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import postRouter from "./modules/posts/post.controller.js";
import commentRouter from "./modules/comments/comment.controller.js";
import { globalErrorHandling } from "./utlities/errorHandling.js";
import { rateLimit } from 'express-rate-limit'
import path from "path";
const limiter = rateLimit({
    limit: 6,
    windowMs: 2 * 60 * 1000,
    handler: (req, res, next) => {
        return next(new Error("Too many requests, please try again after 2 minutes",{cause:429}))
    }
})
const bootstrap = (app,express)=>{
    app.use(cors())
    app.use(limiter)
    app.use("/uploads",express.static(path.resolve("src/uploads")));
    app.use(express.json());
    checkConnection()
    app.get("/",(req,res,next)=>{
        return res.status(200).json({msg:"hello on my social app"})
    })
    app.use("/users",userRouter)
    app.use("/posts",postRouter)
    app.use("/comments",commentRouter)
    app.use("*",(req,res,next)=>{
        return next(new Error(`error invalid url / ${req.originalUrl}`,{cause:404}))
    })
    app.use(globalErrorHandling)
}
export default bootstrap;