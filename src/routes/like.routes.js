import { Router } from "express";
import { 
        // getAllVideos,
        // toggleCommentLike,
        // toggleTweetLike,
        toggleVideoLike
        // getLikedVideos
    } from "../controllers/like.controller.js";

    import { verifyJWT } from "../middlewares/auth.middleware.js";

    const router = Router();
    router.use(verifyJWT);
    router.route("/toggle/v/:videoId").post(toggleVideoLike);
export default router;