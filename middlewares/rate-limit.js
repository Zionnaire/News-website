const rateLimit = require('express-rate-limit');
const app = require("../app");
// Create a rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum number of requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
// Apply rate limiter middleware to the desired routes
app.use('/api/v1/auth', limiter);

