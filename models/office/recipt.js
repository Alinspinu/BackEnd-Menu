const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../utils/counter')
const Client = require('../office/client')



const reciptSchema = new Schema({
    client: {
        name: String,
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Client'
        }
    },
    issueDate: Date,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    invoice: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Invoice'
        }
    ],
    description: String,
    value: Number,
    number: Number,
    serie: String,
    index: {
        type: Number,
        index: true
    }

})


reciptSchema.pre("save", async function (next) {
    try {
      const doc = this;
      if(doc.index > 0){
      } else {
        const counter = await Counter.findOneAndUpdate(
          { locatie: doc.locatie, model: "Recipt", },
          { $inc: { value: 1 } },
          { upsert: true, new: true }
        );
        if(counter){
           doc.index = counter.value;
        } else {
            const newCounter = new Counter({locatie: doc.locatie, model: 'Recipt', value: 1})
            await newCounter.save()
            doc.index = 1
        }
      }

          const client = await Client.findById(doc.client.customer)
          if (client) {
              const record = {
                  typeOf: 'intrare',
                  document: {
                      typeOf: 'Chitanță',
                      docId: doc.number,
                      amount: doc.value,
                  },
                  sold: client.sold,
                  date: doc.issueDate,
                  recipt: doc._id, 
                  }
              client.records.push(record)
              const sortedRecords = client.records.sort((a, b) => {
              const aDate = new Date(a.date).getTime() 
              const bDate = new Date(b.date).getTime()
              return aDate - bDate
          })
          const recordIndex = sortedRecords.findIndex(r => r.recipt.toString() === doc._id.toString());
          if (recordIndex !== -1) {
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  sortedRecords[i].sold -= doc.value;
                  console.log('hit the add loop')
              }
              client.sold = client.sold - doc.value
              client.records = sortedRecords
              await client.save();
              console.log("Client update:", client.name, 'SOLD:', client.sold);
          } else {
              console.error('ERROR record not found, Client unchanged!')
          }
         }



      next();
    } catch (error) {
      next(error);
    }
  });


  reciptSchema.pre('findOneAndDelete', async function(next){
    try{
      const doc = await this.model.findOne(this.getQuery());
      
          
      const client = await Client.findById(doc.client.customer);
      if (client) {
          const sortedRecords = client.records.sort((a, b) => {
              const aDate = new Date(a.date).getTime() 
              const bDate = new Date(b.date).getTime()
              return aDate - bDate
          })
          const recordIndex = sortedRecords.findIndex(r => r.recipt.toString() === doc._id.toString());
          if (recordIndex !== -1) {
              sortedRecords.splice(recordIndex, 1);
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  sortedRecords[i].sold += doc.value;
                  console.log('hit the delete loop')
              }
              client.sold = client.sold + doc.value
              client.records = sortedRecords
              await client.save();
              console.log('Clientul a fos actualizat', client.name, 'SOLD:', client.sold)
          } else {
          console.error('ERROR! Record not found! Suplier unchanged!')
          }
          }
  
  
        const counter = await Counter.findOneAndUpdate( 
          { locatie: doc.locatie, model: "Recipt"},
          { $inc: { value: -1 } },
          { upsert: true, new: true }
      ).exec();
      console.log(counter)
      doc.index = counter.value;
  
  
      next()
    } catch(error){
      next(error)
    }
  })

  

module.exports = mongoose.model('Recipt', reciptSchema)

