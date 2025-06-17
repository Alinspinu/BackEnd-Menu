const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../utils/counter')



const reciptSchema = new Schema({
    client: {
        name: String,
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Client'
        }
    },
    issueDate: Date,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    invoice: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Invoice'
        }
    ],
    description: String,
    value: Number,
    number: Number,
    serie: String,
    index: {
        type: Number,
        index: true
    }

})


reciptSchema.pre("save", async function (next) {
    try {
      const doc = this;
      if(doc.index > 0){
      } else {
        const counter = await Counter.findOneAndUpdate(
          { locatie: doc.locatie, model: "Recipt", },
          { $inc: { value: 1 } },
          { upsert: true, new: true }
        );
        if(counter){
           doc.index = counter.value;
        } else {
            const newCounter = new Counter({locatie: doc.locatie, model: 'Recipt', value: 1})
            await newCounter.save()
            doc.index = 1
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });

module.exports = mongoose.model('Recipt', reciptSchema)

