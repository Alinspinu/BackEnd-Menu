const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../../utils/counter')


const entrySchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
        required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    locatie: {
      type: Schema.Types.ObjectId,
      ref: 'Locatie'
    },
    tip: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    typeOf: {
      type: String,
      enum: [
        'Incasare raport Z',
        'Incasare din banca',
        'Incasare de la administrator',
        'Altele',
        'Plata furnizor',
        'Plata catre administrator',
        'Avans',
        'Salariu',
        'Bonus vanzari',
        'Bonus excelenta',
        'Tips Card'
      ],
      requred: true
    },
    document: {
        tip: {
          type: String,
          enum: [
            'Bon fiscal',
            'Chitanta',
            'Dispozitie de plata',
            'Dispozitie de incasare',
            'Fara',
          ],
        },
        number: String
    },
    suplier: {
      type: Schema.Types.ObjectId,
      ref: 'Suplier'
    },
    user: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    index: {
        type: Number,
        index: true
    }
})




entrySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    // Get the index of the document being deleted
    const deletedIndex = this.index;
    console.log('hit something')
  
    // Recalculate indexes for remaining documents
    try {
      const documentsToUpdate = await this.constructor.find({ index: { $gt: deletedIndex }, locatie: this.locatie });
      for (const doc of documentsToUpdate) {
        doc.index -= 1;
        await doc.save();
      }
  
      console.log('Indexes recalculated successfully.');
    } catch (error) {
      console.error('Error recalculating indexes:', error);
      return next(error);
    }
  
    next(); 
  });
  
  entrySchema.pre('save', async function (next) {
    // If the document is new (not being updated)
    if (!this.isNew) {
      return next();
    }
  
    try {
      // Find the highest index in the collection
      const highestIndex = await this.constructor.findOne({locatie: this.locatie}).sort({ index: -1 }).select('index');
  
      // Set the index for the new document
      this.index = highestIndex ? highestIndex.index + 1 : 1;
    } catch (error) {
      console.error('Error setting index:', error);
      return next(error);
    }
  
    next();
  });



module.exports = mongoose.model('Entry', entrySchema)