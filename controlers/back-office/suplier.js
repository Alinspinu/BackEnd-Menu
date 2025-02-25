const Suplier = require('../../models/office/suplier')
const Locatie = require('../../models/office/locatie')
const Table = require('../../models/utils/table')


module.exports.addSuplier = async (req, res, next) => {
    const {suplier} = req.body;
    const {mode} = req.query
    delete suplier._id
    try{
       if(mode === 'enrol') {
        const check = await Locatie.findOne({vatNumber: suplier.vatNumber})
        if(check){
            return res.status(401).json({message: "Codul fiscal este deja inregistrat in baza de date contactati echipa de suport alin@flowmanager.ro"})
        } else {
            const newLocation = new Locatie(suplier) 
             const loc = await newLocation.save()
             const table = new Table({
                index: 1,
                locatie: loc._id
             })
            await table.save()
            res.status(200).json({message: `Locatia ${newLocation.name} a fost salvată cu success!`, id: loc._id})
        }
       } else {
        const check = await Locatie.findOne({vatNumber: suplier.vatNumber})
            if(check){
                return res.status(200).json({message: `Furnizorul ${check.name} exista in baza de date!`, suplier: check})
            } else {
                const loc = req.body.loc
                 const newSuplier = new Suplier(suplier);
                 newSuplier.name = suplier.bussinessName
                 newSuplier.locatie = loc
                 await newSuplier.save();
                 res.status(200).json({message: `Furnizorul ${newSuplier.name} a fost salvat cu success!`, suplier: newSuplier})
            }
       }
    } catch(err){
       console.log(err)
       res.status(500).json({message: "Oups something went wrong!", err: err})
    }
   }

   module.exports.addSold = async (req, res) => {
    try{

        const supliers = await Suplier.find({locatie: "655e2e7c5a3d53943c6b7c53"})
        for(let suplier of supliers) {
                for(let record of suplier.records){
                    record.sold = 0
                }
            const sup =  await suplier.save()
            console.log(`furnizorul ${sup.name} afost actualizat`)
        }
        res.status(200).json({message: 'furnozorii au fost actualizati'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
   }
   
   module.exports.sendSuplier = async (req, res, next) => {
    const loc = req.body.loc
       try{
         const supliers = await Suplier.find({locatie: loc});     
         res.status(200).json(supliers);
       } catch(err){
           console.log(err)
           res.status(500).json({message: "Oups something went wrong", err: err})
       }
   }



   module.exports.addRecord = async (req, res) => {
    const {suplierId, record} = req.body
    try{
        let sum = record.document.amount
        const sup = await Suplier.findById(suplierId).select('sold name')
        if(record.typeOf === 'iesire'){
            sum = - record.document.amount
            record.sold = sup.sold - record.document.amount
        } else {
            record.sold = sup.sold + record.document.amount
        }
        const suplier = await Suplier.findByIdAndUpdate(
            suplierId,  
            { 
                $push: { records: record },
                $inc: { sold: sum } 
            },
            { new: true, useFindAndModify: false })
        if(!suplier){
            res.status(404).json({message: 'Furnizorul nu a fost găsit!'})
        } else {
            res.status(200).json({message: 'Inregistrare reusita!'})
        }
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
   }


   module.exports.updateSuplierRecords = async (req, res) => {
    const {id, records} = req.body
    try{
       const suplier = await Suplier.findByIdAndUpdate(id, {$set: {records: records}}, {new: true})
        if(!suplier){
            res.status(404).json({message: 'Furnizorul nu a fost găsit!'})
        } else {
            res.status(200).json({message: 'Inregistrare reusita!', suplier: suplier})
        }
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }

   }


   
   module.exports.removeRecord = async (req, res) => {
    const {suplierId, docId, amount} = req.body
    try{
        const suplier = await Suplier.findById(suplierId);
            if (suplier) {
                const recordIndex = suplier.records.findIndex(r => r.document.docId.toString() === docId.toString());
                conole.log('Rcord index', recordIndex)
                if (recordIndex !== -1) {
                    suplier.records.splice(recordIndex, 1);
                    for (let i = recordIndex; i < suplier.records.length; i++) {
                        suplier.records[i].sold -= amount;
                    }
                    suplier.sold = suplier.sold - amount
                    await suplier.save();
                }

             res.status(200).json({ message: 'Record removed!' });

            } else {

              res.status(404).json({ message: 'Furnizorul nu a fost găsit!' });
            }

    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
   }


   module.exports.getSupliers = async (req, res) => {
    const {loc} = req.query
    try{
        const supliers = await Suplier.find({locatie: loc}).select('-records')
        res.status(200).json(supliers)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
   }

   
   module.exports.getSuplier = async (req, res) => {
        const {suplierId} = req.query
    try{
        const suplier = await Suplier.findById(suplierId)
        if(suplier){
            res.status(200).json(suplier)
        } else {
            res.status(404).json({message: 'Furnizorul nu a fost găsit'})
        }
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
   }

   module.exports.deleteSuplier = async (req, res) => {
    const {suplierId} = req.query
    try{
        await Suplier.findByIdAndDelete(suplierId)
        res.status(200).json({message: 'Furnizorul a fost șters cu succes!'})
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
   }

   module.exports.editSuplier = async (req, res) => {
    const {suplierId, update} = req.body
    try{
        const newSuplier = await Suplier.findByIdAndUpdate(suplierId, update, {new: true})
        res.status(200).json({message: `Furnizorul ${newSuplier.name} a fost actualizat!`, suplier: newSuplier})
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
   }