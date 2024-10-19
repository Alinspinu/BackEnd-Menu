
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
                    },
                    employee: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
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
    }
})



module.exports = mongoose.model('Shedule', SheduleSchema);