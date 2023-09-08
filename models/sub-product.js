
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Product = require('./product-true')


const subProductSchema = new Schema({
    name: String,
    price: Number,
    quantity: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
    },
    description: {
        type: String
    },
    order: {
        type: Number,
        required: true
    },
    image: {
        filename: String,
        path: String
    },
    available: {
        type: Boolean,
        default: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'ProductTrue'
    }
})

subProductSchema.pre('deleteOne', { document: true }, async function (next) {
    try {
        const subId = this._id
        await Product.updateMany({ subProducts: subId }, { $pull: { subProducts: subId } }).exec()
        next()
    } catch (error) {
        next(error)
    }

})

module.exports = mongoose.model('SubProduct', subProductSchema)


