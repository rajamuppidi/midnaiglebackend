// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const authRoutes = require('./routes/auth');
// const profileRoutes = require('./routes/profile');
// const healthDataRoutes = require('./routes/healthData'); // Add this line

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors({
//   origin: '*', // Allow all origins for development
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Routes
// app.use('/auth', authRoutes);
// app.use('/profile', profileRoutes);
// app.use('/health', healthDataRoutes); // Add this line

// // Root route
// app.get('/', (req, res) => {
//   res.send('Welcome to Mindaigle Backend!');
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: 'Server error',
//     details: err.message
//   });
// });

// // Start the server
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is running on http://0.0.0.0:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const healthDataRoutes = require('./routes/healthData');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5001;

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    clientIP: req.ip,
    timestamp: new Date(),
    headers: req.headers
  });
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/health', healthDataRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Mindaigle Backend!');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  console.log('\n=== Server Started ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((interface) => {
      if (interface.family === 'IPv4') {
        console.log(`Listening on http://${interface.address}:${PORT}`);
        // Try to ping the interface
        const exec = require('child_process').exec;
        exec(`ping -c 1 ${interface.address}`, (error, stdout, stderr) => {
          if (error) {
            console.log(`Interface ${interface.address} is not responding to ping`);
          } else {
            console.log(`Interface ${interface.address} is responsive`);
          }
        });
      }
    });
  });
});