const Suplier = require('../../models/office/suplier')
const Locatie = require('../../models/office/locatie')
const Table = require('../../models/utils/table')


module.exports.addSuplier = async (req, res, next) => {
 
    const {suplier} = req.body;
    const {mode} = req.query
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
   
   module.exports.sendSuplier = async (req, res, next) => {
    const loc = req.body.loc
       try{
         const userData = req.body.search;
         const suplier = await Suplier.find({locatie: loc});
         let result = suplier.filter((object) =>
         object.name.toLocaleLowerCase().includes(userData.toLocaleLowerCase())
         );      
         res.status(200).json(result);
       } catch(err){
           console.log(err)
           res.status(500).json({message: "Oups something went wrong", err: err})
       }
   }
