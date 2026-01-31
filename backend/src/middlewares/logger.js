const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  const start = Date.now();
  res.on('finish', () => {
    console.log(`${res.statusCode} ${method} ${url} - ${Date.now() - start}ms`);
  });

  next();
};

module.exports = requestLogger;
