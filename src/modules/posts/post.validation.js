import joi from "joi";
import { genralRules } from "../../utlities/genralRules.js";
import { specificityTypes } from "../../DB/models/posts.model.js";
export const createPostSchema = {
    body:joi.object({
        content:joi.string().min(3).required(),
        specificity:joi.string().valid(specificityTypes.public,specificityTypes.friends,specificityTypes.specificFriends),
        specificUsers:joi.string()
    }),
    headers:genralRules.headers.required(),
    files:joi.array().items(genralRules.file)
}

export const updatePostSchema = {
    body:joi.object({
        content:joi.string().min(3)
    }),
    headers:genralRules.headers.required(),
    params:joi.object({
        postId:genralRules.id.required()
    }).required(),
    files:joi.array().items(genralRules.file)
}

export const generalSchema = {
    headers:genralRules.headers.required(),
    params:joi.object({
        postId:genralRules.id.required()
    }).required()
}