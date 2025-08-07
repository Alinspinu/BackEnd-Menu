
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const EmployeePositionSchema = new Schema({
    name: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    colorLight: String,
    colorNight: String,

})



module.exports = mongoose.model('EmployeePosition', EmployeePositionSchema);