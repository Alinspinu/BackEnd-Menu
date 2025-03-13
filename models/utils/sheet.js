const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Ingredient = require('../../models/office/inv-ingredient')

const SheetSchema = new Schema({
  date: {
    type: Date,
  },
  ings: [
    {
        qty: Number,
        ing: {
            type: Schema.Types.ObjectId,
            ref: 'IngredientInv'
        }
    }
  ],

  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
}

});


SheetSchema.pre('save', async function (next){
    const doc = this;

    try{
        const promises = doc.ings.map((el) => {
            return Ingredient.findByIdAndUpdate(
              el.ing,
              {
                $inc: {qty: -el.qty},
              },
              { upsert: true, new: true }
            ).exec();
          });
      
          const results = await Promise.all(promises)
    
          next()
    } catch(error) {
        next(error)
    }
})


SheetSchema.pre('deleteOne', { document: true, query: false }, async function(next){
    const doc = this;

    try{
        const promises = doc.ings.map((el) => {
            return Ingredient.findByIdAndUpdate(
              el.ing,
              {
                $inc: {qty: el.qty},
              },
              { upsert: true, new: true }
            ).exec();
          });
      
          const results = await Promise.all(promises)
    
          next()
    } catch(error) {
        next(error)
    }
})

module.exports = mongoose.model('Sheet', SheetSchema);