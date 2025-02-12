import {commentModel, postModel,roleTypes} from "../../DB/models/index.js";
import cloudinary from "../../utlities/cloudinary/index.js";
import { asyncHandler } from "../../utlities/index.js";
// ------------------- createComment ------------------------
export const createComment = asyncHandler(async (req, res, next) => {
    const { content,onModel } = req.body;
    const { refId } = req.params;
    if (onModel === "post") {
        const post = await postModel.findOne({_id:refId,isDeleted:{$exists:false}})
        // check if post not exist
        if(!post){
            return next(new Error("invalid post",{cause:400}))
        }
        
    }else {
        const comment = await commentModel.findOne({_id:refId,isDeleted:{$exists:false}})
        // check if comment not exist
        if(!comment){
            return next(new Error("invalid comment",{cause:400}))
        }
    }
    const comment =await commentModel.create({content,userId:req.user._id,refId,onModel})
    if (req?.files?.length) {
        const images = [];
        for (const file of req.files) {
            const {secure_url,public_id} = await cloudinary.uploader.upload(file.path,{
                folder:`social-App/posts/${req.user._id}/comments/${comment._id}`
            })
            images.push({secure_url,public_id})
        }
        comment.attachments = images;
        await comment.save()
    }
    return res.status(201).json({ msg: "comment created successfully",comment});
})


// ------------------- updateComment ------------------------
export const updateComment = asyncHandler(async (req, res, next) => {
    const { postId,commentId } = req.params;
    const comment = await commentModel.findOne({_id:commentId,postId,userId:req.user._id,isDeleted:{$exists:false}}).populate[{
        path:"postId"
    }]
    // check if post not exist
    if(!comment || comment.postId.isDeleted){
        return next(new Error("invalid comment or post not found",{cause:400}))
    }
    // if user upload image destroy old images
    if (req?.files?.length) {
        const images = []
        for (const file of comment.attachments) {
            await cloudinary.uploader.destroy(file.public_id)
        }
        for (const file of req.files) {
            const {secure_url,public_id} = await cloudinary.uploader.upload(file.path,{
                folder:`social-App/posts/${req.user._id}/comments/${comment._id}`
            })
            images.push({secure_url,public_id})
        }
        comment.attachments = images;
    }
    // update content
    if(req.body.content){
        comment.content = req.body.content;
    }
    // save changes
    await comment.save()
    return res.status(200).json({ msg: "comment updated successfully",comment});

})

