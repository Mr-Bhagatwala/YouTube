import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js'; // Ensure this is correctly pointing to the constants file

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`);
        console.log(`\nMONGODB connected! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log('MONGODB connection error', error);
        process.exit(1);
    }
};

export default connectDB;
