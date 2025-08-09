
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
                default: '#135274' 
            },
            night: {
                type: String,
                default: '#0A293A' 
            }
        },
        liber: {
            day: {
                type: String,
                default: '#474747'
            },
            night: {
                type: String,
                default: '#4E4E4E' 
            }
        },
        medical: {
            day: {
                type: String,
                default: '#E82929' 
            },
            night: {
                type: String,
                default: '#430F0F' 
            }
        }
    },
    periods: [
        {
            label: String,
            hourStart: String,
            hourEnd: String,
            period: Number,
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