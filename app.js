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
const sessionConfig = require('./config/session');

const trueApiRoutes = require('./routes/true-api');
const ordersTrueRoutes = require('./routes/true-orders');
const payRoutes = require('./routes/payment');
const authRoutes = require('./routes/auth');
const nutritionRoutes = require('./routes/nutrition')

const dbUrl = process.env.DB_URL

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});



app.use(helmet.contentSecurityPolicy(helmetConfig));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


app.set('trust proxy', true);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://true-meniu.web.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next()
});

app.use(cors())
app.use(bodyParser.json());

app.use("/api-true", trueApiRoutes)
app.use("/orders", ordersTrueRoutes)
app.use('/pay', payRoutes)
app.use('/auth', authRoutes)
app.use('/nutrition', nutritionRoutes)

const ctrl = require('./controlers/true-api')
const multer = require('multer');
const { storage } = require('./cloudinary/index.js');
const upload = multer({ storage });

app.post('/api-true/cat-add', upload.single('image'), ctrl.addCat)
app.put('/api-true/cat', upload.single('image'), ctrl.editCategory)



const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App running on port ${port}`);
});