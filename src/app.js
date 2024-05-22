import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))//json file matrhi data ave tyare

app.use(express.urlencoded({extended: true,limit:"16kb"}))//url mathi datas ave tyare 

app.use(express.static("public"));

app.use(cookieParser())




//routes imports

import userRouter from './routes/user.routes.js'


//define routes


//here we use app.use() instead app.get() because we separate the router so we have to use middleware for controll the routes
app.use("/api/v1/users",userRouter)
// http://localhost:3000/api/v1/users ===then he calles userRouter then after the userRouter url :  http://localhost:3000/api/v1/users/register

export { app }