const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const productIngredientSchema = new Schema({
    name: String,
    ingredients: [
        {   quantity: {
                type: String,
                required: true
            },
            ingredient: {
                type: Schema.Types.ObjectId,
                ref: 'Ingredient'
            }
        }
    ]
})

module.exports = mongoose.model('ProdIngredient', productIngredientSchema)