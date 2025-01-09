
const Nir = require('../../models/office/nir')
const ImpSheet = require('../../models/office/imp-sheet')
const Report = require('../../models/office/report');
const Ingredient = require('../../models/office/inv-ingredient')




module.exports.addImpSheet = async (req, res) => {
    try{
      const {sheet} = req.body
      const newSheet = new ImpSheet(sheet)
      const savedSheet = await newSheet.save()
      const dbSheet = await ImpSheet.findById(savedSheet._id)
            .populate({path: 'ings.ing', select: 'productIngredient ings name price um tva'})
            .populate({path: 'user', select: 'employee.fullName'})
      if(dbSheet){
        res.status(200).json({message: "Fișa a fost savată cu succes!", sheet: dbSheet})
      } else{
        res.status(200).json({message: 'Fișa nu a fost găsită în baza de date dupa salvare!'})
      }
    } catch(error){
      console.log(error)
      res.status(500).json(error)
    }
}

module.exports.deleteSheet = async (req, res) => {
  try{
    const {id} = req.query;
     await ImpSheet.deleteOne({_id: id}) 
    res.status(200).json({message: 'Fișa a fost ștearsă cu success!'})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.getSheets = async (req, res) => {
    try{
        const {loc} = req.query
        const sheets = await ImpSheet.find({locatie: loc})
        .limit(30)
        .populate({path: 'ings.ing', select: 'name price um tva'})
        .populate({path: 'user', select: 'employee.fullName'})
        const sortedSheets = sheets.sort((a,b) => {
          const aDate = new Date(a.date).getTime()
          const bDate = new Date(b.date).getTime()
          return bDate - aDate
        })
    res.status(200).json(sortedSheets)
    } catch(error){
      console.log(error)
    }
}


module.exports.getSheetsByPeriod = async (req, res) => {
  try{
    const {startDate, endDate, loc} = req.query
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()
    const sheets = ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: endTime}}) 
    res.status(200).json(sheets)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.saveNir = async( req, res, next) => {
    const {nir, loc} = req.body;
    delete nir._id
   if( nir.documentDate === null ) {
    nir.documentDate = new Date(Date.now())
   }
   try{
      const newNir = new Nir(nir)
      newNir.suplier = nir.suplier._id
      newNir.locatie = loc
      const savedNir = await newNir.save()
      const dbNir = await Nir.findById(savedNir._id).populate({path: 'suplier', select: 'name'})
      res.status(200).json({ message: "Documentul a fost salvat cu success!", nir: dbNir });
    // }
    
    } catch (err) {
      console.log(err)
      res.status(500).json({message: err.message})
    }       
}


module.exports.updateIngsLogs = async (req, res) => {
  try{
    const date =  new Date(2024, 7, 1)
     await Report.deleteMany({day: {$gte: date}})
        .then(result => {
          console.log(`${result.deletedCount} documents deleted`);
          res.status(200)
        })
        .catch(error => {
          console.error('Error deleting documents:', error);
        });
  }catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.getNirsBySuplier = async (req, res, next) => {
  try{
    const {id} = req.query
    const nirs = await Nir.find({suplier: id})
        .sort({ createdAt: -1 })
        .limit(30)
        .populate({path: 'suplier'})
    res.status(200).json(nirs)
  } catch(error){
    console.log(error)
    res.status(500).json({message: error.message})
  }
}




module.exports.deleteNir = async (req, res, next) => {
  try{
    const {id} = req.query
    const nirToDelete = await Nir.findById(id)
    await nirToDelete.deleteOne()
    res.status(200).json({message: 'Nirul a fost sters!'})
  } catch(err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}


module.exports.deleteNirs = async (req, res, next) => {
  try{
    const {ids} = req.body

    const deletePromises = ids.map(async id => {
      const doc = await Nir.findById(id);
      if (doc) {
        return doc.deleteOne();
      }
      return null;
    });
    
    const results = await Promise.all(deletePromises);
    console.log('All documents deleted:', results);

    res.status(200).json({message: 'Documentele au fost șterse!'})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.payBill = async (req, res, next) => {
  const {update, id, type} = req.body
  let tip = update ? 'Platită' : 'Neplătită'
  let method = update ? type : ''
  const up = { payd: update, type: type };
  try{
    const updatedNirs = await Promise.all(
      id.map(id => Nir.findByIdAndUpdate(id, up, { new: true }).populate({ path: 'suplier' }))
    );
    res.status(200).json({message: `Factura / facturile la fost marcata ${tip}  ${method}`, nirs: updatedNirs })
  res.status(200)
  } catch (err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}


module.exports.getNirs = async(req, res, next) => {
  const loc = req.body.loc
  try{
    const nirs = await Nir.find({locatie: loc})
          .sort({ createdAt: -1 })
          .limit(100)
          .populate({path: 'suplier'})
          
    res.status(200).json(nirs)
  } catch(err) {
    console.log(err)
    res.status(500).json({messahe: err.message})
  }
}



module.exports.getNirsByDate = async (req, res, next) => {
  try{
    const {loc, startDate, endDate} = req.body
    const start = new Date(startDate)
    const end = new Date(endDate)
    const nirs = await Nir.find({locatie: loc, documentDate: {$gte: start, $lte: end}}).populate({path: 'suplier'})
    res.status(200).json(nirs)
  }catch(err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}


module.exports.getNir = async (req, res, next) => {
  
  try{
    const {id} = req.query
    const nir = await Nir.findById(id).populate({path: 'suplier'})
    res.status(200).json({nir: nir})
  } catch (err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}

module.exports.paySuplierBill = async (req, res, next) => {
  try{
    const {id} = req.body
    const nirs = await Nir.updateMany({suplier: id}, {payd: true, type: 'bank'}, {new: true}).populate({path: 'suplier'})
    res.status(200).json()
  } catch (err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}

module.exports.addEFacturaID = async (req, res, next) => {
  try{
    const {nirId, id} = req.body
    console.log(id)
    const nir = await Nir.findByIdAndUpdate(nirId, {eFacturaId: id}, {new: true})
    res.status(200).json(nir)
  } catch(error){
    console.log(error)
  }
}


// module.exports.fixBuleala = async (req, res) => {
//   const names = [
//     'Croissant cu unt', 
//     'Croissant cu fistic', 
//     'Croissant cheesecake', 
//     'Croissant cu ciocolata', 
//     'Croissant cu vanilie', 
//     'Croissant tiramisu',
//     'Croissnat cu unt productie',
//     'Croissant sacher',
//     'Croissant foret noir'
//   ]
//   try{
//     const ingredients = await Ingredient.find({locatie: '655e2e7c5a3d53943c6b7c53', name: {$in: names}})

//     for (let ing of ingredients) {
//       for (let i = 0; i < ing.uploadLog.length; i++) {
//         const log = ing.uploadLog[i];
//         if (!log.operation?.details) continue; 
    
//         const marker = log.operation.details.slice(-7, -6); 
//         if (marker === '2' && log.operation.name === 'intrare') {
//           ing.uploadLog.splice(i, 1);
//           i--; 
//         }
//       }
    
//       await ing.save(); // Save the modified ingredient
//     }
//     res.status(200).json({message: 'all done :)'})

//   } catch(error){
//     console.log(error)
//   }
// }








// module.exports.getSheet = async (req, res) => {
//   try{
//     const { date, loc } = req.query
//     const sheet = ImpSheet.findOne({date: date, locatie, loc})
//     res.status(200).json(sheet)
//   } catch(error) {
//     console.log(error)
//     res.status(500).json(error)
//   }
// }






// module.exports.updateIngsLogs = async (re, res) => {
//   try{

//     const startDate = new Date(2024, 7, 1)
//     const nirs = await Nir.find({documentDate: {$gte: startDate}})
//     const TIME_DIFFERENCE_MS = 3 * 60 * 60 * 1000;
//     const promises = nirs.map((nir) => {

//       const nirDate = new Date(nir.documentDate)
//       nirDate.setTime(nirDate.getTime() + TIME_DIFFERENCE_MS)
//       const date = nirDate.toISOString().replace(/T(\d{2}:\d{2}:\d{2})\.\d+Z$/, 'T$1');
//       return nir.ingredients.map( async (el) => {
//         const ingredient = await Ingredient.findOne(
//           { name: el.name, gestiune: el.gestiune, locatie: '655e2e7c5a3d53943c6b7c53', 'uploadLog.date': date}
//         ).exec();
//         // If the ingredient with the specific `uploadLog.date` exists, update the `uploadPrice`
//         if(ingredient){
//           return Ingredient.updateOne(
//             { name: el.name, gestiune: el.gestiune, locatie: '655e2e7c5a3d53943c6b7c53', 'uploadLog.date': date },
//             {
//               $set: {
//                 'uploadLog.$.uploadPrice': round(el.price + (el.price * el.tva / 100))
//               }
//             }
//             ).exec();
//           } else {
//                console.log(date)
//           }
//       });
//       })
//     // nirs.forEach(nir => {
//     //   console.log(nir.documentDate)
//     // })
//     // res.status(200).json(nirs)
//     const flattenedPromises = promises.flat();
//     Promise.all(flattenedPromises)
//       .then((results) => {
//         console.log('All updates completed:', results);
//         res.status(200).json(results)
//       })
//       .catch((error) => {
//         console.error('Error in updating ingredients:', error);
//       });

//   } catch(error){
//     console.log(error)
//     res.status(500).json(error)
//   }
// }




    // const nirDocs = await Nir.find();

    // for (let nir of nirDocs) {
    //   // Initialize sum to 0
    //   let totalSum = 0;

    //   // Loop through each ingredient and sum the 'total' field
    //   nir.ingredients.forEach(ingredient => {
    //     totalSum += ingredient.total;
    //   });
    //   console.log(totalSum)
    //   // Update the totalDoc field with the computed sum
    //   nir.totalDoc = totalSum;

    //   // Save the updated nir document
    //   await nir.save();
    // }

    // Find all supliers
    // const supliers = await Suplier.find({locatie: '655e2e7c5a3d53943c6b7c53'});
    // // Iterate over each suplier
    // for (let suplier of supliers) {
    //   let hasUpdates = false; // Track if we made any updates to records
      
    //   for (let record of suplier.records) {
    //     if (record.document.amount === 0 && record.nir) {
    //       console.log('suplier-name', suplier.name, record.document.amount)
    //       // Find the corresponding Nir document by its _id
    //       const nirDocument = await Nir.findById(record.nir);
    //       // console.log(nirDocument)
    //       if (nirDocument && nirDocument.totalDoc) {
    //         console.log(nirDocument.totalDoc)
    //         // Update the record amount with nirDocument.totalDoc
    //         record.document.amount = nirDocument.totalDoc;
    //         hasUpdates = true; // Mark that updates were made
    //       }
    //     }
    //   }
    //   if (hasUpdates) {
    //     await suplier.save();
    //   }
    // }




