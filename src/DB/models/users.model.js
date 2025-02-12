import mongoose from "mongoose"
export const roleTypes = {
    user: "user",
    admin: "admin",
    superAdmin: "superAdmin"
}

export const genderTypes = {
    male: "male",
    female: "female"
}

export const providerTypes = {
    system: "system",
    google: "google"
}
export const friendRequestsTypes = {
    sended: "sended",
    recived: "recived"
}
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^(?!.*\.{2})[a-zA-Z0-9][a-zA-Z0-9#$%&\*\+-/=\?\_`|~]*@[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,4}$/
    },
    provider: {
        type: String,
        enum: Object.values(providerTypes),
        default: providerTypes.system
    },
    password: {
        type: String,
        required: function () {
            return this.provider === providerTypes.google ? false : true
        },
        minLength: 8,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: Object.values(genderTypes),
        default: genderTypes.male
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: Object.values(roleTypes),
        default: roleTypes.user
    },
    passwordChangedAt: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    image: {
        secure_url: String,
        public_id: String
    },
    coverImage: [String],
    otpEmail: String,
    otpPassword: String,
    otpEmailGenratedAt: Date,
    otpPasswordGenratedAt: Date,
    otpEmailGenratedTimes: Number,
    otpPasswordGenratedTimes: Number,
    twoStepVerficationOtp: String,
    twoStepVerfication: {
        type: Boolean,
        default: false
    },
    viewers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: [Date]
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    friendRequests: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        action: { type: String, enum: Object.values(friendRequestsTypes) }
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    tempEmail: {
        type: String,
        lowercase: true,
        match: /^(?!.*\.{2})[a-zA-Z0-9][a-zA-Z0-9#$%&\*\+-/=\?\_`|~]*@[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,4}$/
    },
    otpNewEmail: String,
    changeEmailOtp: String,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

export const userModel = mongoose.models.User || mongoose.model("User", userSchema);
