const Ingredient = require('../../models/office/inv-ingredient')
const {round, formatedDateToShow, normalizeText} = require('./../../utils/functions')
const Inventary = require('../../models/office/inventary')
const Order = require('../../models/office/product/order')
const ImpSheet = require('../../models/office/imp-sheet')
const DelProd = require('../../models/office/product/deletetProduct')
const Product = require('../../models/office/product/product')
const SubProduct = require('../../models/office/product/sub-product')
const CigarsInv = require('../../models/cigars-inv')
const salePoint = require('../../models/utils/sale-point')
const ComparedInventary = require('../../models/office/comp-inv')
const Invoice = require('../../models/office/invoice')
const Nir = require('../../models/office/nir')
const  {createRG} = require('../../utils/reports/gestiune')
const {createExcelBuffer} = require('../print/gestiune-xls')




module.exports.getGestReport = async(req, res) => {

  const {start, end, dep, loc, point, gest, in0, in11, in21} = req.body

  const startDate = new Date(start).setUTCHours(0,0,0,0)
  const endDate = new Date(end).setUTCHours(23,59,59, 9999)


  try{

    const ings = await Ingredient.find({dept: dep, locatie: loc, salePoint: point}).select('name sellPrice tva locatie').lean()
    const nirs = await Nir.find({locatie: loc, salePoint: point, documentDate: {$gte: startDate, $lte: endDate }})
              .populate({path: 'suplier', select: 'name'})
              .populate({path: 'locatie', select: 'bussinessName' }).lean()
    const orders = await Order.find({locatie: loc, salePoint: point, paymentDate: {$gte: startDate, $lt: endDate}, status: 'done'}).lean() 
    const invoices = await Invoice.find({locatie: loc, salePoint: point, createdAt: {$gte: startDate, $lte: endDate}})
              .populate({path:'products.productId', select: 'name departament sgrTax'})
              .lean()
                      

    const days = await createRG(start, end, nirs, ings, gest, orders, in0, in11, in21, dep, invoices)
  
    const buffer = await createExcelBuffer(days, nirs[0].locatie.bussinessName);

    let tips = 0 

    for(let o of orders){
       tips += o.tips
    }
    console.log('Tips ', tips )

    // Set headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');

    // Send the buffer directly
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("❌ Excel generation error:", error);
    res.status(500).json({ error: "Failed to generate Excel file" });
  }
}






