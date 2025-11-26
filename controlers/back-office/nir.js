
const Nir = require('../../models/office/nir')
const ImpSheet = require('../../models/office/imp-sheet')
const Report = require('../../models/office/report');
const NirInvoice = require('../../models/office/nir-invoice')

const Ingredient = require('../../models/office/inv-ingredient')

const PDFDocument = require("pdfkit");

const {createNirInvoice} = require('../print/nir-invoice')

const {unloadIngs, uploadIngs} = require('../../utils/inventary')

const {createNir} = require('../print/nir')

const {createNirsListXcelBuffer} = require('../print/nir-list')
const {createSheetListXcelBuffer} = require('../print/fisa-dep-cons')




module.exports.addImpSheet = async (req, res) => {
    try{
      const {sheet} = req.body
      if(sheet._id) {
        await ImpSheet.deleteOne({_id: sheet._id})
        let tempSheet = sheet
        tempSheet.ings = tempSheet.ings.map(i =>{ return {qty: i.qty, ing: i.ing, gestiune: i.gestiune._id}})
        await uploadIngs(tempSheet.ings, 1)
      }

      const newSheet = new ImpSheet(sheet)
      const savedSheet = await newSheet.save()
      await unloadIngs(savedSheet.ings, 1)

      const dbSheet = await ImpSheet.findById(savedSheet._id)
            .populate({path: 'ings.ing', select: 'productIngredient ings name price um tva tvaPrice'})
            .populate({path: 'ings.gestiune', select: 'name'})
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
    const dbSheet = await ImpSheet.findById(id)
    if(dbSheet){
      await uploadIngs(dbSheet.ings, 1)
      await ImpSheet.deleteOne({_id: id}) 
    }
    res.status(200).json({message: 'Fișa a fost ștearsă cu success!'})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.getSheets = async (req, res) => {
    try{
        const {loc, point} = req.query
        const sheets = await ImpSheet.find({locatie: loc, salePoint: point})
        .sort({date: -1})
        .limit(50)
        .populate({path: 'ings.ing', select: 'name price um tva tvaPrice'})
        .populate({path: 'ings.gestiune', select: 'name'})
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
    const {startDate, endDate, loc, point} = req.query
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()
    const sheets = await ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: endTime}, salePoint: point}) 
        .populate({path: 'ings.ing', select: 'name price um tva tvaPrice'})
        .populate({path: 'ings.gestiune', select: 'name'})
        .populate({path: 'user', select: 'employee.fullName'})
    res.status(200).json(sheets)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.printSheet = async (req, res) => {
  try{
    const {id} = req.body

    const sheet = await ImpSheet.findById(id)
            .populate({path: 'user', select: 'name'})
            .populate({path: 'salePoint', select: 'locatie name', populate: {path: 'locatie', select: 'bussinessName'}})
            .populate({path: 'ings.ing', select: 'productIngredient ings name price um tva tvaPrice', populate: {path: 'ings.ing', select: 'um price name'}})
            .populate({path: 'ings.gestiune', select: 'name'})
    const buffer = await createSheetListXcelBuffer(sheet);
    
    // Set headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');

    // Send the buffer directly
    res.send(Buffer.from(buffer));
  } catch(error){
    console.log(error)
    res.status(200).json(error)
  }
}


module.exports.saveNir = async( req, res, next) => {
    const {nir} = req.body;
    delete nir._id
   if( nir.documentDate === null ) {
    nir.documentDate = new Date(Date.now())
   }
   try{
      const newNir = new Nir(nir)
      newNir.suplier = nir.suplier._id
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
    const {id, point} = req.query
    if(point && point.length) {
      const nirs = await Nir.find({suplier: id, salePoint: point})
          .select('-ingredients')
          .sort({ createdAt: -1 })
          // .limit(50)
          .populate({path: 'suplier',select: '-records'}).lean()
      res.status(200).json(nirs)
    } else {
      const nirs = await Nir.find({suplier: id})
        .sort({ createdAt: -1 })
        .limit(50)
        .populate({path: 'suplier'})
     res.status(200).json(nirs)
    }
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

module.exports.printNirByIngLogId = async (req, res) => {
  const {logId, loc, point} = req.body

  let doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
});

  try{

    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');
  
    // doc.pipe(res);

    const nir = await Nir.findOne({'ingredients.logId': logId}).populate({path: 'locatie'})
    if(nir){
      const nirInvoice = await NirInvoice.findById(nir.nirInvoice)
      if(nirInvoice){
        const value = nir.ingredients.find(i => i.logId === logId).value
        createNirInvoice(nirInvoice, doc, value)
        doc.end();
        res.type("application/pdf");
        doc.pipe(res);
        res.once("finish", () => {
          const chunks = [];
          doc.on("data", (chunk) => {
            chunks.push(chunk);
          });
          doc.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const base64String = buffer.toString("base64");
            res.status(200).send(base64String)
          });
        });
      }
    }


  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }

}


