
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = ('../utils/counter')



const SheduleSchema = new Schema({
    days: [
        {
            date: Date,
            day: String,
            users: [
                {
                    workPeriod: {
                        start: Date,
                        end: Date,
                        hours: Number,
                        position: String,
                        concediu: Boolean,
                        medical: Boolean,
                        freePayd: Boolean,
                    },
                    employee: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
                    },
                    checkIn: {
                        type: Boolean,
                        default: false
                    }
                }
            ],
            workValue: Number,
        }
    ],
    period: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      }
})



module.exports = mongoose.model('Shedule', SheduleSchema);