module.exports.saveIng = async(req, res, next) => {
    const {ing} = req.body;
    try{

      const checkIng = await Ingredient.findOne({name: ing.name, gestiune: ing.gestiune, locatie: ing.locatie})
      if(checkIng){
        return res.status(226).json({message: "Ingredientul deja exista în baza de date!"})
      } else {
        delete ing._id
        const newIng = new Ingredient(ing)
        const savedIng =  await newIng.save()
        const dbIng = await Ingredient.findById(savedIng._id)
              .select([ '-unloadLog', '-uploadLog'])
              .populate({path: 'ings.ing', select: '-unloadLog -uploadLog'})
              .populate({path: 'ings.gestiune', select: 'name'})
              .populate({path: 'salePoint', select: 'name'})
              .populate({path: 'gest', select: 'name'})
              .populate({path: 'dept', select: 'name'})
        return res.status(200).json({message: `Ingredientul ${newIng.name} a fost salvat cu succes!`, ing: dbIng})
      }

    } catch(err) {
      console.log(err)
      res.status(500).json(err)
    }

  }


  
    module.exports.searchIng = async (req, res, next) => {
      const {loc, point} = req.query
      const page = parseInt(req.query.page) || 1;
      const limit = 600; 
      const skip = (page - 1) * limit;
      try{  
        // const items = await Ingredient.find({}).skip(skip).limit(limit)
        const items = await Ingredient.find({locatie: loc, salePoint: point}).skip(skip).limit(limit)
          .select([ '-unloadLog', '-uploadLog'])
          .populate({path: 'ings.ing', select: '-unloadLog -uploadLog'})
          .populate({path: 'ings.gestiune', select: 'name'})
          .populate({path: 'salePoint', select: 'name'})
          .populate({path: 'gest', select: 'name'})
          .populate({path: 'dept', select: 'name'})
          .populate({path: 'eFactura.gestiune', select: 'name'})
          .lean()
        const totalItems = 1500
        const totalPages = Math.ceil(totalItems / limit);
        // await  verifyIngredients(items)
        res.status(200).json({
          items,
          totalPages,
          currentPage: page,
        })
      }catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({message: err})
      }
    };

    const dune ='690c818c21500095430c613f'

   async function verifyIngredients(ings){

    const ingsToUpdate = []

      for(let i of ings){
          if(i.invGestiune?.length){
            let update = false
            for(let g of i.invGestiune){
              if(!g.sale){
                g.sale = true
                update = true
              }
            }
            if(update){
              ingsToUpdate.push(i)
            }
          }

      }

      const promises = ingsToUpdate.map(i =>
        Ingredient.findByIdAndUpdate(i._id, i, { new: true })
      )

      await Promise.all(promises)
      console.log('Ingredients verified:', ings.length, '→ Updated:', ingsToUpdate.length);

  }

  function splitVAT(vatPrice, r, qty = 1, decimals = 2) {
    const round = (n) => Math.round((n + Number.EPSILON) * 10**decimals) / 10**decimals;
  
    const gross = (Number(vatPrice) || 0) * (Number(qty) || 0);
    const rate = Number(r) || 0;
  
    const net  = rate > 0 ? gross / (1 + rate / 100) : gross;
    const vat  = gross - net;
  
    return {
      gross: round(gross),
      net:   round(net),
      vat:   round(vat),
    };
  }



     async function modifyProducts(products) {

        const productPromises = products
        .filter(i => i.ings.length) // only keep products with ings
        .map(i => {
          for (let ing of i.ings) {
            if (!ing.gestiune) {
              ing.gestiune = ing.ing.gest;
            }
          }
          return i.save();
        });
      
        await Promise.all(productPromises);
      }



    async function updateGesName(items) {
      const promises = [];
    
      for (const ing of items) {
        if (!ing.invGestiune.length) {
          console.log('***********Am gasit un ingredient fara gestiune, i-am pus o gestiunea ', ing.name)
          const gest = {
            gestiune: ing.gest._id,
            qty: ing.qty,
            inventary: [],
            name: ing.gest.name,
            entries: [
              {
                qty: ing.qty,
                inQty: ing.qty,
                date: new Date(),
                priceWithVat: ing.tvaPrice,
                priceNoVat: ing.price,
                suplierNane: 'First Entry'
              }
            ]
          };
    
          ing.invGestiune = [gest];
    
          // push the promise to an array instead of awaiting here
          promises.push(
            ing.save().then((editedIng) => {
              console.log('Ingredient editat cu success!', editedIng.name);
            })
          );
        } else {
          ing.invGestiune[0].name = ing.gest.name
          promises.push(
            ing.save().then((editedIng) => {
              console.log('Ingredient editat cu success cu numele la gestiune - ', editedIng.invGestiune[0].name);
            })
          );
        }
      }
    
      // wait for all promises to complete
      await Promise.all(promises);
    }
    
    async function updateItems(items) {
      const promises = [];
    
      for (const ing of items) {
        if(ing.eFactura.length){
          for(let en of ing.eFactura){
            en.gestiune = ing.gest
            console.log('Intrare modificata cu success!! ', en.gestiune )
          }
        
  
        // push the promise to an array instead of awaiting here
        promises.push(
          ing.save().then((editedIng) => {
            console.log('Ingredient editat cu success!', editedIng.name);
          })
        );
        }
        
      }
    
      // wait for all promises to complete
      await Promise.all(promises);
    }
    


    module.exports.getIngUploadLog = async (req, res) => {
      try{ 
        const {id} = req.query
        const ing = await Ingredient.findById(id).select('name um uploadLog tva')
        res.status(200).json(ing)
      } catch(error) {
        console.log(error)
        res.status(500).json(error)
      }
    }

    module.exports.deleteIngUpLog = async (req, res) => {
      try{
        const {logID, ingID} = req.query
        await Ingredient.findByIdAndUpdate(ingID, {$pull: {uploadLog: {_id: logID}}})
        res.status(200).json({message: 'Logul a șters!'})
      } catch(error){
        console.log(error)
        res.status(500).json(error)
      }
    }

