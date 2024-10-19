
const Ingredient = require('../../models/office/inv-ingredient')
const Nir = require('../../models/office/nir')
const Suplier = require('../../models/office/suplier')
const {round, roundd} = require('../../utils/functions')

module.exports.saveNir = async( req, res, next) => {
    const {nir, loc} = req.body;
   if( nir.documentDate === null ) {
    nir.documentDate = new Date(Date.now())
   }
   try{
      const newNir = new Nir(nir)
      newNir.locatie = loc
      const suplier = await Suplier.findById(nir.suplier)
    
      const operation = {name: 'intrare', details: suplier.name}
      const promises = nir.ingredients.map((el) => {
        return Ingredient.updateOne(
          { name: el.name, gestiune: el.gestiune, locatie: loc },
          {
            $setOnInsert: {
              um: el.um,
              gestiune: el.gestiune,
              locatie: loc,
            },
            $set: {
              price: el.price,
              tva: el.tva,
              dep: el.dep,
              tvaPrice: roundd(el.price * (1 + el.tva / 100)),
              sellPrice: el.sellPrice
            },
            $inc: {qty: el.qty},
            $push: {
              uploadLog: {
                date: nir.documentDate,
                qty: el.qty,
                operation: operation,
                uploadPrice: roundd(el.price * (1 + el.tva / 100))
              }
            }
          },
          { upsert: true, new: true }
        ).exec();
      });
      
      Promise.all(promises)
        .then((results) => {
          console.log(`Ingredientele au fost create/actualizate`);
          newNir.save().then((savedNir) => {
            const record = {
              typeOf: 'intrare',
              document: {
                typeOf: savedNir.document,
                docId: savedNir.nrDoc,
                amount: savedNir.totalDoc,
              },
              date: savedNir.documentDate,
              nir: savedNir._id 
            }
            Suplier.findByIdAndUpdate(
              suplier._id,  
              { 
                  $push: { records: record },
                  $inc: { sold: savedNir.totalDoc } 
              },
              { new: true, useFindAndModify: false }).then((savedSup) => {
              console.log("Documentul a fost salvat cu success!");
              res.status(200).json({ message: "Documentul a fost salvat cu success!", nir: savedNir });
            }).catch((error) => {
              console.error("Error saving document:", error);
              res.status(500).json({ message: "Failed to save document" });
            })
          }).catch((error) => {
            console.error("Error saving document:", error);
            res.status(500).json({ message: "Failed to save document" });
          });
        })
        .catch((err) => {
          console.log(`Error: ${err}`);
          next(err);
        });
    } catch (err) {
      console.log(err)
      res.status(500).json({message: err.message})
    }       
}

const Report = require('../../models/office/report')

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




module.exports.deleteNir = async (req, res, next) => {
  try{
    const {id, loc} = req.query
    const nirToDelete = await Nir.findById(id)
    const suplier = await Suplier.findById(nirToDelete.suplier)

    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const formattedDate = date.toISOString();
    const operation = {name: 'intoarcere', details: suplier.name}

    const promises = nirToDelete.ingredients.map((el) => {
      return Ingredient.updateOne(
        { name: el.name, gestiune: el.gestiune, locatie: loc },
        {
          $inc: {qty: -el.qty},
          $push: {
            unloadLog: {
              date: formattedDate,
              qty: el.qty,
              operation: operation
            }
          }
        },
        { upsert: true, new: true }
      ).exec();
    });
    Promise.all(promises)
    .then((results) => {
      Suplier.findByIdAndUpdate(
        suplier._id,
        { 
            $pull: { records: { nir: id } },
            $inc: { sold: - nirToDelete.totalDoc }
        },
        { new: true, useFindAndModify: false }
        ).then((suplier) => {
          console.log(`Ingredientele au fost actualizate`);
          res.status(200).json({message: "Documentul a fos sters cu success, stocul a fost actualizat!"})
        }).catch((error) => {
          console.log(`Error: ${err}`);
          next(err);
        })
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
      next(err);
    });
    await nirToDelete.deleteOne()
  } catch(err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}

module.exports.payBill = async (req, res, next) => {
  const {update, id, type} = req.body
  try{
    await Nir.findByIdAndUpdate(id , {payd: update, type: type})
    res.status(200).json({message: 'Facura a fost marcată ca plătită' })
  } catch (err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}


module.exports.getNirs = async(req, res, next) => {
  const loc = req.body.loc
  try{
    const nirs = await Nir.find({locatie: loc})
          .sort({ createdAt: -1 }) // Assuming you have a 'createdAt' field for timestamp
          .limit(20)
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

    const {id} = req.query
    const nir = await Nir.findById(id).populate({path: 'suplier'})
    res.status(200).json({nir: nir})
  } catch (err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}




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




