const mongoose = require('mongoose');   
const Schema = mongoose.Schema;


const ingredientSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    labelInfo: {
        type: String,
        required: true
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

module.exports = mongoose.model('Ingredient', ingredientSchema)