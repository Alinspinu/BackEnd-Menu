const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../utils/counter')


const reservationSchema = new Schema({
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie',
        index: true
    },
    index: {
        type: Number,
        index: true
    },
    client: {
        telephone: {
            type: String,
            index: true,
            required: true,
        },
        name: {
            type: String,
            required: true
        }, 
        email: {
            type: String
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    eventId: String,
    date: Date,
    dateString: String,
    guests: Number,
    kids: Number,
    start: String,
    end: String,
    period: String,
    position: String,
    details: String,
    notified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['new', 'accepted', 'canceled', 'pending',  'done']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      },

    resHour: [
        {
        type: Schema.Types.ObjectId,
        ref: 'ResHour'
        }
    ] 

}, {timestamps: true})


reservationSchema.pre('save', async function (next) {
    try {
      if (!this.isNew) {
        return next();
      }
  
      const counter = await Counter.findOneAndUpdate(
        {
          locatie: this.locatie,
          model: "Reservation",
          salePoint: this.salePoint
        },
        {
          $inc: { value: 1 }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
  
      this.index = counter.value;
  
      next();
    } catch (err) {
      console.error('Eroare rezervare pre-save hook:', err);
      next(err);
    }
  });


module.exports = mongoose.model("Reservation", reservationSchema);