const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const daySchema = new Schema({
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    date: {
        type: Date,
        default: function () {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            return currentDate;
        }
    },
    cashIn: {
        type: Number,
        default: 0
    },
    entry:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Entry'
            }
        ],
    cashOut: {
        type: Number,
        default: 0
    }

})


daySchema.pre('save', async function (next) {
    if (this.isModified('cashOut')) {
        let cashOutDifference;

        if (this.isNew) {
            cashOutDifference = this.cashOut;
        } else {
            const originalDocument = await this.constructor.findById(this._id);
            cashOutDifference = this.cashOut - originalDocument.cashOut;
        }
        const nextDocument = await this.constructor.findOne({locatie: this.locatie , date: { $gt: this.date } });

        if (nextDocument) {
            nextDocument.cashIn += cashOutDifference;
            await nextDocument.save();
        }
    }

    if (this.isModified('cashIn')) {
        let cashInDifference;

        if (this.isNew) {
            cashInDifference = this.cashIn;
        } else {
            const originalDocument = await this.constructor.findById(this._id);
            cashInDifference = this.cashIn - originalDocument.cashIn;
        }
        this.cashOut += cashInDifference;

        const nextDoc = await this.constructor.findOne({locatie: this.locatie,  date: { $gt: this.date } });
        if (nextDoc) {
            nextDoc.cashIn += cashInDifference;
            await nextDoc.save();
        }
    }
    next();
});



module.exports = mongoose.model('Day', daySchema)