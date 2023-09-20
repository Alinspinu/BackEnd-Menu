const mongoose = require('mongoose');   
const Schema = mongoose.Schema;

const recipeSchema = new Schema({
    ingredients: 
    [
        {
            quantity: {
                type: Number,
                required: true
            },
            ingredient: {
                type: Schema.Types.ObjectId,
                ref: 'Ingredient'
            }
        }
    ],
    recipes: 
    [
        {
            quantity: {
                type: Number,
                required: true
            },
            recipe: {
                type: Schema.Types.ObjectId,
                ref: 'Recipe'
            }
        }
    ]
})

module.exports = mongoose.model('Recipe', recipeSchema)