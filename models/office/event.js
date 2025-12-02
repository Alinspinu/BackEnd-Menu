const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const eventSchema = new Schema({
    start: {
        type: Date, 
        index: true
    },

    end: {
        type: Date, 
        index: true
    },

    description:{
        type: String
    },

    eventUrl: {
        type: String,
    },

    status: {
        type: String
    },

    poster:{
        path: {
            type: String,
        },
        filename: {
            type: String,
        },
    },

    price: {
        type: Number
    },

    seats: {
        type: Number
    },

    people: {
        type: Number
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