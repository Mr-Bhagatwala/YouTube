// require('dotenv').config({path : './env'});
import dotenv from "dotenv";
import connectDB from "./DB/index.js";
import express from "express";
import { app } from "./app.js";
dotenv.config({
    path : './.env'
})
// const app = express();
var PORT = 3000
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRR : ",error);
        throw error
    })
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error)=>{
    console.log("MONGO-DB connection error" , error);
})