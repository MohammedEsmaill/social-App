import { userModel,providerTypes, roleTypes, postModel, friendRequestsTypes } from "../../DB/models/index.js";
import cloudinary from "../../utlities/cloudinary/index.js";
import { asyncHandler, eventEmitter, compare, Hash, decrypt, encrypt, generateToken } from "../../utlities/index.js";
import { OAuth2Client } from 'google-auth-library';
// ---------------------------------- signUP ---------------------------------------
export const signUp = asyncHandler(async (req, res, next) => {
    const { name, email, password, phone, age } = req.body;
    // check if user already exist
    const users = await userModel.findOne({ email: email });
    if (users) {
        return next(new Error("user already exist", { cause: 400 }))
    }
    // check if user dosen't upload his image 
    if (!req?.file) {
        return next(new Error("please upload image", { cause: 400 }))
    }
    const {secure_url,public_id} = await cloudinary.uploader.upload(req.file.path,{folder:"social-App/users"})
    // hahsing the password
    const hash = await Hash({ key: password, SALT_ROUNDS: process.env.SALT_ROUNDS })
    // encrypt phone
    const cipherPhone = encrypt({ key: phone, SECRET_KEY: process.env.SECRET_KEY })
    // send email confirmation otp
    eventEmitter.emit("sendEmailOtp", { email })
    // send req to db
    const user = await userModel.create({ name, email, password: hash, phone: cipherPhone, age , image:{secure_url,public_id} });
    return res.status(201).json({ msg: "user created successfully",user});

})

// ---------------------------------- confirmEmail ---------------------------------------

export const confirmEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    // ckeck if user not exist
    const user = await userModel.findOne({ email: email });
    if (!user) {
        return next(new Error("Invalid email", { cause: 400 }))
    }
    // ckeck if user confirmed before
    if (user.confirmed) {
        return next(new Error("You are already confirmed", { cause: 400 }))
    }
    // ckeck if otp expired
    const now = new Date().getTime();
    if ((now - user?.otpEmailGenratedAt.getTime()) > 120000) {

        return next(new Error("expired otp", { cause: 400 }))
    }
    // ckeck if otp matched or not
    const match = compare({ key: otp, hashed: user.otpEmail })
    if (!match) {
        return next(new Error("Invalid otp", { cause: 400 }))
    }
    await userModel.findOneAndUpdate({ email }, { confirmed: true, $unset: { otpEmailGenratedTimes: 0, otpEmail: 0, otpEmailGenratedAt: 0 } });
    return res.status(200).json({ msg: "done" });
})

// ---------------------------------- sendAnotherOtpEmail ---------------------------------------

export const sendAnotherOtpEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    // ckeck if user not exist
    const user = await userModel.findOne({ email: email});
    if (!user) {
        return next(new Error("Invalid email", { cause: 400 }))
    }
    if (user.otpEmailGenratedTimes == 4) {
        const now = new Date().getTime();
        if ((now - user?.otpEmailGenratedAt.getTime()) < 300000) {
            console.log(((now-user.otpEmailGenratedAt.getTime())))
            return next(new Error("You have exceeded the number of attempts allowed please Try again after five minutes", { cause: 400 }))
        }
        await userModel.updateOne({ email }, { otpEmailGenratedTimes: 0 })
    }
    // send email confirmation otp 
    eventEmitter.emit("sendEmailOtp", { email })
    return res.status(200).json({ msg: "done" });
})

// ---------------------------------- Login ---------------------------------------

