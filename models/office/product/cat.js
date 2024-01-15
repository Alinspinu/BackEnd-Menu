const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const categoryTrueSchema = new Schema({
    name: String,
    image:
    {
        path: {
            type: String,
            default: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1692369756/True/no_image_patrat_pt8iod.png'
        },
        filename: {
            type: String,
            default: 'no_image_patrat_pt8iod'
        }
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    order: {
        type: Number,
        required: true
    },
    mainCat: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    product:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
        ],
})

module.exports = mongoose.model('Category', categoryTrueSchema)