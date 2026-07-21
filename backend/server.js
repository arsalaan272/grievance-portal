import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import studentRoutes from './routes/studentRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js'
import staffRoutes from './routes/staffRoutes.js';

const app = express();
connectDB();

app.use(cors({
  origin: 'https://grievanceflowai.vercel.app',
  credentials: true
}));


app.use(express.json());
app.use('/api/students',studentRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/staff', staffRoutes);


const port = process.env.PORT;

app.get("/",(req,res) => {
    res.send("welcome to backend");
});

app.listen(port ,()=>{
    console.log(`the server is running on http://localhost:${port}`);
})