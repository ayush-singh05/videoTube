import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

// Express Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser())


// routes imports
import userRoute from './routes/user.routes.js'
import likeRoute from './routes/like.routes.js';

// routes declaration
app.use('/api/v1/users',userRoute)
app.use('/api/v1/videos/',likeRoute)


export { app }