module.exports.getNirs = async(req, res, next) => {
  const {loc, point} = req.body
  try{
    const nirs = await Nir.find({locatie: loc, salePoint: point})
          .select('-ingredinets')
          .limit(200)
          .sort({ createdAt: -1 })
          .populate({path: 'suplier', select: '-records'}).lean()
          // .populate({path: 'ingredients.invGestiune', select: 'name'})
    res.status(200).json(nirs)
  } catch(err) {
    console.log(err)
    res.status(500).json({messahe: err.message})
  }
}



module.exports.printNirsList = async (req, res) => {
  const {start, end, loc, point} = req.body
  try{
    const startTime = new Date(start).setHours(0,0,0,0)
    const endTime = new Date(end).setHours(23,59,59,9999)
    const nirs = await Nir.find({locatie: loc, salePoint: point, documentDate: {$gte: startTime, $lte: endTime }})
                  .populate({path: 'suplier', select: 'name'})
                  .populate({path: 'locatie', select: 'bussinessName'})
                  .sort({ documentDate: 1 });


    const buffer = await createNirsListXcelBuffer(nirs, startTime, endTime, nirs[0].locatie.bussinessName)

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');

    // Send the buffer directly
    res.send(Buffer.from(buffer));

  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.printNirsAndInvoices = async (req, res) => {
  const {loc, point, start, end, deps} = req.body
  try{

    let doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait'
    });

    const startTime = new Date(start).setUTCHours(0,0,0,0)
    const endTime = new Date(end).setUTCHours(23,59,59,0)

    const nirs = await Nir.find({locatie: loc, salePoint: point, documentDate: {$gte: startTime, $lt: endTime}})
                .sort({ documentDate: 1 })
                .populate({
                  path: "suplier",
                    select: "name vatNumber",
                  })
                  .populate({
                    path: 'locatie',
                    select: 'bussinessName vatNumber register address'
                  })
                  .populate({
                    path: 'salePoint',
                    select: 'name'
                  })
                  .populate({path: 'nirInvoice', populate: {path: 'locatie', select: 'bussinessName bank account vatNumber'}})
                  .populate({
                    path: 'ingredients.ing',
                    select: 'dept'
                  })
                  .lean()

        console.log('numar de niruri niruri ', nirs.length)
      for(let n of nirs){
        if(n.nirInvoice && n.nirInvoice._id){
        const check = n.ingredients.findIndex(i => deps.includes(i.ing.dept.toString()))
        if(check !== -1){
            createNirInvoice(n.nirInvoice, doc)
            doc.addPage({size: 'A4', layout: 'landscape'})
            createNir(n, doc)
            doc.addPage({size: 'A4', layout: 'portrait'})
          } else {
             createNirInvoice(n.nirInvoice, doc)
             doc.addPage({size: 'A4', layout: 'portrait'})
          }
          }
      }

      doc.end();
      res.type("application/pdf");
      doc.pipe(res);
      res.once("finish", () => {
        const chunks = [];
        doc.on("data", (chunk) => {
          chunks.push(chunk);
        });
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const base64String = buffer.toString("base64");
          res.status(200).send(base64String)
        });
      });

  } catch(e) {
    console.log(e)
    res.status(500).json(e)
  }
}






// function modifyProducts(products) {
//   const productPromises = products.map(p => {

//     p.ingredients.forEach(i => {
//       if(!i.invGestiune){
//         if(i.ing && i.ing.gest){
//           i.invGestiune = i.ing.gest
//           console.log('Gestiune modificata pe ingredient din nir', i.name);
//         }
//       }
//     });
//       return p.save().then(savedP => {
//         console.log(savedP.index, 'a fost modificat cu success!');
//       });
//     });

//   return Promise.all(productPromises);
// }




