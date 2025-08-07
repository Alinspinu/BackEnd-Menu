
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user')



const employeePositionSchema = new Schema({
    name: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    colorLight: String,
    colorNight: String,
    order: Number,
    shedule: Boolean,
    pontaj: Boolean,

})




employeePositionSchema.pre('findOneAndDelete', async function(next) {
    const filter = this.getFilter(); 
    const id = filter._id   
    await User.updateMany({client: false, employee: {$exists: true}, 'employee.employeePosition': id }, {$set: {'employee.employeePosition': undefined} })
    next();
  });


module.exports = mongoose.model('EmployeePosition', employeePositionSchema);