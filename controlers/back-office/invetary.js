
const Ingredient = require('../../models/office/inv-ingredient');
const Inventary = require('../../models/office/inventary');
const ComparedInventary = require('../../models/office/comp-inv');
const io = require('socket.io-client');
const socket = io("https://socket.flowmanager.ro")
const {round} = require('../../utils/functions')



module.exports.createInventary = async (req, res, next) => {
  try{
    const {date, loc, point, gestiune} = req.body
    const invDate = new Date(date).setUTCHours(20,59,59,0)
    const ings = await Ingredient.find({locatie: loc, 'invGestiune.gestiune': gestiune, salePoint: point})
                    .select('name  dept um invGestiune')
                    .populate({path: 'dept', select:'name'})
                    .populate({path: 'invGestiune.gestiune', select: 'name'})
        
        let scripticValue = 0
        const mapIngredients =  ings.map(i => {
            const gest = i.invGestiune.find(g => g.gestiune._id.toString() === gestiune)
            if(gest){          
                for(let e of gest.entries){
                    scripticValue += (e.priceWithVat * e.qty)
                }
                const ing = {
                    ing: i._id,
                    name: i.name,
                    faptic: 0,
                    scriptic: gest.qty,
                    dep: i.dept.name,
                    um: i.um
                }
              return ing
            } else {
                console.log('Nu am gasit gestiune pe ingredient ', i.name)
                return undefined
            }
        }).filter(Boolean)

        const sortedIngredients = mapIngredients.sort((a,b) => b.name.localeCompare(a.name) )
        const inv = new Inventary({
          locatie: loc,
          salePoint: point,
          date: invDate,
          gestiune: gestiune,
          ingredients: sortedIngredients,
          scripticValue: round(scripticValue),
          updated: false
        })
        const savedInv = await inv.save()
        await savedInv.populate([
            { path: 'ingredients.ing', select: 'price um' },
            { path: 'gestiune', select: 'name' }
          ]);
        res.status(200).json({message: 'Inventarul a fost salvat!', inv: savedInv})
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }
}


