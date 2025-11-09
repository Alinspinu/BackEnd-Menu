const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const nirInvoiceSchema = new Schema({
    currencyId: String,
    cusomer: {
        name: String,
        vatNumber: String,
        registration: String,
        address: String,
        city: String,
        iban: String,
        bank: String,
    },
    supplier: {
        name: String,
        vatNumber: String,
        registration: String,
        address: String,
        city: String,
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
            description: String,
            price: Number,
            quantity: Number,
            totalNoVat: Number,
            vatPrecent: Number,
            unitCode: String,
            discountPerUnit: Number,     
            discountTotal: Number,       
            discountPercent: Number,
        }
    ],
    payableAmont: Number,
    prePaydAmount: Number,
    taxExclusiveAmount: Number,
    taxInclusiveAmount: Number,
    vatAmount: Number,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
})




module.exports = mongoose.model('NirInvoice', nirInvoiceSchema)