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

const toppingRoutes = require('./routes/back-office/topping');
const ordersTrueRoutes = require('./routes/back-office/orders');
const payRoutes = require('./routes/payment/payment');
const authRoutes = require('./routes/users/auth');
const nutritionRoutes = require('./routes/nutrition');
const registerRoutes = require('./routes/back-office/cash-register');
// const messRoutes = require('./routes/messages');
const tableRoutes = require('./routes/back-office/table');
const usersRoutes = require('./routes/users/users');

const suplierRoutes = require('./routes/back-office/suplier')
const nirRoutes = require('./routes/back-office/nir')
const productRoutes = require('./routes/back-office/product')
const ingRoutes = require('./routes/back-office/ing')
const subRoutes = require('./routes/back-office/subProduct')
const catRoutes = require('./routes/back-office/cats')

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


app.use(cors())
app.use(bodyParser.json());

app.use("/orders", ordersTrueRoutes);
app.use('/pay', payRoutes);
app.use('/auth', authRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/register', registerRoutes);
// app.use('/message', messRoutes);
app.use('/table', tableRoutes);
app.use('/users', usersRoutes);

app.use("/top", toppingRoutes);
app.use('/suplier', suplierRoutes);
app.use('/nir', nirRoutes);
app.use('/product', productRoutes);
app.use('/ing', ingRoutes);
app.use('/sub', subRoutes);
app.use('/cat', catRoutes);



// const Order = require('./models/office/product/order');
// const {formatedDateToShow} = require('./utils/functions')

    // app.get('/mail', async (req, res, next) => {
    //     const order = await Order.findOne({}, {}, { sort: { 'createdAt': -1 }}).populate({path: 'user', select: 'email'})
    //     const startDate = formatedDateToShow(order.createdAt)
    //     order.name = startDate

    //     if(order.preOrder) {
    //         const endDate = formatedDateToShow(order.preOrderPickUpDate)
    //             order.preOrderPickUpDate = endDate
    //     }
    //     console.log(order)
    //     res.render('layouts/info-customer', {data: order})
    // } )  


const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App running on port ${port}`);
});