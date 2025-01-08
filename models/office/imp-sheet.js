const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Ingredient = require('./inv-ingredient')



const imparimentSheetSchema = new Schema({
    date: {
        type: Date, 
        index: true
    },
    ings: [
        {   
            qty: Number,
            ing: {
                type: Schema.Types.ObjectId,
                ref: "IngredientInv"
            }
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
});


// const ImpSheet = mongoose.model('ImpSheet', imparimentSheetSchema);

imparimentSheetSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
    console.log('hit the delete one pre')
        try{
            console.log('hi the delete one pre')
            const query = this.getQuery()
            const dbSheet = await this.model.findOne(query)
                    .populate({path: 'ings.ing', select: 'productIngredient ings name price um tva'})
                if(dbSheet){
                const ingsPromises = dbSheet.ings.flatMap(ing => {
                    if(ing.ing.productIngredient){
                    return ing.ing.ings.map(ingg =>
                        Ingredient.findByIdAndUpdate(
                        ingg.ing,
                        { $inc: { qty: ingg.qty } },
                        { new: true }
                        ).exec()
                    );
                    } else {
                    return Ingredient.findByIdAndUpdate(ing.ing._id, {$inc: {qty: ing.qty}}, {new: true }).exec()
                    }
                })
                 await Promise.all(ingsPromises)
                } else{
                    console.warn('No dbSheet found for query:');
                }
            next()
        } catch(error) {
            console.error('Error in pre deleteOne hook:', error);
            next(error)
        }
})



imparimentSheetSchema.post('save', async function (doc, next) {
    try{
        await doc.populate({path: 'ings.ing', select: 'productIngredient ings name price um tva'})
        const ingsPromises = doc.ings.flatMap(ing => {
            if(ing.ing.productIngredient){
            return ing.ing.ings.map(ingg =>
                Ingredient.findByIdAndUpdate(
                ingg.ing,
                { $inc: { qty: -ingg.qty } },
                { new: true }
                ).exec()
            );
            } else {
            return Ingredient.findByIdAndUpdate(ing.ing._id, {$inc: {qty: -ing.qty}}, {new: true }).exec()
            }
        })
        await Promise.all(ingsPromises)

     next()
    } catch(error) {
        console.error('Error in post save hook:', error);
        next(error)
    }
})


module.exports = mongoose.model("ImpSheet", imparimentSheetSchema);