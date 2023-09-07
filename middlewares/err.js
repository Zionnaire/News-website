// ...

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  });
  
// Handle rate limit exceeded error
  app.use((err, req, res, next) => {
    if (err instanceof RateLimitExceededError) {
      res.status(429).json({ message: 'Too many requests, please try again later.' });
    } else {
      next(err);
    }
  });