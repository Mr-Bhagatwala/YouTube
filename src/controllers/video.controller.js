import mongoose,{isValidObjectId} from "mongoose";
import {Video} from "../models/video.model"
import { User } from "../models/user.model";
import { Comment } from "../models/comment.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary ,deleteOnCloudinary } from "../utils/cloudinary";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // TODO: get all videos based on query, sort, pagination

    





})