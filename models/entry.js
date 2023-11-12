const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../models/counter')


const entrySchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    tip: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    index: {
        type: Number,
        index: true
    }
})

// entrySchema.pre("save", async function (next) {
//     try {
//         const doc = this;
//         const counter = await Counter.findOneAndUpdate(
//             { model: "Entry" },
//             { $inc: { value: 1 } },
//             { upsert: true, new: true }
//         ).exec();

//         doc.index = counter.value;
//         next();
//     } catch (error) {
//         next(error);
//     }
// });



entrySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  // Get the index of the document being deleted
  const deletedIndex = this.index;

  // Recalculate indexes for remaining documents
  try {
    const documentsToUpdate = await this.constructor.find({ index: { $gt: deletedIndex } });

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
//   if (!this.isNew) {
//     return next();
//   }

  try {
    // Find the highest index in the collection
    const highestIndex = await this.constructor.findOne().sort({ index: -1 }).select('index');

    // Set the index for the new document
    this.index = highestIndex ? highestIndex.index + 1 : 1;
  } catch (error) {
    console.error('Error setting index:', error);
    return next(error);
  }

  next();
});



module.exports = mongoose.model('Entry', entrySchema)