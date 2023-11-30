const mongoose = require('mongoose');   
const Schema = mongoose.Schema;
const HowTo = require('./how-to');

const recipeSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'ProductTrue'
    },
    ingredients: 
    [
      {
        recipeIngredient: {
            quantity: Number,
            um: String,
            price: Number,
            ingredient: {
                type: Schema.Types.ObjectId,
                ref: 'Ingredient'
            },
      }
    }  
    ],
    productIngredients: 
    [
        {
            recipeProductIngredient: {
                quantity: Number,
                um: String,
                price: Number,
                productIngredient: {
                    type: Schema.Types.ObjectId,
                    ref: 'ProdIngredient'
                },
          }
        }
    ], 
    howTo: {
        type: Schema.Types.ObjectId,
        ref: 'HowTo'
    }
})

recipeSchema.pre('deleteOne', {document: true}, async function(next) {
    try{
        await HowTo.deleteOne({_id: this.howTo}).exec()
        next()
    } catch(err){
        console.log(err)
    }
})

module.exports = mongoose.model('Recipe', recipeSchema)