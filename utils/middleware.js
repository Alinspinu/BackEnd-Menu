
const fs = require('fs');
const path = require('path');



const logMiddleware = (req, res, next) => {
  const startTime = new Date();
  const originalSend = res.send;

  res.send = function (body) {
    originalSend.call(this, body);
    const endTime = new Date();
    const responseTime = endTime - startTime;
    const logInfo = `${new Date().toLocaleTimeString()} - ${req.method} ${req.url} - Status: ${res.statusCode} - Response Time: ${responseTime}ms\n`;
    const logFilePath = path.join(__dirname, 'logs', 'app.log');

    fs.appendFile(logFilePath, logInfo, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  };

  next();
};


module.exports = {logMiddleware}

