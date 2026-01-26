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
                type: Schema.Types.ObjectId,
                ref: 'RessMonth' 
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
            ref: 'ResSchedule'
        },
        locatie: {
            type: Schema.Types.ObjectId,
            ref: 'Locatie'
        },

        days: [
            {
                type: Schema.Types.ObjectId,
                ref: 'RessDay' 
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
            ref: 'RessHour' 
        }
    ],

    shedule: {
        type: Schema.Types.ObjectId,
        ref: 'ResSchedule'
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
    people:  {
        type: Number,
        default: 0
    },
    visible: {
        type: Boolean
    },

    shedule: {
        type: Schema.Types.ObjectId,
        ref: 'ResSchedule'
    },
    quarters: [
        {
            type: Schema.Types.ObjectId,
            ref: 'RessQuarter' 
        }
    ],
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
        ref: 'ResSchedule'
    },

    reservations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Reservation' 
        }
    ]
})



const RessQuarter = mongoose.model('RessQuarter', quarterSchema)
const RessHour = mongoose.model('RessHour', hourSchema);
const RessDays = mongoose.model('RessDay', daySchema);
const RessMonth = mongoose.model('RessMonth', monthSchema);
const ResSchedule = mongoose.model('ResSchedule', reservationSheduleSchema);

module.exports = {
  RessQuarter,
  RessHour,
  RessDays,
  RessMonth,
  ResSchedule
};