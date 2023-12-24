
const Ingredient = require('../../models/office/inv-ingredient')
const Nirr = require('../../models/office/nir')
const {round} = require('../../utils/functions')

module.exports.saveNir = async( req, res, next) => {
    const {nir} = req.body;
        const newNir = new Nirr(nir)
        newNir.locatie = '655e2e7c5a3d53943c6b7c53'
        await newNir.save()
        const promises = nir.ingredients.map((el) => {
          return Ingredient.updateOne(
            { name: el.name, gestiune: el.gestiune, locatie: '655e2e7c5a3d53943c6b7c53' },
            {
              $setOnInsert: {
                um: el.um,
                gestiune: el.gestiune,
                locatie: '655e2e7c5a3d53943c6b7c53',
              },
              $set: {
                price: el.price,
                tva: el.tva,
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
            res.status(200);
          })
          .catch((err) => {
            console.log(`Error: ${err}`);
            next(err);
          });
        
}
