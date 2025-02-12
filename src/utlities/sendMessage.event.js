import { EventEmitter } from "events";
import { sendMessage,html } from "../services/index.js";
export const eventEmitter = new EventEmitter();
import {userModel} from "../DB/models/index.js";
import { Hash } from "./hash.js";
import { customAlphabet } from "nanoid";
import { log } from "console";
// -------------------- sendEmailOtp --------------------
eventEmitter.on("sendEmailOtp",async(data)=>{
    const {email} = data;
    const otp = customAlphabet("0123456789",4)()
    const hash = Hash({key:otp,SALT_ROUNDS:process.env.SALT_ROUNDS})
    const user = await userModel.findOne({email})
    let times = 1
    if (user?.otpEmailGenratedTimes) {
        times = user.otpEmailGenratedTimes+1
    }
    await userModel.updateOne({email},{otpEmail:hash,otpEmailGenratedAt:Date.now(),otpEmailGenratedTimes:times})
    const emailSender = await sendMessage(email,"confirm Email",html({msg:"confirm Email",otp:otp}))
    if (!emailSender) {
        return next(new Error("failed to send email",{cause:500}))
    }
})
// -------------------- changeEmailOtp --------------------
eventEmitter.on("changeEmailOtp",async(data)=>{
    const {email} = data;
    const otp = customAlphabet("0123456789",4)()
    const hash = Hash({key:otp,SALT_ROUNDS:process.env.SALT_ROUNDS})
    await userModel.updateOne({email},{changeEmailOtp:hash})
    const emailSender = await sendMessage(email,"confirm Email",html({msg:"confirm Email",otp:otp}))
    if (!emailSender) {
        return next(new Error("failed to send email",{cause:500}))
    }
})
// -------------------- sendNewEmailOtp --------------------
eventEmitter.on("sendNewEmailOtp",async(data)=>{
    const {email,id} = data;
    const otp = customAlphabet("0123456789",4)()
    const hash = Hash({key:otp,SALT_ROUNDS:process.env.SALT_ROUNDS})
    await userModel.updateOne({_id:id},{otpNewEmail:hash})
    const emailSender = await sendMessage(email,"confirm New Email",html({msg:"confirm New Email",otp:otp}))
    if (!emailSender) {
        return next(new Error("failed to send email",{cause:500}))
    }
})
// -------------------- sendPasswordOtp --------------------
eventEmitter.on("sendPasswordOtp",async(data)=>{
    const {email} = data;
    const otp = customAlphabet("0123456789",4)()
    const hash = Hash({key:otp,SALT_ROUNDS:process.env.SALT_ROUNDS})
    const user = await userModel.findOne({email})
    let times = 1
    if (user?.otpPasswordGenratedTimes) {
        times = user.otpPasswordGenratedTimes+1
    }
    await userModel.updateOne({email},{otpPassword:hash,otpPasswordGenratedAt:Date.now(),otpPasswordGenratedTimes:times})
    const emailSender = await sendMessage(email,"reset password otp",html({msg:"reset password otp",otp:otp}))
    if (!emailSender) {
        return next(new Error("failed to send email",{cause:500}))
    }
})

// -------------------- sendTwoStepVerficationOtp --------------------
eventEmitter.on("sendTwoStepVerficationOtp",async(data)=>{
    const {email,text} = data;
    const otp = customAlphabet("0123456789",4)()
    const hash = Hash({key:otp,SALT_ROUNDS:process.env.SALT_ROUNDS})
    await userModel.updateOne({email},{twoStepVerficationOtp:hash})
    const user = await userModel.findOne({email})
    log(user)
    const emailSender = await sendMessage(email,`${text} Two Step-Verfication`,html({msg:`${text} Two Step-Verfication`,otp:otp}))
    if (!emailSender) {
        return next(new Error("failed to send email",{cause:500}))
    }
})