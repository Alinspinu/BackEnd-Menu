const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CounterSchema = new Schema({
  model: { type: String, required: true },
  value: { type: Number, default: 0 },
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
},
});

module.exports = mongoose.model('Counter', CounterSchema);