import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async()=>{
    try {
        const connectionInstace = await mongoose.connect(`mongodb://127.0.0.1:27017/${DB_NAME}}`)
        console.log(`\n MONGODB connected !!! DB HOST : ${connectionInstace.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection error",error);
        process.exit(1);
    }
}

export default connectDB;