const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const employeeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    cnp: {
        type: Number,
        required: true
    },
    ci: {
        serial: {
            type: String,
            required: true
        },
        number: {
            type: Number,
            reqired: true
        }
    },
    adress: {
        type: String,
        required: true
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    position: {
        type: String, 
        required: true
    }
})


module.exports = mongoose.model('Employee', employeeSchema)