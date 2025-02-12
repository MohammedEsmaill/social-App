import joi from "joi";
import { genralRules } from "../../utlities/genralRules.js";
export const createCommentSchema = {
    body:joi.object({
        content:joi.string().min(3).required(),
        onModel:joi.string().valid("post","comment").required()
    }),
    headers:genralRules.headers.required(),
    params:joi.object({
        refId:genralRules.id.required()
    }),
    files:joi.array().items(genralRules.file)
}

export const updateCommentSchema = {
    body:joi.object({
        content:joi.string().min(3)
    }),
    headers:genralRules.headers.required(),
    params:joi.object({
        postId:genralRules.id.required(),
        commentId:genralRules.id.required()
    }),
    files:joi.array().items(genralRules.file)
}
