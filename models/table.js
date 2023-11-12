const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Counter = require('./counter')

const tableSchema = new Schema({
    index: {
        type: Number,
        index: true
    },
    name: String,
    bills: [
        {
            type: Schema.Types.ObjectId,
            ref: "OrderTrue"
        }
    ]    

})

tableSchema.pre("save", async function (next) {
    try {
        const doc = this;
        const counter = await Counter.findOneAndUpdate(
            { model: "Table" },
            { $inc: { value: 1 } },
            { upsert: true, new: true }
        ).exec();

        doc.index = counter.value;
        next();
    } catch (error) {
        next(error);
    }
});


module.exports = mongoose.model('Table', tableSchema)