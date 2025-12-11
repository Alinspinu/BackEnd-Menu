
const Nir = require('../../models/office/nir')
const ImpSheet = require('../../models/office/imp-sheet')
const Report = require('../../models/office/report');
const NirInvoice = require('../../models/office/nir-invoice')
const Order = require('../../models/office/product/order')
const Transfer = require('../../models/office/product/transfer')
const ProductionSheet = require('../../models/office/product/production-sheet')


const PDFDocument = require("pdfkit");

const {createNirInvoice} = require('../print/nir-invoice')

const {unloadIngs, uploadIngs, gestTransfer} = require('../../utils/inv/src/index')
// const {unloadIngs, uploadIngs, gestTransfer} = require('../../utils/inventary')

const {createNir} = require('../print/nir')

const {round} = require('../../utils/functions')

const {createNirsListXcelBuffer} = require('../print/nir-list')
const {createSheetListXcelBuffer} = require('../print/fisa-dep-cons');





module.exports.addProductionSheet = async (req, res,) => {
  const {sheet} = req.body

  try{

    const newSh = new ProductionSheet(sheet)
    newSh.populate([{path: 'gestiune', select: 'name'}, {path: 'ingredients.ing'}])
    const savedSh = await newSh.save()
    consoel.log(savedSh)
    for(let i of savedSh.ingredients){
      await unloadIngs(i.ing.ings, i.qty , savedSh.gestiune._id)
    }

    await uploadIngs(mapIngs(savedSh.ingredients), 1, savedSh.gestiune._id)
    res.status(200).json({message: 'Fișa de productie a fost salvată cu succes!', sheet: savedSh})

  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

function mapIngs(ings) {
  ings.map(i => {
    return {
      name: i.name,
      qty: i.qty,
      price: i.price,
      ing: i.ing._id
    }
  })
  return ings
}

module.exports.deleteProductionSheet = async (req, res) => {
    const {id} = req.query
    try{

      const sheet = await ProductionSheet.findById(id).populate({path: 'ingredients.ing'})
      for(let i of sheet.ingredients){
        console.log(i.ing)
        await uploadIngs(i.ing.ings, i.qty , sheet.gestiune._id)
      }
      await unloadIngs(mapIngs(sheet.ingredients), 1, sheet.gestiune, true)
      await ProductionSheet.findByIdAndDelete(id)
      res.status(200).json({message: 'Fișa de productie a fost ștearsă cu succes și stocul a fost actualizat!'})
    } catch(error){
      console.log(error)
      res.status(500).json(error)
    }
}

module.exports.getProductionSheets = async (req, res) => {
  const {loc, point} = req.query
  try{
    const sheets = await ProductionSheet.find({locatie: loc, salePoint: point})
                          .populate([
                            {path: 'gestiune', select: 'name'},
                            {path: 'user', select: 'employee'}
                          ])
                          .lean()
      res.status(200).json(sheets)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.addTransfer = async (req, res) => {
  const {transfer} = req.body
  try{

    const newTr = new Transfer(transfer)
    newTr.populate([
      {path: 'gestiune.send', select: 'name'},
      {path: 'gestiune.recive', select: 'name'}
    ])
    const savedTransfer = await newTr.save()

    res.status(200).json({message: 'Fișa de transfer a vost savată cu succes!', transfer: savedTransfer})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }

}

module.exports.editTransfer = async (req, res) => {
    const {transfer} = req.body
    try{

      const updated = await Transfer.findByIdAndUpdate(transfer._id, transfer, {new: true})
                      .populate([
                        {path: 'gestiune.send', select: 'name'},
                        {path: 'gestiune.recive', select: 'name'}
                      ])
      res.status(200).json({message: 'Fișsa de transfer a fost actualizată cu succes!', transfer: updated})

    } catch(error){
      console.log(error)
      res.status(500).json(error)
    }
}


module.exports.deleteTransfer = async (req, res) => {
  const {id} = req.query
  try{
    const tr = await Transfer.findById(id)
    if(tr.updated){
      res.status(401).json({message: 'Ingredientele nu au fost transferate înapoi in gestiune! Transferă ingredientele pentru a putea șterge fișa de transfer.'})
    } else {
      await Transfer.findByIdAndDelete(id)
      res.status(200).json({message: 'Fișa de transfer a fost ștearsă cu succes!'})
    }
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.getTransfers = async (req, res) => {
  const {loc, point} = req.query
  try{

    const transfers = await Transfer.find({locatie: loc, salePoint: point})
                    .populate([
                      {path: 'gestiune.send', select: 'name'},
                      {path: 'gestiune.recive', select: 'name'}
                    ])
    res.status(200).json(transfers)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.makeTransfer = async (req, res) => {
  const {id, reverse} = req.body
  try{

    const transfer = await Transfer.findById(id)
    if(reverse){
      transfer.updated = false
     await gestTransfer(transfer.ingredients, transfer.gestiune.recive, transfer.gestiune.send)
    } else {
      transfer.updated = true
      await gestTransfer(transfer.ingredients, transfer.gestiune.send, transfer.gestiune.recive)
    }
    const savedTr = await transfer.save()
    res.status(200).json({message: 'Transferul a fost efectuat cu succes!', transfer: savedTr})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.addImpSheet = async (req, res) => {
    try{
      const {sheet} = req.body
      if(sheet._id) {
        await ImpSheet.deleteOne({_id: sheet._id})
        let tempSheet = sheet
        tempSheet.ings = tempSheet.ings.map(i =>{ return {qty: i.qty, ing: i.ing, gestiune: i.gestiune._id}})
        await uploadIngs(tempSheet.ings, 1, tempSheet.gestiune)
      }

      const newSheet = new ImpSheet(sheet)
      const savedSheet = await newSheet.save()
      await unloadIngs(savedSheet.ings, 1, savedSheet?.gestiune.toString())

      const dbSheet = await ImpSheet.findById(savedSheet._id)
            .populate({path: 'ings.ing', select: 'productIngredient ings name price um tva tvaPrice'})
            .populate({path: 'ings.gestiune', select: 'name'})
            .populate({path: 'user', select: 'employee.fullName'})
            .populate({path: 'gestiune'})
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
      await uploadIngs(dbSheet.ings, 1, dbSheet.gestiune?.toString())
      await ImpSheet.deleteOne({_id: id}) 
    }
    res.status(200).json({message: 'Fișa a fost ștearsă cu success!'})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.createSheetByOrder = async (req, res) => {

  const {id} = req.body
  try{


    const order = await Order.findById(id)
              .populate({path: 'products.toppings.ing', select: 'productIngredient name ings price', populate: {path: 'ings.ing', select: 'productIngredient name ings price'} })
              .populate({path: 'products.ings.ing', select: 'productIngredient name ings price', populate: {path: 'ings.ing', select: 'productIngredient name ings price'}})


    let gestiuni = []
    let sheets = []

    for(let p of order.products){
      const exixstingGest = gestiuni.find(g => g === p.gestiune.toString())
      if(!exixstingGest){
        gestiuni.push(p.gestiune.toString())
      }
    }

    for(let g of gestiuni){
      sheets.push({
        user: order.employee.user,
        locatie: order.locatie,
        salePoint: order.salePoint,
        products: [],
        ings: [],
        gestiune: g,
        date: new Date(),
        consumption: false
      })
    }



    for(let p of order.products){
      const sheet = sheets.find(s => s.gestiune.toString() === p.gestiune.toString()) 
      if(sheet){
        for(let i of p.ings){
          i.qty = i.qty * p.quantity
          if(i.ing.productIngredient){
            for(let ii of i.ing.ings){
               ii.qty = ii.qty * i.qty
                const existing = sheet.ings.find(iii => iii?.ing?._id.toString() === ii.ing._id.toString())
                if(existing){
                  existing.qty += ii.qty 
                } else {
                  sheet.ings.push(ii)
                }
            }
          } else {
              const existing = sheet.ings.find(iii => iii?.ing?._id.toString() === i.ing._id.toString())
              if(existing){
                existing.qty += i.qty
              } else {
                sheet.ings.push(i)
              }
          }
        }

        for(let t of p.toppings){
          t.qty = t.qty * p.quantity
          if(t.ing.productIngredient){
            for(let ii of t.ing.ings){
              ii.qty = ii.qty * t.qty
               const existing = sheet.ings.find(iii => iii?.ing?._id.toString() === ii.ing._id.toString())
               if(existing){
                 existing.qty += ii.qty 
               } else {
                 sheet.ings.push(ii)
               }
          }
        } else {
          const existing = sheet.ings.find(iii => iii?.ing?._id.toString() === t.ing._id.toString())
          if(existing){
            existing.qty += t.qty
          } else {
            sheet.ings.push(t)
          }
        } 
      }

      const existing = sheet.products.find(pp => pp.name === p.name)
      if(existing){
        existing.qty += p.quantity
        existing.cost += clacProduction(p)
      } else {
        const prd = {name: p.name, qty: p.quantity, cost: clacProduction(p)}
        sheet.products.push(prd)
      }

    }
    }

    for(let s of sheets){
      const newSheet = new ImpSheet(s)
      const savedSheet = await newSheet.save()
  
      await unloadIngs(savedSheet.ings, 1, savedSheet.gestiune.toString())
    }


    res.status(200).json({message: `Fișa (${sheets.length}) de deprecieri a fost creată și stocul actualizat!`})

  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}



function clacProduction(product){
  let total = 0
  for(let i of product.ings){
    total += i.ing.price * i.qty * product.quantity
  }
  for(let t of product.toppings){
    total += t.ing.price * t.qty * product.quantity
  }
  return round(total)
}

module.exports.getSheets = async (req, res) => {
    try{
        const {loc, point} = req.query
        const sheets = await ImpSheet.find({locatie: loc, salePoint: point})
        .sort({date: -1})
        .populate({path: 'ings.ing', select: 'name price um tva tvaPrice'})
        .populate({path: 'ings.gestiune', select: 'name'})
        .populate({path: 'user', select: 'employee.fullName'})
        .populate({path: 'gestiune'})
        .lean()

        const sortedSheets = sheets.sort((a,b) => {
          const aDate = new Date(a.date).getTime()
          const bDate = new Date(b.date).getTime()
          return bDate - aDate
        })
    // await updateSheets(sheets)
    res.status(200).json(sortedSheets)
    } catch(error){
      console.log(error)
    }
}

async function updateSheets(sheets){
    const shhetsToUpdate = []

    for(let s of sheets){
      if(!s.gestiune){
        s.gestiune = s.ings[0].gestiune
        shhetsToUpdate.push(s)
      }
    }
    const promises = shhetsToUpdate.map(o => 
          ImpSheet.findByIdAndUpdate(o._id, o, {new: true})
    )

    await Promise.all(promises)
    console.log('sheets verified:', sheets.length, '→ Updated:', promises.length);
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
        .populate({path: 'gestiune'})
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
            .populate({path: 'gestiune'})
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





