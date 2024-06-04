
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const PontajSchema = new Schema({
    days: [
        {
            date: Date,
            number: Number,
            users: [
                {
                    hours: Number,
                    value: Number,
                    position: String,
                    employee: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
                    }
                }
            ],
            workValue: Number,

        }
    ],
    month: String,
    workValue: Number,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
})



module.exports = mongoose.model('Pontaj', PontajSchema);