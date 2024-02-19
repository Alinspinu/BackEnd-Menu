const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com",
];
const styleSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css",
    "https://fonts.googleapis.com/",
];
const fontSrcUrls = [
    "https://fonts.googleapis.com/",
    "https://fonts.gstatic.com",
    "https://cdn.jsdelivr.net",
];

const helmetConfig = {
    directives: {
        defaultSrc: [],
        mediaSrc: ["https://res.cloudinary.com/", "https://flow-api-394209.lm.r.appspot.com", "https://www.flowmanager.ro"],
        connectSrc: [
            "http://localhost:8080",
            "https://www.flowmanager.ro",
            "https://true-meniu.web.app",
            "https://demo.vivapayments.com",
            "https://cash-flow-8a7f4.web.app",
            "https://cash-flow-cafetish.web.app",
            "https://flow-api-394209.lm.r.appspot.com",
        ],
        formAction: ["'self'", "https://checkout.stripe.com", "https://demo.vivapayments.com"],
        scriptSrcAttr: ["'unsafe-inline'"],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        frameSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://www.youtube.com",
        ],
        objectSrc: [],
        imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://res.cloudinary.com/dhetxk68c/",
            "https://images.unsplash.com/",
            "https://q.stripe.com",
        ],
        fontSrc: ["'self'", ...fontSrcUrls],
    },
};

module.exports = helmetConfig;
