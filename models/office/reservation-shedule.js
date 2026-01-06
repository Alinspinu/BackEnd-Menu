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
    temp: {
        type: Boolean,
        default: false
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
                type: Schema.Types.ObjectId,
                ref: 'ResMonth' 
            }
        ],
    }

})



const monthSchema = new Schema({
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

        salePoint:{
            type: Schema.Types.ObjectId,
            ref: 'SalePoint'
        },
        shedule: {
            type: Schema.Types.ObjectId,
            ref: 'ReservationSchedule'
        },
        locatie: {
            type: Schema.Types.ObjectId,
            ref: 'Locatie'
        },

        days: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ResDay' 
            }
        ],
    
})


const daySchema = new Schema(            {
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

    salePoint:{
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },

    hours: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ResHour' 
        }
    ],

    shedule: {
        type: Schema.Types.ObjectId,
        ref: 'ReservationSchedule'
    }

})


const hourSchema = new Schema({
    salePoint:{
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
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
    full: {
       type: Boolean,
       default: false   
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

    shedule: {
        type: Schema.Types.ObjectId,
        ref: 'ReservationSchedule'
    },

    reservations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Reservation' 
        }
    ]
})

const quarterSchema = new Schema({
    salePoint:{
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
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
    full: {
       type: Boolean,
       default: false   
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

    shedule: {
        type: Schema.Types.ObjectId,
        ref: 'ReservationSchedule'
    },

    reservations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Reservation' 
        }
    ]
})




const ResHour = mongoose.model('ResHour', hourSchema);
const ResDays = mongoose.model('ResDay', daySchema);
const ResMonth = mongoose.model('ResMonth', monthSchema);
const ReservationSchedule = mongoose.model('ReservationSchedule', reservationSheduleSchema);

module.exports = {
  ResHour,
  ResDays,
  ResMonth,
  ReservationSchedule
};