// async function fixBuleala(nirs) {
//   for(let doc of nirs){

  
//   const promises = doc.ingredients.map(async el => {
//     const ingredient = await Ingredient.findById(el.ing);
//     if (!ingredient) {
//       console.log('Ingredient not found:', el.ing);
//       return null;
//     }
  
//     // decrement qty
//     ingredient.qty = (ingredient.qty || 0) - el.qty;
  
//     // remove from uploadLog by logId
//     ingredient.uploadLog = ingredient.uploadLog.filter(log => {
//       return log.logId.toString() !== el.logId.toString();
//     });


//     if(ingredient.invGestiune.length){
//       let gestiuneMatch = el.invGestiune ? el.invGestiune.toString() : ingredient.gest.toString()
//       const index = ingredient.invGestiune.findIndex(g => g.gestiune.toString() === gestiuneMatch)
//       if(index !== -1){
//         ingredient.invGestiune[index].qty = roundd(ingredient.invGestiune[index].qty - el.qty)
//         ingredient.invGestiune[index].entries = ingredient.invGestiune[index].entries.filter(log => {
//           return log.nir.toString() !== doc._id.toString();
//         });
  
//         console.log('all good in the good ', ingredient.invGestiune[index])
//       } else {console.log('Nu am gasit gestiunea ', gestiuneMatch, ingredient.invGestiune)}
//     } else {console.log('ingredientul nu are gestiuni de inventar')}

  
//     return ingredient.save();
//   });
  
//   const results = await Promise.all(promises);
  
//   const suplier = await Suplier.findById(doc.suplier);

//     if (suplier) {
//       const sortedRecords = suplier.records.sort((a, b) => {
//         const aDate = new Date(a.date).getTime() 
//         const bDate = new Date(b.date).getTime()
//         return aDate - bDate
//     })
//         const recordIndex = sortedRecords.findIndex(r => r.nir.toString() === doc._id.toString());
//         if (recordIndex !== -1) {
//             sortedRecords.splice(recordIndex, 1);
//             for (let i = recordIndex; i < sortedRecords.length; i++) {
//                 sortedRecords[i].sold -= doc.totalDoc;
//             }
//             suplier.sold = suplier.sold - doc.totalDoc
//             suplier.records = sortedRecords
//             await suplier.save();
//             console.log('furnizorul a fos actualizat', suplier.name)
//         } else {
//           console.error('ERROR! Record not found! Suplier unchanged!')
//         }
//     }

//   }
// }



module.exports.getNirsByDate = async (req, res, next) => {
  try{
    const {loc, startDate, endDate, point} = req.body
    const start = new Date(startDate)
    const end = new Date(endDate)
    const nirs = await Nir.find({locatie: loc, salePoint: point, documentDate: {$gte: start, $lte: end}}).populate({path: 'suplier'})
    res.status(200).json(nirs)
  }catch(err) {
    console.log(err)
    res.status(500).json({message: err.message})
  }
}


module.exports.getNir = async (req, res, next) => {
  
  try{
    const {id} = req.query
    const nir = await Nir.findById(id)
      .populate({path: 'suplier'})
      .populate({path: 'ingredients.invGestiune', select: 'name'})
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
    const {nirId, id, nirInvoice} = req.body
    const nir = await Nir.findByIdAndUpdate(nirId, {eFacturaId: id, nirInvoice: nirInvoice}, {new: true})
    res.status(200).json(nir)
  } catch(error){
    console.log(error)
  }
}


module.exports.seaveNirInvoice = async (req, res) => {
  try{
    const {nirInvoice, loc} = req.body
    nirInvoice.supplier.bank =  nirInvoice.supplier.bank?.toString() || 'NO BANK'
    nirInvoice.supplier.iban =  nirInvoice.supplier.iban?.toString() || 'NO IBAN'
    const inv = new NirInvoice(nirInvoice)
    inv.locatie = loc
    const savedInv = await inv.save()
    res.status(200).json(savedInv)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.printNirInvoice = async (req, res) => {
  try{

    let doc = new PDFDocument({
      size: "A4",
      layout: "portrait",
  });

    const {id} = req.query

    const nirInvoice = await NirInvoice.findById(id).populate({path: 'locatie'})

     createNirInvoice(nirInvoice, doc)

    doc.end();
    res.type("application/pdf");
    doc.pipe(res);
    res.once("finish", () => {
      const chunks = [];
      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64String = buffer.toString("base64");
        res.status(200).send(base64String)
      });
    });
  } catch(error){
    console.log(error)
    res.status(200).json(error)
  }
}





