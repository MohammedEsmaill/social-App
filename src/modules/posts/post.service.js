import {commentModel, postModel,roleTypes, specificityTypes, userModel} from "../../DB/models/index.js";
import cloudinary from "../../utlities/cloudinary/index.js";
import { pagination } from "../../utlities/features/index.js";
import { asyncHandler } from "../../utlities/index.js";
// ------------------- createPost ------------------------
export const createPost = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    const post =await postModel.create({content,userId:req.user._id})
    if (req?.files?.length) {
        const images = []
        for (const file of req.files) {
            const {secure_url,public_id} = await cloudinary.uploader.upload(file.path,{
                folder:`social-App/posts/${post._id}`
            })
            images.push({secure_url,public_id})
        }
        post.attachments = images;
    }
    if (req.body.specificity) {
        post.specificity = req.body.specificity
    }
    if (req.body.specificUsers) {
        post.specificUsers = req.body.specificUsers.split(",")
    }
    await post.save();
    return res.status(201).json({ msg: "post created successfully",post});

})


// ------------------- updatePost ------------------------
export const updatePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    // check if post not exist
    const post = await postModel.findOne({_id:postId,isDeleted:{$exists:false}})
    if(!post){
        return next(new Error("post not found or deleted",{cause:400}))
    }
    // check id user not authorized
    if (post.userId.toString() != req.user._id.toString()) {
        return next(new Error("you are un authorized",{cause:403}))
    }
    // if user upload image destroy old images
    if (req?.files?.length) {
        const images = []
        for (const file of post.attachments) {
            await cloudinary.uploader.destroy(file.public_id)
        }
        for (const file of req.files) {
            const {secure_url,public_id} = await cloudinary.uploader.upload(file.path,{
                folder:`social-App/posts/${post._id}`
            })
            images.push({secure_url,public_id})
        }
        post.attachments = images;
    }
    // update content
    if(req.body.content){
        post.content = req.body.content;
    }
    // save changes
    await post.save()
    return res.status(200).json({ msg: "post updated successfully",});

})


// ------------------- freezePost ------------------------
export const freezePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    // check whi want to delete post
    const condition = req.user.role === roleTypes.admin?{}:{userId:req.user._id}
    // check if post not exist
    const post = await postModel.findOneAndUpdate({_id:postId,...condition,isDeleted:{$exists:false}},{isDeleted:true,deletedBy:req.user._id},{new:true})
    if(!post){
        return next(new Error("post not found or deleted",{cause:400}))
    }
    return res.status(200).json({ msg: "post deleted successfully",post});

})


// ------------------- unFreezePost ------------------------
export const unFreezePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    // check if post not exist
    const post = await postModel.findOneAndUpdate({_id:postId,deletedBy:req.user._id,isDeleted:{$exists:true}},{$unset:{isDeleted:0,deletedBy:0}},{new:true})
    if(!post){
        return next(new Error("post not found or un authorized",{cause:400}))
    }
    return res.status(200).json({ msg: "post deleted successfully",post});

})


// ------------------- likePost ------------------------
export const likePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    // check if post not exist
    const post = await postModel.findOne({_id:postId,isDeleted:{$exists:false},likes:{$in:[req.user._id]}})
    let react;
    if (post) {
        react = await postModel.findOneAndUpdate({_id:postId,isDeleted:{$exists:false}},{$pull:{likes:req.user._id}},{new:true})
    }else {
        react = await postModel.findOneAndUpdate({_id:postId,isDeleted:{$exists:false}},{$addToSet:{likes:req.user._id}},{new:true})
    }
    if (!react) {
        return next(new Error("post not found or deleted",{cause:400}))
    }
    return res.status(200).json({ msg: "done",react});

})


// ------------------- getPosts ------------------------
export const getPosts = asyncHandler(async (req, res, next) => {
    const {myPAge,data} = await pagination({model:postModel,body:{isDeleted:{$exists:false},specificity:specificityTypes.public},page:1,limit:2})
    return res.status(200).json({ msg: "done",page:myPAge,posts:data});
})



// ------------------- undoPost ------------------------
export const undoPost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const post = await postModel.findOne({_id:postId,userId:req.user._id,isDeleted:{$exists:false}})
    // check if post not exist
    if(!post){
        return next(new Error("post not found or un authorized",{cause:400}))
    }
    // ckeck if post created before more than 2 min
    const now = new Date().getTime();
    if ((now - post.createdAt.getTime()) > 120000) {
        return next(new Error("can't undo post", { cause: 400 }))
    }
    await postModel.deleteOne({_id:postId})
    return res.status(200).json({ msg: "done"});
})



// ------------------- archivePost ------------------------
export const archivePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const post = await postModel.findOne({_id:postId,userId:req.user._id,isDeleted:{$exists:false}})
    // check if post not exist
    if(!post){
        return next(new Error("post not found or un authorized",{cause:400}))
    }
    // ckeck if post created before more than 24 hours
    const now = new Date().getTime();
    if ((now - post.createdAt.getTime()) > (24*60*60*1000)) {
        await postModel.updateOne({_id:postId},{isDeleted:true,deletedBy:req.user._id})
        return res.status(200).json({ msg: "done"});
    }
    return next(new Error("can't archive post", { cause: 400 }))
})



// ------------------- getPostsByUserFriends ------------------------
export const getPostsByUserFriends = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const post = await postModel.findOne({_id:postId,isDeleted:{$exists:false}}).select("-specificity -specificUsers")
    if (post.userId.toString() === req.user._id.toString()) {   
        return res.status(200).json({ msg: "done",post});
    }
    const user = await userModel.findOne({_id:post.userId,isDeleted:false}).select("-password -updatedBy")    
    // check if post not exist
    if(!post || !user || !user.friends.includes(req.user._id ) || user.blockedUsers.includes(req.user._id)){
        return next(new Error("post not found or un authorized",{cause:400}))
    }
    return res.status(200).json({ msg: "done",post});
})



// ------------------- getPostsBySpecificFriends ------------------------
export const getPostsBySpecificFriends = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const post = await postModel.findOne({_id:postId,isDeleted:{$exists:false}})
    if (post.userId.toString() === req.user._id.toString()) {   
        return res.status(200).json({ msg: "done",post});
    }   
    // check if post not exist
    if(!post || !post.specificUsers.includes(req.user._id )){
        return next(new Error("post not found or un authorized",{cause:400}))
    }
    const SpecificPost = {
        _id:post._id,
        userId:post.userId,
        content:post.content,
        attachments:post.attachments,
        createdAt:post.createdAt
    }
    return res.status(200).json({ msg: "done",post:SpecificPost});
})



// ------------------- deletePostWithComments ------------------------
export const deletePostWithComments = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const post = await postModel.findOneAndUpdate({_id:postId,isDeleted:{$exists:false},userId:req.user._id},{isDeleted:true,deletedBy:req.user._id},{new:true})
    // check if post not exist
    if(!post){
        return next(new Error("post not found or un authorized",{cause:400}))
    }
    const comments = await commentModel.find({refId:post._id})
    for (const comment of comments) {
        comment.isDeleted = true;
        comment.deletedBy = req.user._id;
        await comment.save()
        await commentModel.updateMany({refId:comment._id,onModel:"comment"},{isDeleted:true,deletedBy:req.user._id})
    }
    return res.status(200).json({ msg: "done"});
})
