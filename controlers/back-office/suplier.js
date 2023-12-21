const Suplier = require('../../models/office/suplier')


module.exports.addSuplier = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
    const {suplier} = req.body;
    const {personal} = req.query
    try{
       if(personal === 'true') {
           const newLocation = new Locatie(suplier) 
           await newLocation.save()
           res.status(200).json({message: `Locatia ${newLocation.name} a fost salvată cu success!`})
       } else {
           const newSuplier = new Suplier(suplier);
           newSuplier.name = suplier.bussinessName
           newSuplier.locatie = loc
           await newSuplier.save();
           res.status(200).json({message: `Furnizorul ${newSuplier.name} a fost salvat cu success!`, suplier: newSuplier})
       }
    } catch(err){
       console.log(err)
       res.status(500).json({message: "Oups something went wrong!", err: err})
    }
   }
   
   module.exports.sendSuplier = async (req, res, next) => {
    const loc = '655e2e7c5a3d53943c6b7c53'
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
