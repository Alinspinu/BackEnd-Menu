const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const nirInvoiceSchema = new Schema({

    currencyId: String,
    cusomer: {
        name: String,
        vatNumber: String,
    },

})






// currencyId
// : 
// "RON"
// customer
// : 
// {name: 'SLAYER CUP S.R.L.', vatNumber: 'RO44994432'}
// dueDate
// : 
// "2025-08-15"
// id
// : 
// "5462469160"
// invoiceNumber
// : 
// "5020000003025614"
// issueDate
// : 
// "2025-08-15"
// payableAmont
// : 
// 0
// prePaydAmount
// : 
// 890.2
// products
// : 
// (4) [{…}, {…}, {…}, {…}]
// supplier
// : 
// {name: 'METRO CASH & CARRY ROMANIA SRL', vatNumber: 'RO8119423'}
// taxExclusiveAmount
// : 
// 801.98
// taxInclusiveAmount
// : 
// 890.2
// vatAmount
// : 
// 88.22




module.exports = mongoose.model('NirInvoice', nirInvoiceSchema)