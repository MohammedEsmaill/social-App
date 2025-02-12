import {Router} from "express"
import * as PS from "./post.service.js";
import * as PV from "./post.validation.js";
import { authentication,extensionType,multerHost,validation } from "../../middleWare/index.js";
import commentRouter from "../comments/comment.controller.js";
const postRouter = Router();
postRouter.use("/:refId/comments",commentRouter)
postRouter.post("/",multerHost(extensionType.image).array("attachments",5),validation(PV.createPostSchema),authentication(),PS.createPost)
postRouter.patch("/update/:postId",multerHost(extensionType.image).array("attachments",5),validation(PV.updatePostSchema),authentication(),PS.updatePost)
postRouter.delete("/freeze/:postId",validation(PV.generalSchema),authentication(),PS.freezePost)
postRouter.patch("/unFreeze/:postId",validation(PV.generalSchema),authentication(),PS.unFreezePost)
postRouter.patch("/react/:postId",validation(PV.generalSchema),authentication(),PS.likePost)
postRouter.get("/getPosts",PS.getPosts)
postRouter.patch("/undo/:postId",validation(PV.generalSchema),authentication(),PS.undoPost)
postRouter.patch("/archive/:postId",validation(PV.generalSchema),authentication(),PS.archivePost)
postRouter.get("/userFriends/:postId",validation(PV.generalSchema),authentication(),PS.getPostsByUserFriends)
postRouter.get("/SpecificPost/:postId",validation(PV.generalSchema),authentication(),PS.getPostsBySpecificFriends)
postRouter.delete("/delete/:postId",validation(PV.generalSchema),authentication(),PS.deletePostWithComments)
export default postRouter;
