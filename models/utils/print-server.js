const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const printServerSchema = new Schema({
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },
    name: {
        type: String,
        required: true
    },
    key: {
        type: String, 
        required: true
    },
    status: {
        type: Boolean,
        default: true, 
    },
    fiscalPrinter: {
        name: String,
        brand: String,
        model: String,
        driver: {
            type: String,
            enum: ['FiscalNet'],
            default: 'FiscalNet'
        },
        driverAddress: String,
        orders: Boolean,
        section: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Section'
            }
        ]
    },
    thermalPrinters: [
        {
            name: String,
            brand: String,
            ip: String,
            port: Number,
            invoice: {
                type: Boolean,
                default: false
            },
            section: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Section'
                }
            ]
        }
    ]
});

module.exports = mongoose.model('PrintServer', printServerSchema);