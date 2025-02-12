import {Router} from "express"
import * as CS from "./comment.service.js";
import * as CV from "./comment.validation.js";
import { authentication,extensionType,multerHost,validation } from "../../middleWare/index.js";
const commentRouter = Router({mergeParams:true});
commentRouter.post("/",multerHost(extensionType.image).array("attachments",5),validation(CV.createCommentSchema),authentication(),CS.createComment)
commentRouter.patch("/update/:commentId",multerHost(extensionType.image).array("attachments",5),validation(CV.updateCommentSchema),authentication(),CS.updateComment)

export default commentRouter;
