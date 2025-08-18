const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const nirInvoiceSchema = new Schema({
    currencyId: String,
    cusomer: {
        name: String,
        vatNumber: String,
    },
    supplier: {
        name: String,
        vatNumber: String,
        iban: String,
        bank: String,
    },
    dueDate: String,
    issueDate: String,
    id: String,
    invoiceNumber: String,
    products: [
        {
            name: String,
            price: Number,
            quantity: Number,
            totalNoVat: Number,
            vatPrecent: Number,
            unitCode: String
        }
    ],
    payableAmont: Number,
    prePaydAmount: Number,
    taxExclusiveAmount: Number,
    taxInclusiveAmount: Number,
    vatAmount: Number,
})




module.exports = mongoose.model('NirInvoice', nirInvoiceSchema)