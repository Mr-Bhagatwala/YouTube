// require('dotenv').config({path : './env'});
// import dotenv from "dotenv";
import connectDB from "./DB/index.js";
import express from "express";
import { app } from "./app.js";
// dotenv.config({
//     path : './.env'
// })
// const app = express();
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRR : ",error);
        throw error
    })
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`server is runnig at port : ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGO-DB connection error" , error);
})