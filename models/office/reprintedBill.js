const mongoose = require("mongoose");
const Schema = mongoose.Schema;





const reprintBillSchema = new Schema({
    fiscal: {
        type: Boolean,
        required: true
    },
    bill: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }


},{ timestamps: true, })
 




module.exports = mongoose.model('RepBill', reprintBillSchema);