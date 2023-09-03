
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Counter = require('./counter')

const orderTrueSchema = new Schema({
    index: {
        type: Number,
        index: true
    },
    masa: {
        type: Number,
        required: true
    },
    productCount: {
        type: Number,
        required: true
    },
    tips: {
        type: Number,
        default: 0
    },
    totalProducts: {
        type: Number,
        required: true
    },
    total: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "open",
    },
    completetime: {
        type: Number,
        default: 0
    },
    cashBack: {
        type: Number,
        default: 0
    },
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
                }
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