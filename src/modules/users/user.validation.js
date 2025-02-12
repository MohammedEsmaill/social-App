import joi from "joi";
import { genralRules } from "../../utlities/genralRules.js";
export const signUpSchema = {
    body: joi.object({
        name: joi.string().alphanum().min(3).messages({ "string.min": "name is short" }),
        email: genralRules.email.required(),
        password: genralRules.password.required(),
        cPassword: joi.string().valid(joi.ref("password")).required(),
        phone: genralRules.phone.required(),
        age: joi.number().min(18).max(120).required()
    }),
    file: genralRules.file.required().messages({ "any.required": "attachment is required" })
}
export const confirmEmailSchema = {
    body: joi.object({
        email: genralRules.email.required(),
        otp: joi.string().min(4).max(4).required()
    })
}
export const anotherOtpEmailSchema = {
    body: joi.object({
        email: genralRules.email.required()
    })
}
export const logInSchema = {
    body: joi.object({
        email: genralRules.email.required(),
        password: genralRules.password.required()
    })
}
export const twoStepVerficationLoginSchema = {
    body: joi.object({
        email: genralRules.email.required(),
        otp: joi.string().min(4).max(4).required()
    })
}
export const refreshTokenSchema = {
    headers: genralRules.headers.required()
}
export const forgetPasswordSchema = {
    body: joi.object({
        email: genralRules.email.required()
    })
}
export const rsestPasswordSchema = {
    body: joi.object({
        email: genralRules.email.required(),
        otp: joi.string().min(4).max(4).required(),
        newPassword: genralRules.password.required(),
        cNewPassword: joi.string().valid(joi.ref("newPassword")).required()
    })
}
export const anotherOtpPasswordSchema = anotherOtpEmailSchema;
export const getProfileSchema = {
    headers: genralRules.headers
}
export const updateProfileSchema = {
    body: joi.object({
        name: joi.string().alphanum().min(3),
        phone: joi.string().regex(/^(010|011|012|015)\d{8}$/)
    }),
    headers: genralRules.headers,
    file: genralRules.file
}
export const updatePasswordSchema = {
    body: joi.object({
        password: genralRules.password.required(),
        newPassword: genralRules.password.required(),
        cNewPassword: joi.string().valid(joi.ref("newPassword")).required()
    }).required(),
    headers: genralRules.headers.required()
}
export const freezeAcountSchema = {
    headers: genralRules.headers
}
export const shareProfileSchema = {
    headers: genralRules.headers.required(),
    params: joi.object({
        id: genralRules.id.required(),
    }).required()
}
export const updateEmailSchema = {
    headers: genralRules.headers.required(),
    body: joi.object({
        email: genralRules.email.required()
    }).required()
}
export const replaceEmailSchema = {
    headers: genralRules.headers.required(),
    body: joi.object({
        oldEmailOtp: joi.string().min(4).max(4).required(),
        newEmailOtp: joi.string().min(4).max(4).required(),
    }).required()
}
export const verifyTwoStepVerficationSchema = {
    headers: genralRules.headers.required(),
    body: joi.object({
        otp: joi.string().min(4).max(4).required()
    }).required()
}
export const blockUserSchema = {
    headers: genralRules.headers.required(),
    params: joi.object({
        userId: genralRules.id.required(),
    }).required()
}
export const sendFriendRequsetSchema = {
    headers: genralRules.headers.required(),
    params: joi.object({
        userId: genralRules.id.required(),
    }).required()
}