export const logIn = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    // ckeck if user not exist
    const user = await userModel.findOne({ email: email,provider:providerTypes.system });
    if (!user) {
        return next(new Error("Invalid email", { cause: 400 }))
    }
    // check if user not confirmed
    if (user.confirmed == false) {
        return next(new Error("You are not confirmed yet", { cause: 400 }))
    }
    // check if user not confirmed
    if (user.isDeleted) {
        return next(new Error("Youre acount deleted please active your acount", { cause: 400 }))
    }
    // check the password matched or not
    if (!await compare({ key: password, hashed: user.password })) {
        return next(new Error("Invalid password", { cause: 400 }))
    }
    // check if user enable two step verfication
    if (user.twoStepVerfication) {
        eventEmitter.emit("sendTwoStepVerficationOtp", { email, text: "login with" })
        return res.status(200).json({ msg: "otp verfication send successfully"});
    }
    // generate access token
    let accessToken = generateToken({ payload: { userId: user._id }, signture: user.role == roleTypes.user ? process.env.ACCESS_TOKEN_SIGNTURE_USER : process.env.ACCESS_TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1d" } })
    // generate refresh token
    let refrechToken = generateToken({ payload: { userId: user._id }, signture: user.role == roleTypes.user ? process.env.REFRESH_TOKEN_SIGNTURE_USER : process.env.REFRESH_TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1w" } })
    return res.status(200).json({ msg: "user logedIn successfully", token: { access_token: accessToken, refresh_token: refrechToken } });
})

// ---------------------------------- refreshToken ---------------------------------------

export const refreshToken = asyncHandler(async (req, res, next) => {
    // generate access token
    let accessToken = generateToken({ payload: { userId: req.user._id }, signture: req.user.role == roleTypes.user ? process.env.ACCESS_TOKEN_SIGNTURE_USER : process.env.ACCESS_TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1d" } })
    // generate refresh token
    let refrechToken = generateToken({ payload: { userId: req.user._id }, signture: req.user.role == roleTypes.user ? process.env.REFRESH_TOKEN_SIGNTURE_USER : process.env.REFRESH_TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1w" } })
    return res.status(200).json({ msg: "done", token: { access_token: accessToken, refresh_token: refrechToken } });
})

// ---------------------------------- forgetPassword ---------------------------------------

export const forgetPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    // ckeck if user not exist
    const user = await userModel.findOne({ email: email });
    if (!user) {
        return next(new Error("Invalid email", { cause: 400 }))
    }
    // check if user not confirmed
    if (user.isDeleted) {
        return next(new Error("Youre acount deleted please active your acount", { cause: 400 }))
    }
    if (user.otpPasswordGenratedTimes == 4) {
        const now = new Date().getTime();
        if ((now - user?.otpPasswordGenratedAt.getTime()) < 300000) {
            return next(new Error("You have exceeded the number of attempts allowed please Try again after five minutes", { cause: 400 }))
        }
        await userModel.updateOne({ email }, { otpPasswordGenratedTimes: 0 })
    }
    // send email confirmation otp 
    eventEmitter.emit("sendPasswordOtp", { email })
    return res.status(200).json({ msg: "done" });
})


// ---------------------------------- resetPassword ---------------------------------------

export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;
    // ckeck if user not exist
    const user = await userModel.findOne({ email: email });
    if (!user) {
        return next(new Error("Invalid email", { cause: 400 }))
    }
    // check if user not confirmed
    if (user.isDeleted) {
        return next(new Error("Youre acount deleted please active your acount", { cause: 400 }))
    }
    // ckeck if otp expired
    const now = new Date().getTime();
    if ((now - user?.otpPasswordGenratedAt.getTime()) > 120000) {
        return next(new Error("expired otp", { cause: 400 }))
    }
    // ckeck if otp matched or not
    if (!otp || !compare({ key: otp, hashed: user.otpPassword })) {
        return next(new Error("Invalid otp", { cause: 400 }))
    }
    const hash = Hash({ key: newPassword, SALT_ROUNDS: process.env.SALT_ROUNDS })
    await userModel.findOneAndUpdate({ email }, { password: hash, confirmed: true, passwordChangedAt: Date.now(), $unset: { otpPasswordGenratedTimes: 0, otpPassword: 0, otpPasswordGenratedAt: 0 } });
    return res.status(200).json({ msg: "done" });
})


// ---------------------------------- GetUserData ---------------------------------------

export const getUser = asyncHandler(async (req, res, next) => {
    const user = req.user;
    // decrypt user phone
    const phone = decrypt({ key: user.phone, SECRET_KEY: process.env.SECRET_KEY })
    return res.status(200).json({ msg: "Done", ...user, phone });
})


// ---------------------------------- socialLogin ---------------------------------------

export const loginWithGmail = asyncHandler(async (req, res, next) => {
    
    const client = new OAuth2Client();
    async function verify() {
        const {idToken} = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload;
    }
    const {email,email_verified,picture ,name} = await verify()
        let user = userModel.findOne({email})
        if (!user) {
            user = await userModel.create({
                name,
                email,
                confirmed:email_verified,
                image:picture,
                provider:providerTypes.google
            })
        }
        if (user.provider == providerTypes.system) {
            return next(new Error("please login with in system"))
        }
        // generate access token
    let accessToken = generateToken({ payload: { userId: user._id }, signture: user.role == roleTypes.user ? process.env.TOKEN_SIGNTURE_USER : process.env.TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1d" } })
    return res.status(201).json({ msg: "Done",accessToken });
})

// ---------------------------------- updateProfile ---------------------------------------

export const updateProfile = asyncHandler(async (req, res, next) => {
    if (req.body.phone) {
        // encrypt phone
        req.body.phone = encrypt({ key: req.body.phone, SECRET_KEY: process.env.SECRET_KEY })
    }
    if(req?.file){
        const {secure_url,public_id} = await cloudinary.uploader.upload(req.file.path,{folder:"social-App/users"})
        await cloudinary.uploader.destroy(req.user.image.public_id)
        req.body.image = {secure_url,public_id}
    }
    const user = await userModel.findOneAndUpdate({_id:req.user._id},req.body,{new:true})
    return res.status(200).json({ msg: "user updated successfully",user});
})

// ---------------------------------- updateUserPaasword ---------------------------------------

export const updateUserPassword = asyncHandler( async (req,res,next)=>{
    const {password,newPassword} = req.body; 
    // compare the password
    if (!await compare({key:password,hashed:req.user.password})) {
        return next(new Error("password not matched",{cause:400}))
    }
    // check the new value of password
    if (password == newPassword) {
        return next(new Error("please input new value for your password",{cause:400}))
    }
    // hash new password
    const hashed = Hash({key:newPassword,SALT_ROUNDS:process.env.SALT_ROUNDS})
    const updatedUser = await userModel.findByIdAndUpdate(req.user._id ,{password : hashed,passwordChangedAt:Date.now()})
    return res.status(200).json({msg:"Done",updatedUser});
})


// ---------------------------------- shareProfile ---------------------------------------

export const shareProfile = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // ckeck if user not exist
    const user = await userModel.findOne({ _id: id,blockedUsers:{$nin:[req.user._id]} });
    if (!user) {
        return next(new Error("Invalid email", { cause: 400 }))
    }
    // check if user not confirmed
    if (user.isDeleted) {
        return next(new Error("Youre acount deleted please active your acount", { cause: 400 }))
    }
    if (req.user._id.toString() === id) {
        return res.status(200).json({ msg: "done",user:req.user});
    }
    const userExist = user.viewers.find(viewer=>{
        return req.user._id.toString() === viewer.userId.toString()
    })
    if (userExist) {
        userExist.viewedAt.push(Date.now())
        if (userExist.viewedAt.length > 5) {
            userExist.viewedAt.slice(-5)
        }
    }else{
        user.viewers.push({userId:req.user._id,viewedAt:[Date.now()]})
    }
    await user.save()
    return res.status(200).json({ msg: "done",user:user.email});
})

// ---------------------------------- updateEmail ---------------------------------------

export const updateEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    // ckeck if new email exist
    const user = await userModel.findOne({ email });
    if (user) {
        return next(new Error("email already exist", { cause: 400 }))
    }
    // send email confirmation otp
    eventEmitter.emit("changeEmailOtp",{ email:req.user.email })
    eventEmitter.emit("sendNewEmailOtp",{ email,id:req.user._id })
    // save new email 
    await userModel.updateOne({_id:req.user._id},{tempEmail:email})
    return res.status(200).json({ msg: "done"});
})

