
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
                        employeePosition: {
                            type: Schema.Types.ObjectId,
                            ref: 'EmployeePosition'
                        },
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
    colors: {
        concediu: {
            day: {
                type: String,
                defalut: 'rgb(19, 82, 116)'
            },
            night:  {
                type: String,
                defalut: 'rgb(10, 41, 58)'
            }
        },
        liber:{
            day: {
                type: String,
                defalut: 'rgb(71, 71, 71)'
            },
            night:  {
                type: String,
                defalut: 'rgb(78, 78, 78)'
            }
        },
        medical: {
            day: {
                type: String,
                defalut: 'rgb(232, 41, 41)'
            },
            night:  {
                type: String,
                defalut: 'rgb(67, 15, 15)'
            }
        }
    },
    periods: [
        {
            label: String,
            hourStart: Number,
            hourEnd: Number,
            period: Number,
            pm: {
                type: Boolean,
                default: false
            }
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