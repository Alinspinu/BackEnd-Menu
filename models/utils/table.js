const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Counter = require('./counter')

const tableSchema = new Schema({
    index: {
        type: Number,
        index: true
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    name: String,
    bills: [
        {
            type: Schema.Types.ObjectId,
            ref: "Order"
        }
    ],
    salePoint: {
      type: Schema.Types.ObjectId,
      ref: 'SalePoint'
    },
    area: {
      type: Schema.Types.ObjectId,
      ref: 'Area'
    }    
})


const areaSchema = new Schema({
      name: String,
      locatie: {
            type: Schema.Types.ObjectId,
            ref: 'Locatie'
      },
      salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      },
      clients: {
        type: Boolean,
        default: false
      },
      tables: [
        {
            type: Schema.Types.ObjectId,
            ref: "Table"
        }
    ],
})

tableSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    // Get the index of the document being deleted
    const deletedIndex = this.index;
  
    // Recalculate indexes for remaining documents
    try {
      const documentsToUpdate = await this.constructor.find({ index: { $gt: deletedIndex } , locatie: this.locatie, salePoint: this.salePoint, area: this.area});
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
  
  tableSchema.pre('save', async function (next) {
    // If the document is new (not being updated)
    if (!this.isNew) {
      return next();
    }
  
    try {
      // Find the highest index in the collection
      const highestIndex = await this.constructor.findOne({locatie: this.locatie, salePoint: this.salePoint, area: this.area}).sort({ index: -1 }).select('index');
  
      // Set the index for the new document
      this.index = highestIndex ? highestIndex.index + 1 : 1;
    } catch (error) {
      console.error('Error setting index:', error);
      return next(error);
    }
  
    next();
});

const Table =  mongoose.model('Table', tableSchema)
const Area = mongoose.model('Area', areaSchema)

module.exports = {
  Table,
  Area
}