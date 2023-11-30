const mongoose = require('mongoose');   
const Schema = mongoose.Schema;



const howToSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    totalVolume: String,
    method: {
        name: {
            type: String,

        },
        description: String
    },
    shop: String,
    grinderStep: String,
    waterTemp: String,
    brewTime: String,
    recipent: String,
    garnish: String,
    image: {
        filename: String,
        path: String,
    },
    video: {
        type: String,
    },
    recipe: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
    }
})

module.exports = mongoose.model('HowTo', howToSchema)