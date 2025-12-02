const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const eventSchema = new Schema({
    date: {
        type: Date, 
        index: true
    },

    dateLabel: {
        type: String,
    },

    description:{
        type: String
    },

    eventUrl: {
        type: String,
    },

    name: {
        type: String,
    },
    
    reservations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Reservation'
        }
    ],

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      }
});


module.exports = mongoose.model("Event", eventSchema);