module.exports.updateInventary = async (req, res) => {
    const {invId, ingId, value} = req.body
    try{

        const inventary = await Inventary.findById(invId)
        if(inventary.updated){
            return res.status(401).json({ message: 'Inventarul a fost folosit la actualizarea gestiunii, prin urmare nu poate fi modificat!' });
        }

        const dbIng  = await Ingredient.findById(ingId)
       
        const ing = inventary.ingredients.find(i => i.ing.toString() === ingId)
        if(ing){
            for(let g of  dbIng.invGestiune){
                if(g.gestiune.toString() === inventary.gestiune.toString()){
                    inventary.fapticValue = round(inventary.fapticValue - allocateFromNewest(g.entries, ing.faptic).totalCost)
                    inventary.fapticValue = round(inventary.fapticValue + allocateFromNewest(g.entries, value).totalCost)
                }
            }

            ing.faptic = value
        }
        const savedInv = await inventary.save()
        await savedInv.populate([
            { path: 'ingredients.ing', select: 'price um inventary' },
            { path: 'gestiune', select: 'name' }
          ]);

        socket.emit('inventary', JSON.stringify({inv: savedInv}))

        res.status(200).json({message: 'Inventarul a fost actualizat cu success! ', inv: savedInv})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

 
 module.exports.getInventary = async (req, res) =>{
   try{
     const {inventaryId, loc, point} = req.query;
     if(inventaryId === "all"){
       const inventaries = await Inventary.find({locatie: loc, salePoint: point})
                            .select('-ingredients')
                            .populate({path: 'gestiune', select: 'name'})
       res.status(200).json(inventaries)
     } else {
       const inventary = await Inventary.findById(inventaryId)
                        .populate([
                            { path: 'ingredients.ing', select: 'price um inventary' },
                            { path: 'gestiune', select: 'name' }
                        ]);
       res.status(200).json(inventary)
     }
   } catch(err){
     console.log(err)
     res.status(500).json(err)
   }
 }


 module.exports.deleteInventary = async(req, res) => {
    const {invId} = req.query
    try{
        const inv = await Inventary.findById(invId)
        if (!inv) {
            return res.status(404).json({ message: 'Inventarul nu a fost găsit!' });
          }
          
          if (inv.updated) {
            return res.status(401).json({ message: 'Inventarul a fost folosit la actualizarea gestiunii, prin urmare nu poate fi șters!' });
          }
          
          await inv.deleteOne();
          return res.status(200).json({ message: 'Inventarul a fost șters cu succes!' });
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
 }


 module.exports.updateGestiune = async (req, res) =>{
   try{
    const {id} = req.body

    const inventary = await Inventary.findById(id)

    const promises = inventary.ingredients.map(async (i) => {
        const dbIng = await Ingredient.findById(i.ing)
        if(dbIng){
            consoel.log(`Am gasit ingredient in baza de date procesare ${dbIng.name}....`)
            const ingGest = dbIng.invGestiune.find(g => g.gestiune.toString() === inventary.gestiune.toString())
            if(ingGest){
                console.log(`Am gasit gestiunea inventarului ${ingGest.name}....`)
                console.log('Cantitate gesiune ', ingGest.qty)
                console.log('Cantitate ingredient inventar faptic ', i.faptic)
                console.log('Diferenta de modificat din inventar ', i.scriptic - i.faptic)
                ingGest.qty = round(ingGest.qty - (i.scriptic - i.faptic))
                if(ingGest.entries.length){
                    console.log(ingGest.entries)
                    console.log('Am gasit intrari de marfa pe gesiune ', ingGest.entries.length)
                    console.log('Modific cantitatile....')
                    const entries = allocateFromNewest(ingGest.entries, ingGest.qty).allocations
                    ingGest.entries = entries
                    console.log(ingGest.entries)
                } else {
                    console.log('Nu am gasit intrari pe gestiune...')
                    console.log('Adaug intrare de inventar cu cantitatea faptica ', ingGest.qty,)
                    const entry = {
                        qty: ingGest.qty,
                        date: inventary.date,
                        priceNoVat: dbIng.price,
                        priceWithVat: round(dbIng.price * (1 + dbIng.tva / 100)),
                        inQty: i.faptic,
                        suplierName: 'Intrare din inventar'
                    }
                    ingGest.entries.push(entry)
                    console.log('Intrare adaugata ', ingGest.entries)
                }
            }
            dbIng.qty = round((dbIng.invGestiune ?? []).reduce((sum, g) => sum + (Number(g.qty) || 0), 0))
         return dbIng.save().then(i => {
            console.log(`Ingredientul ${i.name} a fost actulizat cu succees!`)
            console.log('Cantitate totala ', i.qty)
         })
        }
    })

    await Promise.all(promises)

    res.status(200).json({message: 'Gestiunea a fost modificată după inventar!'})
   } catch(err){
     console.log(err)
     res.status(500).json(err)
   }
 }



function allocateFromNewest(entries, globalQty) {
    if (!Array.isArray(entries) || globalQty <= 0) {
      return 0;
    }
    // Sort by date: newest first
    const sorted = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ); 
    let remaining = globalQty;
    const allocations = [];
    for (const e of sorted) {
      if (remaining <= 0) break;
      const useQty = Math.min(remaining, Number(e.qty) || 0);
      if (useQty > 0) {
        allocations.push({
          priceWithVat: Number(e.priceWithVat) || 0,
          priceNoVat: Number(e.priceNovat) || 0,
          inQty: Number(e.inQty) || 0,
          suplierName: e.suplierName,
          nir: e.nir,
          qty: useQty,
          date: new Date(e.date)
        });
        remaining -= useQty;
      }
    }
    // If still remaining, price it using the oldest entry's price
    if (remaining > 0 && allocations.length > 0) {
      const oldest = allocations[allocations.length - 1];
      oldest.qty = round(oldest.qty + remaining)
      remaining = 0;
    }
  
    const totalCost = allocations.reduce((sum, a) => sum + a.price * a.qty, 0);  
    return {totalCost, allocations};
  }
  
  


 
