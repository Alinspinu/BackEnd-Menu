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
const invoiceRoutes = require('./routes/back-office/invoice.js')
const gbtRoutes = require('./routes/gbt.js')
const reservationRoutes = require('./routes/reservation.js')
const testRoutes = require('./routes/test.js')
const clientsRoutes = require('./routes/back-office/client.js')
const vivaWebhooks = require('./routes/viva-wbhooks.js') 
const cron = require('node-cron');


const {authApi, authApiAdmin} = require('./auth/auth')

const compression = require('compression');

const {checkAndNotifyReservations} = require('./controlers/notification.js')


if (process.env.NODE_ENV === 'production') {
    const heapdump = require('heapdump');
  
    process.on('SIGUSR2', () => {
      const filename = path.resolve(__dirname, `heap-${Date.now()}.heapsnapshot`);
      heapdump.writeSnapshot(filename, (err, filename) => {
        if (err) console.error('Heapdump failed:', err);
        else console.log('Heapdump written to', filename);
      });
    });
  }


cron.schedule('*/5 8-20 * * *', async () => {
    await checkAndNotifyReservations();
  });



const dbUrl = process.env.LOCAL
// const dbUrl = process.env.LOCAL



mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.use(compression());

app.use(cors());

app.options('*', cors()); 

app.use(express.json({ limit: '50mb' })); 



app.use(helmet.contentSecurityPolicy(helmetConfig));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.urlencoded({limit: '200mb', extended: true }));
app.use(express.json({ limit: '150mb' }))

app.use("/orders", ordersTrueRoutes);
app.use('/pay', payRoutes);
app.use('/auth', authRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/register', authApi, registerRoutes);
app.use('/table', authApi, tableRoutes);
app.use('/users', authApi, usersRoutes);
app.use('/notification', authApi, notifRoutes)
app.use("/top", toppingRoutes);
app.use('/suplier', authApi, suplierRoutes);
app.use('/nir', authApi, nirRoutes);
app.use('/product', productRoutes);
app.use('/ing', authApi, ingRoutes);
app.use('/sub', authApi, subRoutes);
app.use('/cat', catRoutes);
app.use('/gossips', authApi, gossipsRoutes);
app.use('/print', authApi, printRoutes);
app.use("/recipes", authApi, recipesRoutes);
app.use('/shedule', authApi, sheduleRoutes);
app.use('/report', authApi, repRoutes);
app.use('/clients', authApi, clientsRoutes);
app.use('/invoice', authApi, invoiceRoutes)
app.use('/gbt', gbtRoutes)
app.use('/reservation', reservationRoutes)
app.use('/viva-web', authApiAdmin, vivaWebhooks)



app.use('/test', testRoutes)

app.get('/rew', (req, res) => {
    const googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJ96oXXor7ykARXU3JtcikJjs';
    res.redirect(googleReviewUrl);
})





const port = process.env.PORT || 8080;
app.listen(port, async () => {
    console.log(`App running on port ${port}`);
});