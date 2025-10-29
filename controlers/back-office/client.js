const Client = require('../../models/office/client')
const {round} = require('../../utils/functions')
const Invoice = require('../../models/office/invoice')



module.exports.addClient = async (req, res) => {
    const {client} = req.body
    try{
        const newClient = new Client(client)
        const savedClient = await newClient.save()
        res.status(200).json({message: 'Clientul a fost salvat cu success!', client: savedClient})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getClients = async (req, res) => {
    const {loc} = req.query
    try{
        const clients = await Client.find({locatie: loc})
        res.status(200).json(clients)
    } catch(error) {
        console.log(error)
        res.status(200).json(error)
    }
}

module.exports.editClient = async (req, res) => {
    const {client} = req.body
    try{
        const savedClient = await Client.findByIdAndUpdate(client._id, client, {new: true})
        res.status(200).json({message:'Clientu a fost editat cu success!', client: savedClient })
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
}


module.exports.getClient = async (req, res) => {
    const {id} = req.query
    try{
        const client = await Client.findById(id)
        const upc = await updateClientTotalRecord(client)
        const c = updateSuplierRecords(upc)
        const sc = await c.save()
        res.status(200).json(sc)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

   function updateSuplierRecords(suplier){
    suplier.sold = 0
    const sortedRecords = suplier.records.sort((a,b)=>+new Date(a.date)-(+new Date(b.date)));
    sortedRecords[0].sold = 0
    // if(sortedRecords[0].typeOf === 'intrare'){
    // } else {
    //     sortedRecords[0].sold = -sortedRecords[0].document.amount
    // }
    sortedRecords.forEach(r => {
            if(r.typeOf === 'intrare'){
             suplier.sold = round( suplier.sold + r.document.amount)
             r.sold = suplier.sold
            } else {
             suplier.sold = round( suplier.sold - r.document.amount)
             r.sold = suplier.sold
            }
        })
        suplier.record = sortedRecords
      return suplier
   }

   async function updateClientTotalRecord(client) {
    // Loop through all records and update their amounts
    for (const r of client.records) {
      const inv = await Invoice.findById(r.Invoice)
      if (inv) {
        r.document.amount = inv.taxInclusiveAmount
      }
    }
  
    // // Ensure Mongoose knows the records array changed
    // client.markModified('records')
  
    // Save once after all updates
   const c = await client.save()
   return c
  }


module.exports.deleteClient = async (req, res) => {
    const {id} = req.query
    try{
        await Client.findByIdAndDelete(id)
        res.status(200).json({message: 'Clientul a fost șters cu succes!'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}


   module.exports.addRecord = async (req, res) => {
    const {clientId, record} = req.body
    try{
        let sum = record.document.amount
        const client = await Client.findById(clientId)
        if(client){
            record.sold = client.sold 
            client.records.push(record)
            const sortedRecords = client.records.sort((a, b) => {
                const aDate = new Date(a.date).getTime() 
                const bDate = new Date(b.date).getTime()
                return aDate - bDate
            })
            const recordIndex = sortedRecords.findIndex(r => 
                r.document.docId === record.document.docId && 
                r.document.amount === record.document.amount && 
                r.document.typeOf === record.document.typeOf
            );
            if (recordIndex !== -1) {
                if(record.typeOf === 'iesire'){
                    for (let i = recordIndex; i < sortedRecords.length; i++) {
                        sortedRecords[i].sold += sum;
                    }
                    client.sold = client.sold + sum
                    client.records = sortedRecords
                } else {
                    for (let i = recordIndex; i < sortedRecords.length; i++) {
                        sortedRecords[i].sold -= sum;
                    }
                    client.sold = client.sold - sum
                    client.records = sortedRecords
                }
                await client.save();
                res.status(200).json({message: 'Inregistrare reusita!'})
            } else {
                res.status(200).json({message: 'Intrarea nu a fost inregistrată corect!'})
            }
        } else {
            res.status(404).json({message: 'Furnizorul nu a fost găsit!'})
        }
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
   }


   module.exports.updateClientRecords = async (req, res) => {
    const {id, record} = req.body
    try{

       const client = await Client.findByIdAndUpdate(id, {$push: {records: record}}, {new: true})
        if(!client){
            res.status(404).json({message: 'Furnizorul nu a fost găsit!'})
        } else {
            res.status(200).json({message: 'Inregistrare reusita!', suplier: client})
        }
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }

   }


   
   module.exports.removeRecord = async (req, res) => {
    const {clientId, docId, amount} = req.body
    try{
        const client = await Client.findById(clientId);
            if (client) {
                const sortedRecords = client.records.sort((a, b) => {
                    const aDate = new Date(a.date).getTime() 
                    const bDate = new Date(b.date).getTime()
                    return aDate - bDate
                })
                const recordIndex = sortedRecords.findIndex(r => r._id.toString() === docId.toString());
                if (recordIndex !== -1) {
                    const record = sortedRecords[recordIndex]
                    sortedRecords.splice(recordIndex, 1);
                    if(record.typeOf === 'iesire'){
                        for (let i = recordIndex; i < sortedRecords.length; i++) {
                            sortedRecords[i].sold -= amount;
                        }
                        client.sold = client.sold - amount
                        client.records = sortedRecords
                    } else {
                        for (let i = recordIndex; i < sortedRecords.length; i++) {
                            sortedRecords[i].sold += amount;
                        }
                        client.sold = client.sold + amount
                        client.records = sortedRecords
                    }
                    await client.save();
                }

             res.status(200).json({ message: 'Record removed!' });

            } else {

              res.status(404).json({ message: 'Clientul nu a fost găsit!' });
            }

    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
   }