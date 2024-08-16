import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from '../models/like.model.js'
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    

    const userId = req.body._id;
    
    // check if video exists
    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(401,'video does not exists');
    }

    // checked user is alredy liked
    const existingLiked = await Like.findOne({
        video: videoId,
        likeBy: userId,
    });

     //if alreday liked remove liked and toggle button
    if(existingLiked) {
            existingLiked.remove();
            return res.status(200).json(new ApiResponse(200,existingLiked,"Like removed"))
    }else {
       //if like does't exits create one toggle on
       const newLike = new Like({
            video: videoId,
            likedBy: userId,
        });

       await newLike.save(); 
       return res.status(200).json(new ApiResponse(200, newLike,"Liked"))
    }
   

    
    

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}