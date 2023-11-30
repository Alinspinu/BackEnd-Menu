
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Counter = require('../utils/counter')

const orderTrueSchema = new Schema({
    index: {
        type: Number,
        index: true
    },
    masaRest: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
    },
    production: Boolean,
    masa: {
        type: Number
    },
    productCount: {
        type: Number,
        required: true
    },
    tips: {
        type: Number,
        default: 0
    },
    pending: {
        type: Boolean,
        default: true
    },
    totalProducts: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "open",
    },
    toGo: {
        type: Boolean,
        default: false
    },
    pickUp: {
        type: Boolean,
        default: false
    },
    completetime: {
        type: Number,
        default: 0
    },
    endTime: {
        type: String
    },
    cashBack: {
        type: Number,
        default: 0
    },
    payOnSite: {
        type: Boolean,
        default: false
    },
    payOnline: {
        type: Boolean,
        default: false
    },
    paymentMethod: String,
    userName: String, 
    userTel: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'UserTrue'
    },
    products:
        [
            {
                name: {
                    type: String,
                    required: true
                },
                category: String,
                mainCat: String,
                imgPath: String,
                payToGo: Boolean,
                sub: Boolean,
                quantity: {
                    type: Number,
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                },
                total: {
                    type: String,
                    required: true
                },
                toppings: [String],
            }
        ]


}, { timestamps: true, })


orderTrueSchema.pre("save", async function (next) {
    try {
        const doc = this;
            const counter = await Counter.findOneAndUpdate(
                { model: "Order" },
                { $inc: { value: 1 } },
                { upsert: true, new: true }
            ).exec();
    
            doc.index = counter.value;
            next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('OrderTrue', orderTrueSchema)