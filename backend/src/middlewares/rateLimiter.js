// Middleware log requests
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${statusColor}${status}\x1b[0m ${method} ${url} - ${duration}ms`);
  });

  next();
};

module.exports = requestLogger;