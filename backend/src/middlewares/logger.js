// Middleware logging requests
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  // Log request
  console.log(`[${timestamp}] → ${method.padEnd(6)} ${url} | IP: ${ip}`);

  const start = Date.now();
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Color coding for status
    let statusColor = '\x1b[32m'; // green
    if (statusCode >= 500) statusColor = '\x1b[31m'; // red
    else if (statusCode >= 400) statusColor = '\x1b[33m'; // yellow
    else if (statusCode >= 300) statusColor = '\x1b[36m'; // cyan
    
    const resetColor = '\x1b[0m';
    console.log(`[${timestamp}] ← ${statusColor}${statusCode}${resetColor} ${method.padEnd(6)} ${url} | ${duration}ms`);
  });

  // Log errors on error
  res.on('error', (err) => {
    console.error(`[${timestamp}] ✗ ERROR ${method} ${url}:`, err.message);
  });

  next();
};

module.exports = requestLogger;