//******* */
    module.exports.getIngConsumabil = async (req, res, next) => {
      const {loc, point} = req.query
      try{
        const ings = await Ingredient.find({locatie: loc, dep: 'consumabil', salePoint: point}).select(['name', 'tvaPrice', 'uploadLog'])
        res.status(200).json(ings)
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }

    module.exports.deleteIng = async (req, res, next) => {
      try{
        const {id} = req.query;
        const ing = await Ingredient.findById(id)
        await ing.deleteOne();
        res.status(200).json({message: `Ingredientul ${ing.name} a fost sters cu succes!`})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }

    module.exports.editIng = async (req, res, next) => {
      try{  
        const {id} = req.query;
        const {newIng} = req.body;
        await Ingredient.findByIdAndUpdate(id, newIng);
        const ing = await Ingredient.findById(id)
          .select([ '-unloadLog', '-uploadLog', '-inventary'])
          .populate({path: "ings.ing", select: '-unloadLog -uploadLog -inventary'})
          .populate({path: 'ings.gestiune', select: 'name'})
          .populate({path: 'salePoint', select: 'name'})
          .populate({path: 'gest', select: 'name'})
          .populate({path: 'dept', select: 'name'})
          .populate({path: 'eFactura.gestiune', select: 'name'})
        res.status(200).json({message: `Ingredientul ${ing.name} a fost actualizat cu succes!`, ing: ing})
      } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
      }
    }





    module.exports.saveInventary = async (req, res, next) => {
      const {loc, point, selectedDate, gestiune} = req.query
      try {
        const date = new Date(selectedDate);
        date.setUTCHours(20, 59, 59, 0);
        const formattedDate = date.toISOString();
        const ings = await Ingredient.find({locatie: loc, productIngredient: false, salePoint: point})
                          .select('inventary name gestiune qty dep um gest')
                          .populate({path: 'gest', select: 'name'})

        const updatePromises = ings.map(ing => {
          let index = 1;
          if (ing.inventary && ing.inventary.length) {
            index += ing.inventary.length;
          } else {
            index = 1;
          }
    
          const entry = {
            index: index,
            day: formattedDate,
            qty: ing.qty,
            gestiune: ing.gest._id,
            gName: ing.gest.name
          };
    
          return Ingredient.updateOne(
            { _id: ing._id },
            { $push: { inventary: entry } }
          );
        });
    
        const promises = await Promise.all(updatePromises);
        const formatedDate = formatedDateToShow(date)
        res.status(200).json({ message: `Inventarul a fost salvat pentru data de ${formatedDate} pentru ${promises.length} ingrediente`});
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
      }
    };

module.exports.saveManualInventary = async (req, res, next) => {
  try{
    const {data} = req.body
    const ing  = await Ingredient.findById(data.ingId)
    for(let inv of ing.inventary){
      if(inv.index === data.entry.index){
        inv.faptic = data.entry.faptic
        const inventary = await Inventary.findOne({date: new Date(inv.day), gestiune: inv.gestiune})
        if(inventary){
          console.log('Inventar gasit')
          console.log('Caut ingredient....')
          const invIng = inventary.ingredients.find(i => i.ing.toString() === ing._id.toString())
          if(invIng){
            console.log('Am gasi ingredient in inventar')
            console.log('Modific cantitatea....')
            invIng.faptic = data.entry.faptic
            await inventary.save()
            console.log('Success!! CAntitate modificata si inventar editat!')
          } else {console.log('Nu am gasit ingtredient in inventar')}
        } else {console.log('Nu am gasit inventar')}

      }
    }
    const newIng = await ing.save()
    const dbIng = await Ingredient.findById(newIng._id)
        .select([ '-unloadLog', '-uploadLog'])
        .populate({path: 'salePoint', select: 'name'})
        .populate({path: 'gest', select: 'name'})
        .populate({path: 'dept', select: 'name'})
        .populate({path: 'eFactura.gestiune', select: 'name'})
    res.status(200).json({message: 'Inventarul a fost actualizat', ing: dbIng})
  } catch(err){
    console.log(err)
    res.status(500).json({message: err.message})
  }
}

module.exports.getIng = async (req, res) => {
  const {id} = req.query
  try{
    const ing = await Ingredient.findById(id)
        .populate({path: 'ings.ing', select: 'name um'})
        .populate({path: 'ings.gestiune', select: 'name'})
        .populate({path: 'salePoint', select: 'name'})
        .populate({path: 'gest', select: 'name'})
        .populate({path: 'dept', select: 'name'})
        .populate({path: 'eFactura.gestiune', select: 'name'})
    res.status(200).json(ing)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.saveInv = async (req, res, next) => {
  try{
    const {date, loc, point} = req.body
    const invDate = new Date(date).setUTCHours(0,0,0,0)
    const ings = await Ingredient.find({locatie: loc, productIngredient: false, salePoint: point}).select('inventary name gestiune dep um')
    const ingredients = ings.map(ing => {

      let foundFirstMatch = false;

      let newIng = {}
      for(let inv of ing.inventary){
        if (foundFirstMatch) break;
        const day = new Date(inv.day).setUTCHours(0,0,0,0)
          if(day === invDate){
          newIng.faptic = inv.faptic
          newIng.scriptic = inv.qty
          newIng.name = ing.name
          newIng.ing = ing._id
          newIng.gestiune = ing.gestiune
          newIng.dep = ing.dep
          newIng.um = ing.um
          foundFirstMatch = true;
          
        }
      }
      return newIng
    })
    const filtredIngredients = ingredients.filter(ing => ing.name)
    const savedInventary = await Inventary.findOne({date: invDate, locatie: loc, salePoint: point})
    if(savedInventary) {
      const update = {
        date: invDate,
        ingredients: filtredIngredients
      }
      const modifiedInv = await Inventary.findOneAndUpdate({_id: savedInventary._id}, update, {new: true}).populate({path: 'ingredients.ing', select: 'price um'})
      res.status(200).json({message: 'Inventarul a fost actualizat!', inv: modifiedInv})
    } else {
      if(isEmpty(ingredients[0])){
        res.status(226).json({message: 'Erorare, nu a fost salavat invetarul scriptic!'})
      } else {
        const inv = new Inventary({
          locatie: loc,
          salePoint: point,
          date: invDate,
          ingredients: filtredIngredients
        })
        const savedInv = await inv.save()
        await savedInv.populate({ path: 'ingredients.ing', select: 'price um' })
        res.status(200).json({message: 'Inventarul a fost salvat!', inv: savedInv})
      }
    }
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }
}


module.exports.compareScriptic = async (req, res, next) => {
  try{
    let ingredients = []
    let consIngs = []
    let delIngs = []
    const {start, end, loc, point} = req.body
    const startTime = new Date(start).setUTCHours(0,0,0,0)
    const endTime = new Date(end).setUTCHours(0,0,0,0)
    const eTime = new Date(end).setUTCHours(23,0,0,0)
    const firstInventary = await Inventary.findOne({date: startTime, locatie: loc, salePoint: point}).populate({path: 'ingredients.ing', select: 'price'})
    const lastInventary = await Inventary.findOne({date: endTime, locatie: loc, salePoint: point}).populate({path: 'ingredients.ing', select: 'price'})

    // const compInv = await ComparedInventary.findOne({firstInv: firstInventary._id, secondInv: lastInventary._id, locatie: loc, salePoint: point})

    // if(compInv){
    //   return res.status(200).json(compInv)
    // }

    const ings = await Ingredient.find({locatie: loc,  productIngredient: false, salePoint: point}).select('name uploadLog um')
    const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep', salePoint: point})
          .populate({path: 'billProduct.ings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})
          .populate({path: 'billProduct.toppings.ing', select: 'name ings um', populate: {path: 'ings.ing', select: 'name um'}})

    const impSheets = await ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: eTime}, salePoint: point})
                              .populate({path: 'ings.ing', select: 'name um ings productIngredient price', populate: {path: 'ings.ing', select: 'name um price' }})
    const orders = await Order.find({locatie: loc, paymentDate: {$gte: startTime, $lte: endTime}, status: 'done', salePoint: point}).populate([
      {
        path: 'products.ings.ing', 
        populate: {path: 'ings.ing'}
      },
      {
        path: 'products.toppings.ing', 
        populate: {path: 'ings.ing'}
      }
    ])


    console.log('firts inventary', firstInventary.date)
    console.log('second inventary', lastInventary.date)



    for(const sheet of impSheets){
      for(let ing of sheet.ings){
          if(ing.ing.productIngredient){
              for(let ingg of ing.ing.ings){
                  const index = delIngs.findIndex(i => i.name === ingg.ing.name)
                  if(index !== -1){
                      delIngs[index].qty = round(delIngs[index].qty + ingg.qty)
                  } else {
                      delIngs.push(ingg)
                  }
              }
          } else {
              const index = delIngs.findIndex(i => i.name === ing.ing.name)
              if(index !== -1){
                  delIngs[index].qty = round(delIngs[index].qty + ing.qty)
              } else {
                  delIngs.push(ing)
              }
          }
      }
  }

    if(delProds){
      delProds.forEach(delProduct => {
        const product = delProduct.billProduct
        product.ings.forEach(ing => {
          if(ing.ing.ings && ing.ing.ings.length){
            ing.ing.ings.forEach(ig => {
              const existingIng = delIngs.find(i => i.ing.name === ig.ing.name)
              if(existingIng){
                const updatedIng = {
                  qty: existingIng.qty + round(ig.qty * ing.qty),
                  ing: existingIng.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
              } else{
                delIngs.push(ig)
              }
            })
          } else{
            if(ing && ing.ing){
              const existingIngredient = delIngs.find(p =>p.ing.name === ing.ing.name);
              if (existingIngredient) {
                const updatedIng = {
                  qty: existingIngredient.qty + ing.qty,
                  ing: existingIngredient.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
              } else {
                delIngs.push(ing);
              }
            }
          }
        })
        product.toppings.forEach(ing => {
          if(ing.ing.ings && ing.ing.ings.length){
            ing.ing.ings.forEach(ig => {
              const existingIng = delIngs.find(i => i.ing.name === ig.ing.name)
              if(existingIng){
                const updatedIng = {
                  qty: existingIng.qty + round(ig.qty *ing.qty),
                  ing: existingIng.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
              } else{
                delIngs.push(ig)
              }
            })
          } else{
            if(ing && ing.ing){
              const existingIngredient = delIngs.find(p =>p.ing.name === ing.ing.name);
              if (existingIngredient) {
                const updatedIng = {
                  qty: existingIngredient.qty + ing.qty,
                  ing: existingIngredient.ing
                }
                delIngs = delIngs.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
              } else {
                delIngs.push(ing);
              }
            }
          }
        })
      })
    }
      if(orders){
        orders.forEach(order=> {
          order.products.forEach(product => {
            product.ings.forEach(ing => {
              ing.qty = round(ing.qty*product.quantity)
              if(ing.ing.ings && ing.ing.ings.length){
                ing.ing.ings.forEach(ig => {
                  const existingIngredient = consIngs.find(p =>p.ing.name === ig.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + round(ig.qty * ing.qty), 
                      ing: existingIngredient.ing
                    }
                    consIngs = consIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
                  } else {
                    consIngs.push(ig);
                  }
                })
              } else {
                if(ing && ing.ing){
                  const existingIngredient = consIngs.find(p =>p.ing.name === ing.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + ing.qty,
                      ing: existingIngredient.ing
                    }
                    consIngs = consIngs.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
                  } else {
                    consIngs.push(ing);
                  }
                }
                else {
                  console.log(ing)
                }
              }
            })
            if(product.toppings.length){
              product.toppings.forEach(topping=>{
                topping.qty = round(topping.qty * product.quantity)
                if(topping.ing.ings.length){
                  topping.ing.ings.forEach(ig => {
                    const existingIngredient = consIngs.find(p =>p.ing.name === ig.ing.name);
                    if (existingIngredient) {
                      const updatedIng = {
                        qty: existingIngredient.qty + round(ig.qty * topping.qty),
                        ing: existingIngredient.ing
                      }
                        consIngs = consIngs.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
                    } else {
                      consIngs.push(ig);
                    }
                  })
                }
                else{
                  const existingIngredient = consIngs.find(p =>p.ing.name === topping.ing.name);
                  if (existingIngredient) {
                    existingIngredient.qty = round(existingIngredient.qty + topping.qty)
                    const updatedIng = {
                      qty: existingIngredient.qty + topping.qty,
                      ing: existingIngredient.ing
                    }
                    // if(updatedIng.ing.name === "Lapte Vegetal"){
                    //   console.log(updatedIng.qty)
                    // }
                    consIngs = consIngs.map(p => (p.ing.name === topping.ing.name ? updatedIng : p));
                  } else {
                    const ig = {
                      qty: topping.qty,
                      ing: topping.ing
                    }
                    consIngs.push(ig);
                  }
                }
              })
            }
          })
        })
      } 

      lastInventary.ingredients.forEach(ing => {
        const compareIng = {
          name: ing.name,
          um: ing.um,
          first: 0,
          second: ing.faptic,
          scripticUnload: 0,
          saleUnload: 0,
          gestiune: ing.gestiune,
          depVal: 0,
          price: ing.ing.price,
          dep: ing.dep,
          upload: {
            value: 0,
            entries: []
          },
        }
        const existingIng = ingredients.find(ingr => ingr.name === ing.name )
        if(existingIng){
          existingIng.second += ing.faptic
        } else {
          ingredients.push(compareIng)
        }
      })

  
    firstInventary.ingredients.forEach(ing => {
      const compareIng = {
        name: ing.name,
        um: ing.um,
        first: ing.faptic,
        second: 0,
        scripticUnload: 0,
        saleUnload: 0,
        gestiune: ing.gestiune,
        depVal: 0,
        price: ing.ing.price,
        dep: ing.dep,
        upload: {
          value: 0,
          entries: []
        },

      }
      const existingIng = ingredients.find(ingr => ingr.name === ing.name )
      if(existingIng){
        existingIng.first += ing.faptic
      } else {
        ingredients.push(compareIng)
      }
    })





    delIngs.forEach(ing => {
      const compareIng = {
        name: ing.ing.name,
        um: ing.ing.um,
        first: 0,
        second: 0,
        scripticUnload: 0,
        saleUnload: 0,
        gestiune: ing.gestiune,
        depVal: ing.qty,
        price: ing.ing.price,
        dep: ing.dep,
        upload: {
          value: 0,
          entries: []
        },
      }
      const existingIng = ingredients.find(ingd => ingd.name === compareIng.name)
      if(existingIng){
        existingIng.depVal += compareIng.depVal
      } else {
        ingredients.push(compareIng)
      }
    })

    consIngs.forEach(ing => {
      const compareIng = {
        name: ing.ing.name,
        um: ing.ing.um,
        first: 0,
        second: 0,
        scripticUnload: 0,
        saleUnload: ing.qty | 0,
        gestiune: ing.gestiune,
        depVal: 0,
        price: ing.ing.price,
        dep: ing.dep,
        upload: {
          value: 0,
          entries: []
        },
      }
      const existingIng = ingredients.find(ingd => ingd.name === compareIng.name)
      if(existingIng){
        existingIng.saleUnload += compareIng.saleUnload
      } else {
        ingredients.push(compareIng)
      }
    })

    ings.forEach(ing => {
      ing.uploadLog.forEach(log => {
        const logDate = new Date(log.date).setUTCHours(0,0,0,0)
        if(logDate >= startTime && logDate <= endTime && log.operation && log.operation.name === 'intrare'){
            const compareIng = ingredients.find(ingr => ingr.name === ing.name)
            if(compareIng) {
              compareIng.upload.value += log.qty
              compareIng.upload.entries.push(log)
            }
        }
      })
    })
   
    const compareInv = {
      dateFirst: start,
      dateSecond: end,
      ingredients: ingredients,
      firstInv: firstInventary._id,
      secondInv: lastInventary._id,
      locatie: loc,
      salePoint: point
    }

    console.log('hit')
    const newCompare = new ComparedInventary(compareInv)
    const savedCompare = await newCompare.save()
    console.log(savedCompare)
    res.status(200).json(savedCompare)
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }

}

module.exports.updateIngredientQuantity = async (req, res, next) => {
  try{
    const {inventaryId} = req.body
    const inventary = await Inventary.findById(inventaryId).populate({path: 'ingredients.ing', select: 'qty'})
    const updatePromises = inventary.ingredients.map(ing => {
      return Ingredient.updateOne(
        { _id: ing.ing._id },
        { qty: round(ing.faptic - (ing.scriptic - ing.ing.qty))}
      );
    });
      await Promise.all(updatePromises);
      inventary.updated = true
      const updatedInventary = await inventary.save()
      res.status(200).json({ message: "Ingredients Updated", inv: updatedInventary});
  }catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.getInventary = async (req, res, next) =>{
  try{
    const {inventaryId, loc, point} = req.query;
    if(inventaryId === 'last'){
      const inventary = await Inventary.findOne({locatie: loc, salePoint: point}).sort({ _id: -1 })
        .populate({path: 'ingredients.ing', select: 'price um'})
      res.status(200).json(inventary)
    } else if(inventaryId === "all"){
    
      const inventaries = await Inventary.find({locatie: loc, salePoint: point})
        .populate({path: 'ingredients.ing', select: 'price um'})
      res.status(200).json(inventaries)
    } else {

      const inventary = await Inventary.findById(inventaryId)
          .populate({path: 'ingredients.ing', select: 'price um'})
      res.status(200).json(inventary)
    }
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }
}


const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};


module.exports.updateUploadLog = async(req, res) => {
  try{
    const loc = '655e2e7c5a3d53943c6b7c53'

    const ings = await Ingredient.find({locatie: loc}).select('uploadLog')

    ings.forEach(async (ing) => {
      let newUpload =  []
      let compareArr = []
      ing.uploadLog.forEach(log => {
        const date = new Date(log.date)
        date.setUTCHours(0,0,0,0)
        const logToComp = {
          date: date,
          qty: log.qty,
          operation: log.operation.name,
          details: log.operation.details
        }
        const stringLog = JSON.stringify(logToComp)
        const duplicate = compareArr.find(l => l === stringLog)
        if(!duplicate){
          compareArr.push(stringLog)
          newUpload.push(log)
        } else {
          console.log('Found Duplicates')
        }
      })
      ing.uploadLog = newUpload
      await ing.save()
    })
    res.status(200).json({message: 'All done'})
  } catch(err){
    console.log(err)
  }
}

module.exports.deleteCigSheet = async (req, res) => {
  const {id}  = req.query
  try{
    await CigarsInv.findByIdAndDelete(id)
    res.status(200).json({message: 'Inventarul a fost sters cu success!'})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.saveCigSheet = async (req, res) => {
      const {sheet} = req.body
  try{
    const firstInv = await CigarsInv.findByIdAndUpdate(sheet._id, sheet, {new: true})
    const secInv = new CigarsInv({
      date: new Date(),
      products: firstInv.products.map(p => {
        return {
          name: p.name,
          first: p.second,
          found: p.second,
          sale: 0,
          second: 0,
          ing: p.ing
        }
      }),
      locatie: firstInv.locatie,
      salePoint: firstInv.salePoint,
      valid: false
    })
    const secondInv = await secInv.save()
    res.status(200).json({message: 'Situația a fost salavată!', first: firstInv, second: secondInv})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.getLastCigSheet = async (req, res) => {
  const {loc, point, mode} = req.query
  try{
    if(mode === 'last'){
      const invs = await CigarsInv.find({locatie: loc, salePoint: point}).sort({date: -1}).limit(2)
      res.status(200).json(invs)
    } else {
      const invs = await CigarsInv.find({locatie: loc, salePoint: point})
      res.status(200).json(invs)
    }
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.updateCigarsSheet = async(req, res, next) => {

  const { sheet } = req.body;
  try{
    const inv = await CigarsInv.findByIdAndUpdate(sheet._id, sheet, {new: true})
    res.status(200).json({message: 'Fișa a fost actualizată',  sheet: inv})
  } catch (error) {
    consol.elog(error)
    res.status(500).json(error)
  }

}



module.exports.updateStoc = async (req, res, next) => {
  //   const {loc} = req.query
  //   const ings = await Ingredient.find({locatie: loc, gestiune: 'bucatarie', productIngredient: false})
  //   const date = new Date('2024-6-1').setUTCHours(0,0,0,0)
    
  //  let num = 0
  //  for(let ing of ings){
  //   const inv = ing.inventary.find(inv => {
  //     const invDate = new Date(inv.day).setUTCHours(0,0,0,0)
  //     return invDate === date
  //   })
  //   let inn = 0
  //   let out = 0
  //   for (let inLog of ing.uploadLog){
  //     const inDate = new Date(inLog.date).setUTCHours(0,0,0,0)
  //     if(inDate > date){
  //       inn += inLog.qty
  //     }
  //   }
  //   for ( let outLog of ing.unloadLog){
  //     const outDate = new Date(outLog.date)
  //     if(outDate > date) {
  //       out += outLog.qty
  //     }
  //   }
  //   if(inv){
  //     num ++
  //     console.log(ing.name, 'cant inv', inv.faptic, 'cant intrata', inn, 'cantitate vanduta', out, 'qty actuala', inv.faptic + inn - out)
  //     ing.qty = round(inv.faptic + inn - out)
  //     await ing.save()
  //   }
  //  }
  //  console.log(num)
  
    res.status(200).json({messahe: 'all good in the ings world'})
  }



  module.exports.fixbuBulealaOvi = async(req, res) => {
    const {loc} = req.query
    try{
      // const firstDate = new Date('2024-12-02')
      // const fuckDate = new Date('2024-12-03')
      // firstDate.setUTCHours(23, 0, 0, 0, 0);
      // fuckDate.setUTCHours(23, 0, 0, 0, 0);
      // const ings = await Ingredient.find({locatie: loc, gestiune: 'bar'}).select('inventary name')
  
  
      // for(let ing of ings){
      //   const firstInv = ing.inventary.find(i => new Date(i.day).getTime() === firstDate.getTime())
      //   ing.inventary[ing.inventary.length - 1].faptic = firstInv.faptic
      //   const savedIng = await ing.save()
      //   console.log('inventar salvat pentru ingredientul--', savedIng.name)
      // }
  
      res.status(200).json({message: 'all done'})
  
    } catch(error) {
      console.log(error)
    }
  }
  

