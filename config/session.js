if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const MongoDbStore = require("connect-mongo");

const sessionConfig = {
    store: MongoDbStore.create({
        mongoUrl: process.env.DB_URL,
        autoRemove: "interval",
        autoRemoveInterval: 10,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};


module.exports = sessionConfig