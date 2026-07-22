// import dotenv from 'dotenv';
// dotenv.config();
// import express from 'express';
// import cors from 'cors';
// import connectDB from './config/database.js';
// import studentRoutes from './routes/studentRoutes.js';
// import grievanceRoutes from './routes/grievanceRoutes.js'
// import staffRoutes from './routes/staffRoutes.js';

// const app = express();
// connectDB();

// app.use(cors({
//   origin: 'https://grievanceflowai.vercel.app',
//   credentials: true
// }));


// app.use(express.json());
// app.use('/api/students',studentRoutes);
// app.use('/api/grievances', grievanceRoutes);
// app.use('/api/staff', staffRoutes);


// const port = process.env.PORT;

// app.get("/",(req,res) => {
//     res.send("welcome to backend");
// });

// app.listen(port ,()=>{
//     console.log(`the server is running on http://localhost:${port}`);
// })


import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://grievanceflowai.vercel.app',
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinStudentRoom', (studentId) => {
    socket.join(`student_${studentId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api/students', studentRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/staff', staffRoutes);

const port = process.env.PORT;

app.get("/", (req, res) => {
    res.send("welcome to backend");
});

server.listen(port, () => {
    console.log(`the server is running on http://localhost:${port}`);
})