const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const recipeSchema = new Schema({
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
    ingredients: [
        {
            name: String,
            um: String,
            quantity: String
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
})


module.exports = mongoose.model("Recipe", recipeSchema);