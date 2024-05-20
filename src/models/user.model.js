import mongoose ,{Schema} from "mongoose";
import  jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';


const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique : true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique : true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type: String,
            required:true,
            trim:true,
            index:true
        },
        avtar:{
            type:String,
            required:true
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshToken:{
            type:String
        }
    },{
        timestamps:true
    }
)


//here we use normanl function instead call back because we need context and call dose not have context only disc more more info search  or chatGPT
userSchema.pre("save",async function(next){
    //use for password encryption 
    if(!this.isModified("password")) next();//password not changed we do not perform encrption 
    this.password = bcrypt.hash(this.password,10)
    next()
}) 

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        })
}

export const User = mongoose.model("User",userSchema)