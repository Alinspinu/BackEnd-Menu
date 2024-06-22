if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const path = require("path");
const session = require("express-session");
const helmet = require('helmet');

const helmetConfig = require('./config/helmet');

const methodOverride = require("method-override");
const toppingRoutes = require('./routes/back-office/topping');
const ordersTrueRoutes = require('./routes/back-office/orders');
const payRoutes = require('./routes/payment/payment');
const authRoutes = require('./routes/users/auth');
const nutritionRoutes = require('./routes/nutrition');
const registerRoutes = require('./routes/back-office/cash-register');
const tableRoutes = require('./routes/back-office/table');
const usersRoutes = require('./routes/users/users');

const suplierRoutes = require('./routes/back-office/suplier')
const nirRoutes = require('./routes/back-office/nir')
const productRoutes = require('./routes/back-office/product')
const ingRoutes = require('./routes/back-office/ing')
const subRoutes = require('./routes/back-office/subProduct')
const catRoutes = require('./routes/back-office/cats')
const gossipsRoutes = require('./routes/gossips')
const notifRoutes = require('./routes/notifications')
const printRoutes = require('./routes/print')
const recipesRoutes = require("./routes/recipe");
const sheduleRoutes = require('./routes/back-office/shedule')
const repRoutes = require('./routes/back-office/report.js')

const fs = require('fs');
const https = require('https');


const dbUrl = process.env.DB_URL

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
app.use(cors())


app.use(helmet.contentSecurityPolicy(helmetConfig));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/orders", ordersTrueRoutes);
app.use('/pay', payRoutes);
app.use('/auth', authRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/register', registerRoutes);
app.use('/table',tableRoutes);
app.use('/users', usersRoutes);
// app.use('/message', messRoutes);
app.use('/notification', notifRoutes)
app.use("/top", toppingRoutes);
app.use('/suplier', suplierRoutes);
app.use('/nir', nirRoutes);
app.use('/product', productRoutes);
app.use('/ing', ingRoutes);
app.use('/sub', subRoutes);
app.use('/cat', catRoutes);
app.use('/gossips', gossipsRoutes);
app.use('/print', printRoutes);
app.use("/recipes", recipesRoutes);
app.use('/shedule', sheduleRoutes);
app.use('/report', repRoutes);


const options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
  };
  


  app.use((err, req, res, next) => {
      const logInfo = `${new Date().toLocaleTimeString()} - ERROR - ${err.message}\n`;
      const logFilePath = path.join(__dirname, 'utils/logs', 'appError.log');
      fs.appendFile(logFilePath, logInfo, (error) => {
          if (error) {
              console.error('Error writing to log file:', error);
            }
        });
        next(err);
    });
    
const server = https.createServer(options, app);
const port = process.env.PORT || 8080;
app.listen(port,() => {
    console.log(`App running on port ${port}`);
});