import mongoose from "mongoose"
export const specificityTypes = {
    public: "public",
    friends: "friends",
    specificFriends: "specificFriends"
}
const postschema = new mongoose.Schema({
    content:{
        type:String,
        required:true,
        trim:true,
        minLength:3
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    deletedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    isDeleted:Boolean,
    attachments:[{
        secure_url:String,
        public_id:String
    }],
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    specificity: {
        type: String,
        enum: Object.values(specificityTypes),
        default: specificityTypes.public
    },
    specificUsers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
},{
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})
postschema.virtual("comment",{
    ref:"Comments",
    localField:"_id",
    foreignField:"refId",

})

export const postModel = mongoose.models.Posts || mongoose.model("Posts",postschema);