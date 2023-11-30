const mongoose = require('mongoose');   
const Schema = mongoose.Schema;
const Product = require('../product/product-true');
const ProdIng = require('./prod-ingredient')


const ingredientSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    labelInfo: {
        type: String,
    },
    energy: {
        kcal: 
        {
            type: Number,
            required: true
        },
        kJ: 
        {
            type: Number,
            required: true
        },
    },
    carbs: {
        all: 
        {
            type: Number,
            required: true
        },
        sugar: 
        {
            type: Number,
            required: true
        },
    },
    salts: {
        type: Number,
        required: true
    },
    protein: {
        type: Number,
        required: true
    },
    fat: {
        all: 
        {
            type: Number,
            required: true
        },
        satAcids: 
        {
            type: Number,
            required: true
        },
    },
    additives: 
    [
        {
        name: String
        }
    ],
    allergens: 
    [
        {
        name: String
        }
    ]

})

ingredientSchema.pre('save', function(next) {
    this.additives = this.additives.filter(additive => additive.name !== "0");
    this.allergens = this.allergens.filter(allergen => allergen.name !== "0");
    next();
  });

ingredientSchema.pre('deleteOne', {document: true}, async function(next) {
    try{
        await Product.updateMany({}, { $pull: { ingredients: { ingredient: this._id } } }).exec()
        await ProdIng.updateMany({}, { $pull: { ingredients: { ingredient: this._id } } }).exec()
        next()
    } catch(err){
        console.log(err)
    }
})

module.exports = mongoose.model('Ingredient', ingredientSchema)