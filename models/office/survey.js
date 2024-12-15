const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const surveySchema = new Schema({
    departaments: [
        {
            name: String,
            tasks: [
                {
                    name: String,
                    check: String,
                }
            ],
            obs: String, 
        }
    ],
    generalObs: [String],
    supervisor: {
        name: String,
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    employees: [
        {
            name: String,
            position: String,
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }

}, {timestamps: true})


module.exports = mongoose.model("Survey", surveySchema);