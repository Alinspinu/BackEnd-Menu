
const Nir = require('../../models/office/nir')
const ImpSheet = require('../../models/office/imp-sheet')
const Report = require('../../models/office/report');
const NirInvoice = require('../../models/office/nir-invoice')

const {createNirInvoice} = require('../print/nir-invoice')




module.exports.addImpSheet = async (req, res) => {
    try{
      const {sheet} = req.body
      if(sheet._id) await ImpSheet.deleteOne({_id: sheet._id})
      const newSheet = new ImpSheet(sheet)
      const savedSheet = await newSheet.save()
      const dbSheet = await ImpSheet.findById(savedSheet._id)
            .populate({path: 'ings.ing', select: 'productIngredient ings name price um tva tvaPrice'})
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
        const {loc, point} = req.query
        const sheets = await ImpSheet.find({locatie: loc, salePoint: point})
        .sort({date: -1})
        .limit(30)
        .populate({path: 'ings.ing', select: 'name price um tva tvaPrice'})
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
    const sheets = ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: endTime}, salePoint: point}) 
    res.status(200).json(sheets)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.saveNir = async( req, res, next) => {
    const {nir} = req.body;
    delete nir._id
   if( nir.documentDate === null ) {
    nir.documentDate = new Date(Date.now())
   }
   try{
      console.log(nir.nirInvoice)
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
          .sort({ createdAt: -1 })
          .limit(50)
          .populate({path: 'suplier'})
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


module.exports.getNirs = async(req, res, next) => {
  const {loc, point} = req.body
  try{
    const nirs = await Nir.find({locatie: loc, salePoint: point})
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

    const {id} = req.query

    const nirInvoice = await NirInvoice.findById(id).populate({path: 'locatie'})
    const doc = createNirInvoice(nirInvoice)

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





