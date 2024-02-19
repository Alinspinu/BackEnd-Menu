
const Ingredient = require('../../models/office/inv-ingredient')
const Nir = require('../../models/office/nir')
const {round} = require('../../utils/functions')

module.exports.saveNir = async( req, res, next) => {
    const {nir, loc} = req.body;
   if( nir.documentDate === null ) {
    nir.documentDate = new Date(Date.now())
   }
   try{
      const newNir = new Nir(nir)
      newNir.locatie = loc
      const savedNir = await newNir.save()
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
              tvaPrice: round(el.price * (1 + el.tva / 100)),
            },
            $inc: {qty: el.qty}
          },
          { upsert: true, new: true }
        ).exec();
      });
    
      Promise.all(promises)
        .then((results) => {
          console.log(`Updated/created documents: ${results}`);
          res.status(200).json({message: "Documentul a fost salvat cu success!", nir: savedNir})
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
    console.log(req.body)
    const {loc, startDate, endDate} = req.body
    const start = new Date(startDate)
    const end = new Date(endDate)
    const nirs = await Nir.find({locatie: loc, documentDate: {$gte: start, $lte: end}}).populate({path: 'suplier'})
    console.log(nirs)
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


module.exports.deleteNir = async (req, res, next) => {
  try{
    const {id} = req.query
    const nirToDelete = await Nir.findById(id)
    const promises = nirToDelete.ingredients.map((el) => {
      return Ingredient.updateOne(
        { name: el.name, gestiune: el.gestiune, locatie: '655e2e7c5a3d53943c6b7c53' },
        {$inc: {qty: -el.qty}},
        { upsert: true, new: true }
      ).exec();
    });
    Promise.all(promises)
    .then((results) => {
      console.log(`Updated documents: ${results}`);
      res.status(200).json({message: "Documentul a fos sters cu success, stocul a fost actualizat!"})
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

