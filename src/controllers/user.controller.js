import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens = async (userId) => {
        
    try {
        const user = await User.findById(userId);

        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        
        await user.save({ validateBeforeSave: false})

        return { accessToken, refreshToken }
        
    } catch (error) {
        throw new ApiError(404,"Error generating" )
    }
}

const registerUser = asyncHandler( async (req, res) => {
        const { fullName, email, username, password } = req.body
       
        
        // validate fields
        if(
            [fullName,email,username,password].some((val) => val?.trim() === "")
        ) {
            throw new ApiError(400,"All fields are required");
        }

        // check for existing user

        const existedUser = await User.findOne({
            $or:[{username},{email}]
        })
       
        if(existedUser) {
            throw new ApiError(409, "Email or Username already exists")
        }

        const avatarLocalPath = req.files?.avatar[0].path;
        const coverImageLocalPath = req.files?.coverImage[0].path;

        if(!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }

        const avatar = await uploadOnCloud(avatarLocalPath);
        const coverImage = await uploadOnCloud(coverImageLocalPath);

        if(!avatar) {
            throw new ApiError(400,"Avatar file is required");
        }

        const user = await User.create({
            fullName,
            username,
            password,
            email,
            avatar: avatar.url,
            coverImage: coverImage.url
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        if(!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(200,createdUser, "User register successfully")
        )
});

const loginUser = asyncHandler(async (req,res) => {
    
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email,username,password} = req.body
  
    if(!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    });
   
    if(!user) {
        throw new ApiError(404, "User does not exists")
    }

    const isValidPassword = await user.isPasswordCorrect(password);
    
    if(!isValidPassword) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
   
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",refreshToken,options)
              .json(
                new ApiResponse(200,{user:loggedInUser})
              )
})

const logoutUser = asyncHandler(async (req,res) =>{

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: false
            }
        },
        {
            new: true
        }        
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {

    const currentRefreshToken =   req.cookies.refreshToken || req.body.refreshToken
    

    if(!currentRefreshToken) {
        throw new ApiError(401,"Invalid token")
    }

    try {
        const decodedToken = jwt.verify(currentRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user) {
            throw new ApiError(401,"Invalid refresh token ")
        }
    
        if(currentRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token or Expired")
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
        // console.log(accessToken);
    
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",refreshToken,options)
           .json(new ApiResponse(200,{accessToken: accessToken, refreshToken: refreshToken}));
    
    } catch (error) {
        throw new ApiError(401,"Something went wrong while generating token")
    }
})

const changePassword = asyncHandler(async (req,res) => {

    const {oldPassword,newPassword,confirmPassword} = req.body

    if(newPassword !== confirmPassword) {
        throw new ApiError(401,"new Password and Confirm Password should be same")
    }
    

    if(oldPassword === newPassword) {
        throw new ApiError(401, "You can't set new password as previous password")
    }

    const user = await User.findById(req.user?._id);

    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)



    if(!isOldPasswordCorrect) {
        throw new ApiError(401,"Invalid Old Password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})// This is an option passed to the save method. By default, 
                                                // Mongoose validates documents before saving them to the database. 
                                                // Setting validateBeforeSave to false skips the validation step. 
                                                // This means that the document will be saved even if it does not pass the defined schema validations.
    
    return res.status(200).json(new ApiResponse(200,{},"Password update succesfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200,req.user,"User fetch Successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body;
    if(!(fullName  && email)) {
        throw new ApiError(401,"full name or email shoud not be empty")
    }

    try {
        const user = await User.findByIdAndUpdate(req.user._id,
            {
            $set:{
                    fullName: fullName,
                    email: email
                }
            },
            {
                new: true
            }
        )

        return res.status(200).json(new ApiResponse(200,{user}))
    } catch (error) {
        throw new ApiError(401,"Something went wrong while updating details")
    }

    
})

export { registerUser,loginUser,logoutUser,refreshAccessToken,changePassword,getCurrentUser,updateAccountDetails }


