import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'  
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}
const registerUser = asyncHandler(async(req,res)=>{
   // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const{fullname , username,email,password} = req.body

    if(fullname===""){
        throw new ApiError(400,"fullname is required")
    }
    if(username===""){
        throw new ApiError(400,"username is required")
    }
    if(email===""){
        throw new ApiError(400,"email is required")
    }
    if(password===""){
        throw new ApiError(400,"password is rerecgxwerferwquired")
    }
    
    if([fullname,username,email,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

//    const existedUserbane = await  User.findOne({
//         $or:[{username}]
//     })
//     if(existedUserbane){
//         throw new ApiError(409,"User is already existed with this username")
//     }

//     const existedUseremail = await User.findOne({
//         $or:[{email}]
//     })
//     if(existedUseremail){
//         throw new ApiError(409,"User is already existed with this email")
//     }

    const existedUser = await User.findOne({    
    $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalpath = await  req.files?.coverImage[0]?.path;

    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ) {
        coverImageLocalpath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

   

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if (!avatar) {
        throw new ApiError(400,"avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
    "-password  -refreshToken"
   )

   if (!createdUser) {
    throw new ApiError(500,"something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"user register successfully")
   )
})


const loginUser = asyncHandler(async (req,res)=>{
    //req.body ->data 
    //username or email 
    //find the user if exisst or not 
    //password check if not correct then error
    //if password is correct then generate access token and refresh token
    //then store in cooki then send cookie
    
    
    const {email,username,password} = req.body
    if (!email && !username) {
        throw new ApiError(400,"email or username is required ")
    }

    //now we check if username and email is exist or not or we can say find the user by username or email
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if (!user) {
        throw new ApiError(404,"user does not exist!!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404,"password is wrong !!")
    }
    //now we generate the accesstoken and refresh token 

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken (user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully    "
        )
    )

})

const logoutUser = asyncHandler(async (req,res)=>{
        await User.findByIdAndUpdate(req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },{
                new:true
            }
        )

        const options = {
            httpOnly:true,
            secure:true
        }

        return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400,"unauthorized request while refreshAccessToken")
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(400,"Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"refresh token  is expired or used")
     }
     const options = {
         httpOnly:true,
         secure:true
     }
 
     const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
         new ApiResponse (200,{
             accessToken,
             refreshToken:newRefreshToken
         },"Access token refreshed")
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
   }

    

})


const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword , newPassword} = req.body
    // const {oldPassword , newPassword , confirmPassword} = req.body

    // if(!(newPassword === confirmPassword)){
    //     throw new ApiError(500 , "your newPassword and confirmPassword not matched")
    // }

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(200,"invalid old password")
    }

    user.password = newPassword

    user.save({validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password change successfully"))
})

const getCurrentUser = asyncHandler (async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user , "current user fetched successfully"))
})

const updateAcountDetailes = asyncHandler(async (req,res)=>{
    const {newFullname , newEmail} = req.body

    if(!newFullname || !newEmail){
        throw new ApiError(500, "please enter the new email or new fullname for update the fullname or email")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set :{
                fullname : newFullname,
                email : newEmail
            }
        },{ new : true}//here using new operator it can retrun updated data
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200,user,"account detail updated"))
})

const updateUserAvatar  = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path//here we use file instead of files becasue here we want only one file from local storage and while using files we store multiple files 

    if (!avatarLocalPath) {
        throw new ApiError(200,"avatar file is missing ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(200,"error while uploading the avatar on cloudinary  ")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar
            }
        },{new:true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200,user,"avatar image update successfully"))
})

const updateUserCoverImage  = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path//here we use file instead of files becasue here we want only one file from local storage and while using files we store multiple files 

    if (!coverImageLocalPath) {
        throw new ApiError(200,"coverImage file is missing ")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(200,"error while uploading the coverImage on cloudinary  ")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage
            }
        },{new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"cover image update successfully"))
})


const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username} =req.params

    if(!username?.trim()){
        new ApiError(400,"username not valid or username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"$subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"$subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo" // me jene subscribe karyu hoy te
            }
        },
        {
            $addFields:{
                subscribersCount : {
                    $size: "$subscribers"
                },
                channelSubscribeToCount:{
                    $size : "$subscribedTo"
                },
                    isSubscribed:{
                        $cond:
                        {
                            if:{$in : [req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                email:1,
                subscribersCount:1,
                channelSubscribeToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1

            }
        }

    ])

    if (!channel?.length) {
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse (200,channel[0],"user channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res 
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"watch history fetch successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAcountDetailes,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}