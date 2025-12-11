const chalk = require("chalk");

const logger = {
  info: (...msg) => console.log(chalk.blue("[INFO]"), ...msg),
  success: (...msg) => console.log(chalk.green("[SUCCESS]"), ...msg),
  warn: (...msg) => console.warn(chalk.yellow("[WARN]"), ...msg),
  error: (...msg) => console.error(chalk.red("[ERROR]"), ...msg),
  debug: (...msg) => {
    if (process.env.DEBUG === "true") {
      console.log(chalk.magenta("[DEBUG]"), ...msg);
    }
  }
};

module.exports = logger;