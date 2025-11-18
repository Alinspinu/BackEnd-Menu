const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const reservationSheduleSchema = new Schema({

    salePoint:{
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    year: {
        date: {
            type: Date,
            required: true
        },
        months: [
            {
                date: {
                    type: Date,
                    required: true,
                },
                days: [
                    {
                        date: {
                            type: Date,
                            required: true,
                        },
                        avalableTables: {
                            type: Number,
                            default: 0
                        },
                        bookedTables:  {
                            type: Number,
                            default: 0
                        },
                        people:  {
                            type: Number,
                            default: 0
                        },
                        reservations: [
                            {
                                start: {
                                    type: Date,
                                    required: true
                                }, 
                                end: {
                                    type: Date,
                                    requred: true
                                },
                                details:{
                                    type: Schema.Types.ObjectId,
                                    ref: 'Reservation' 
                                } 
                            }
                        ]
                    }
                ],
            }
        ],
    }

})




module.exports = mongoose.model("ReservationShedule", reservationSheduleSchema);