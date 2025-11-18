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
        bookedTables:  {
            type: Number,
            default: 0
        },
        people:  {
            type: Number,
            default: 0
        },
        months: [
            {
                date: {
                    type: Date,
                    required: true,
                },
                bookedTables:  {
                    type: Number,
                    default: 0
                },
                people:  {
                    type: Number,
                    default: 0
                },

                days: [
                    {
                        label: Number,
                        date: {
                            type: Date,
                            required: true,
                        },
                        bookedTables:  {
                            type: Number,
                            default: 0
                        },
                        people:  {
                            type: Number,
                            default: 0
                        },
                        hours: [
                            {
                                label: String,
                                avalableTables: {
                                    type: Number,
                                    default: 0
                                },
                                seats: {
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
                                start: {
                                    type: Date,
                                    required: true
                                }, 
                                end: {
                                    type: Date,
                                    requred: true
                                },
                                visible: {
                                    type: Boolean
                                },
                                reservations: [
                                    {
                                        type: Schema.Types.ObjectId,
                                        ref: 'Reservation' 
                                    }
                                ]
                            }
                            
                        ],
                
                    }
                ],
            }
        ],
    }

})




module.exports = mongoose.model("ReservationSchedule", reservationSheduleSchema);