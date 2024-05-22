import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'  
import {ApiResponse} from '../utils/ApiResponse.js'

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

export {registerUser}