// ---------------------------------- replaceEmail ---------------------------------------

export const replaceEmail = asyncHandler(async (req, res, next) => {
    const { oldEmailOtp,newEmailOtp } = req.body;
    // ckeck if new email exist
    const user = await userModel.findOne({ _id:req.user._id });
    if(!compare({key:oldEmailOtp,hashed:user.changeEmailOtp}) || !compare({key:newEmailOtp,hashed:user.otpNewEmail})){
        return next(new Error("invalid otp ", {cause:400}))
    }
    // save new email 
    const newUser = await userModel.findOneAndUpdate({_id:req.user._id},{email:req.user.tempEmail,$unset:{tempEmail:0,changeEmailOtp:0,otpNewEmail:0}},{new:true})
    return res.status(200).json({ msg: "done",newUser});
})

// ---------------------------------- dashboard ---------------------------------------

export const dashboard = asyncHandler(async (req, res, next) => {
    const data = await Promise.all([
        userModel.find(),
        postModel.find()
    ])
    return res.status(200).json({ msg: "done",data});
})

// ---------------------------------- updateRole ---------------------------------------

export const updateRole = asyncHandler(async (req, res, next) => {
    const {userId} = req.params;
    const {role} = req.body
    const data = req.user.role === roleTypes.superAdmin?{role:{$nin:[roleTypes.superAdmin]}}:{role:{$nin:[roleTypes.superAdmin,roleTypes.admin]}}
    const user = await userModel.findOneAndUpdate({_id:userId,isDeleted:false,...data},{role,updatedBy:req.user._id},{new:true})
    if (!user) {
        return next(new Error("user not found or un authorized", { cause: 400 }))
    }
    return res.status(200).json({ msg: "done",user});
})


// ---------------------------------- enableTwoStepVerfication ---------------------------------------

export const enableTwoStepVerfication = asyncHandler(async (req, res, next) => {
    if (req.user.twoStepVerfication) {
        return next(new Error("two step verfication already enabled", { cause: 400 }))
    }
    eventEmitter.emit("sendTwoStepVerficationOtp", { email: req.user.email, text: "enable" })
    return res.status(200).json({ msg: "done"});
})



// ---------------------------------- verifiyTwoStepVerfication ---------------------------------------

