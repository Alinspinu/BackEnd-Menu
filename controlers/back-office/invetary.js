
const Ingredient = require('../../models/office/inv-ingredient');
const Inventary = require('../../models/office/inventary');
const ComparedInventary = require('../../models/office/comp-inv');
const io = require('socket.io-client');
const socket = io("https://socket.flowmanager.ro")



module.exports.createInventary = async (req, res, next) => {
  try{
    const {date, loc, point, gestiune} = req.body
    const invDate = new Date(date).setUTCHours(20,59,59,0)
    const ings = await Ingredient.find({locatie: loc, 'invGestiune.gestiune': gestiune, salePoint: point})
                    .select('name  dept um invGestiune')
                    .populate({path: 'dept', select:'name'})
                    .populate({path: 'invGestiune.gestiune', select: 'name'})

        const mapIngredients =  ings.map(i => {
            const gest = i.invGestiune.find(g => g.gestiune._id.toString() === gestiune)
            if(gest){          
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
    const {invId, ingId, value, invIndex} = req.body
    try{

        const inventary = await Inventary.findById(invId)
        if(inventary.updated){
            return res.status(401).json({ message: 'Inventarul a fost folosit la actualizarea gestiunii, prin urmare nu poate fi modificat!' });
        }

        const dbIng  = await Ingredient.findById(ingId)
        const ingInv = dbIng.inventary.find(i => i.index === invIndex)
        if(ingInv) {
            ingInv.faptic = value
            await dbIng.save()
        }   
        
        const ing = inventary.ingredients.find(i => i.ing.toString() === ingId)
        if(ing){
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
                            .select('gestiune date updated')
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

    res.status(200)
   } catch(err){
     console.log(err)
     res.status(500).json(err)
   }
 }


 