export const verifiyTwoStepVerfication = asyncHandler(async (req, res, next) => {
    const {otp} = req.body;
    if (!otp || !compare({ key: otp, hashed: req.user.twoStepVerficationOtp })) {
        return next(new Error("invalid otp", { cause: 400 }))
    }
    const user = await userModel.findOneAndUpdate({_id:req.user._id},{twoStepVerfication:true,$unset:{twoStepVerficationOtp:0}},{new:true})
    return res.status(200).json({ msg: "done",user});
})



// ---------------------------------- twoStepVerficationLogin ---------------------------------------

export const twoStepVerficationLogin = asyncHandler(async (req, res, next) => {
    const {otp,email} = req.body;
    const user = await userModel.findOne({ email: email,provider:providerTypes.system });
    if (!otp || !compare({ key: otp, hashed: user.twoStepVerficationOtp })) {
        return next(new Error("invalid otp", { cause: 400 }))
    }
    // generate access token
    let accessToken = generateToken({ payload: { userId: user._id }, signture: user.role == roleTypes.user ? process.env.ACCESS_TOKEN_SIGNTURE_USER : process.env.ACCESS_TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1d" } })
    // generate refresh token
    let refrechToken = generateToken({ payload: { userId: user._id }, signture: user.role == roleTypes.user ? process.env.REFRESH_TOKEN_SIGNTURE_USER : process.env.REFRESH_TOKEN_SIGNTURE_ADMIN, expiresIn: { expiresIn: "1w" } })
    return res.status(200).json({ msg: "user logedIn successfully", token: { access_token: accessToken, refresh_token: refrechToken } });
})





// ------------------------------- blockUser ---------------------------------------

export const blockUser = asyncHandler(async (req, res, next) => {
    const {userId} = req.params;
    const user = await userModel.findOne({_id:req.user._id,blockedUsers:{$in:[userId]}})
    let action;
    let myMsg;
    if (user) {
        myMsg = "user unblocked successfully"
        action = await userModel.updateOne({ _id: req.user._id }, { $pull: { blockedUsers: userId } })
    } else {
        myMsg = "user blocked successfully"
        action = await userModel.updateOne({ _id: req.user._id }, { $addToSet: { blockedUsers: userId } })
    }
    if (!action) {
        return next(new Error("user not found or un authorized", { cause: 400 }))
    }
    return res.status(200).json({ msg: myMsg});
})




// ------------------------------- sendFriendRequset ---------------------------------------

export const sendFriendRequset = asyncHandler(async (req, res, next) => {
    const {userId} = req.params;
    const sender = await userModel.findOne({ _id: req.user._id,isDeleted:false})
    const reciver = await userModel.findOne({ _id: userId,isDeleted:false}).select("-password")
    if (!sender || !reciver) {
        return next(new Error("fail to send friend request", { cause: 400 }))
    }
    // check if user already send friend request
    if (sender.frfriendRequests?.find(user=>user.userId.toString() === userId.toString()) ||
        reciver.friendRequests?.find(user=>user.userId.toString() === req.user._id.toString()) ||
        sender.friends?.find(user=>user.userId.toString() === userId.toString()) ||
        reciver.friends?.find(user=>user.userId.toString() === req.user._id.toString())) {
        return next(new Error("fail to send friend request", { cause: 400 }))
    }
    // push request in sender friendRequests list
    sender.friendRequests.push({userId:userId,action:friendRequestsTypes.sended})
    // push request in reciver friendRequests list
    reciver.friendRequests.push({userId:req.user._id,action:friendRequestsTypes.recived})
    await sender.save()
    await reciver.save()
    return res.status(200).json({ msg:"friend request sent successfully"});
})




// ------------------------------- acceptFriendRequset ---------------------------------------

export const acceptFriendRequset = asyncHandler(async (req, res, next) => {
    const {userId} = req.params;
    const user = await userModel.findOne({_id:req.user._id})
    const friend = await userModel.findOne({_id:userId})
    const userExist = user.friendRequests.find(user=>user.action === friendRequestsTypes.recived && user.userId.toString() === userId.toString())
    const friendExist = friend.friendRequests.find(user=>user.action === friendRequestsTypes.sended && user.userId.toString() === req.user._id.toString())
    if (!userExist || !friendExist) {
        return next(new Error("fail to accept friend request", { cause: 400 }))
    }
    // add friend in my friend list
    user.friends.push(userId)
    // remove friend in my friendRequest list
    user.friendRequests = user.friendRequests.filter(user=>user.userId.toString() !== userId.toString())
    // add friend in friend list
    friend.friends.push(req.user._id)
    // remove requset in his friendRequest list
    friend.friendRequests = friend.friendRequests.filter(user=>user.userId.toString() !== req.user._id.toString())
    await user.save()
    await friend.save()
    
    return res.status(200).json({ msg:"done",user});
})




