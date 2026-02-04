
const Ingredient = require('../../models/office/inv-ingredient');
const Inventary = require('../../models/office/inventary');
const ComparedInventary = require('../../models/office/comp-inv');
const DelProd = require('../../models/office/product/deletetProduct')
const Order = require('../../models/office/product/order')
const ImpSheet = require('../../models/office/imp-sheet')
const Invoice = require('../../models/office/invoice')


const io = require('socket.io-client');
const socket = io("https://socket.flowmanager.ro")
const {round} = require('../../utils/functions')



module.exports.createInventary = async (req, res, next) => {
  try{
    const {date, loc, point, gestiune} = req.body
    const invDate = new Date(date).setUTCHours(20,59,59,0)
    const ings = await Ingredient.find({locatie: loc, 'invGestiune.gestiune': gestiune, salePoint: point, status: true})
                    .select('name  dept um invGestiune price')
                    .populate({path: 'dept', select:'name'})
                    .populate({path: 'invGestiune.gestiune', select: 'name'})
        
        let scripticValue = 0
      console.log('HIT INVENTARY FUNCTON')
        for(let i of ings){
          if(i.name === 'Kofiti indian tonic'){
            console.log(i)
          }
        }
        const mapIngredients =  ings.map(i => {
            const gest = i.invGestiune.find(g => g.gestiune._id.toString() === gestiune)
            if(gest){          
                for(let e of gest.entries){
                    scripticValue += (e.priceNoVat * e.qty)
                }
                const ing = {
                    ing: i._id,
                    name: i.name,
                    faptic: 0,
                    scriptic: gest.qty,
                    lastPrice: round(i.price) || 0,
                    averagePrice: round(getAveragePrice(gest)) || round(i.price) || 0,
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


function getAveragePrice(item) {
  const totalCost = item.entries.reduce((sum, e) => sum + (e.qty * e.priceNoVat), 0);
  const totalQty = item.entries.reduce((sum, e) => sum + e.qty, 0);

  return totalCost / totalQty;
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
      //  const inventaries = await Inventary.find()
      //                           .populate({ path: 'ingredients.ing', select: 'price invGestiune' })
      //                           .lean()
      //       await updateInventaries(inventaries)
      //       res.status(200).json([inventaries[0]])
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


 async function updateInventaries(invs){
  const invsToUpdate = []

  for(let i of invs){
    for(let ing of i.ingredients){
      if(ing.ing){
        const gest = ing.ing.invGestiune?.find(g => g.gestiune?.toString() === i.gestiune?.toString())
        ing.lastPrice = round(ing.ing.price)
        if(gest){
          ing.averagePrice = round(getAveragePrice(gest)) || round(ing.ing.price)
        } else {
          ing.averagePrice = round(ing.ing.price)
        }

      } else {
        console.log('Inventary ing without ING ', ing.name, ing.ing)
      }
    }
    invsToUpdate.push(i)
  }


    const promises = invsToUpdate.map(i =>
      Inventary.findByIdAndUpdate(i._id, i, { new: true })
    )

    await Promise.all(promises)
    console.log('Inventare verified:', invs.length, '→ Updated:', invsToUpdate.length);

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
            const ingGest = dbIng.invGestiune.find(g => g.gestiune.toString() === inventary.gestiune.toString())
            if(ingGest){
                // ingGest.qty = dbIng.qty + i.faptic
                const diference = i.scriptic - ingGest.qty
                ingGest.qty = round(i.faptic - diference)
                if(ingGest.entries.length){
                    const entries = allocateFromNewest(ingGest.entries, ingGest.qty).allocations
                    ingGest.entries = entries
                } else {
                    const entry = {
                        qty: ingGest.qty,
                        date: inventary.date,
                        priceNoVat: i.averagePrice,
                        priceWithVat: round(i.averagePrice * (1 + dbIng.tva / 100)),
                        inQty: i.faptic,
                        suplierName: 'Intrare din inventar'
                    }
                    ingGest.entries.push(entry)
                }
            }
            dbIng.qty = round((dbIng.invGestiune ?? []).reduce((sum, g) => sum + (Number(g.qty) || 0), 0))
            // dbIng.qty = round(dbIng.qty + i.faptic)
         return dbIng.save().then(i => {
            console.log(`Ingredientul ${i.name} a fost actulizat cu succees!`)
            console.log('Cantitate totala ', i.qty)
         })
        }
    })

    await Promise.all(promises)
   const savedInv =  await Inventary.findByIdAndUpdate(id, {$set: {updated: true}})
    res.status(200).json({message: 'Gestiunea a fost modificată după inventar!', inv: savedInv})
   } catch(err){
     console.log(err)
     res.status(500).json(err)
   }
 }


module.exports.getComaredInv = async (req, res) => {

    try{
        const {point, loc, id} = req.query
        if(id){
          const compInv =  await ComparedInventary.findById(id).populate({path: 'gestiune', select: 'name'}).lean()
            res.status(200).json(compInv)
        } else {
            // const compareInv = await ComparedInventary.find({}).populate({path: 'gestiune', select: 'name'}).lean()
            // await modifyCompare(compareInv)
            const compareInv = await ComparedInventary.find({locatie: loc, salePoint: point}).populate({path: 'gestiune', select: 'name'}).lean()
            res.status(200).json(compareInv)
        }
    } catch(error){
        consol.log(error)
        res.status(500).json('Eroare la descacarea inventar compus', error)
    }
}


async function modifyCompare(invs){
  const invsToUpdate = []

  for(let i of invs){
    for(let ing of i.ingredients){
        ing.firstPrice = ing.price
        ing.secondPrice = ing.price
    }
    invsToUpdate.push(i)
  }


    const promises = invsToUpdate.map(i =>
      ComparedInventary.findByIdAndUpdate(i._id, i, { new: true })
    )

    await Promise.all(promises)
    console.log('Inventare verified:', invs.length, '→ Updated:', invsToUpdate.length);

}


module.exports.deleteCompare = async (req, res) => {
    try{
        const {id} = req.query
        await ComparedInventary.findByIdAndDelete(id)
        res.status(200).json({message: 'Inventarul comparat a fost șters cu sucess!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.compareScriptic = async (req, res) => {
  try {
    const { firstInvId, secondInvId, loc, point } = req.body;

    // 1) Load the two inventories
    const [firstInventary, lastInventary] = await Promise.all([
      Inventary.findById(firstInvId).populate({ path: 'ingredients.ing', select: 'price name um' }),
      Inventary.findById(secondInvId).populate({ path: 'ingredients.ing', select: 'price name um' }),
    ]);
    if (!firstInventary || !lastInventary) {
      return res.status(404).json({ message: 'Inventar(ul) nu a fost găsit.' });
    }

    const startTime = new Date(firstInventary.date);
    const endTime   = new Date(lastInventary.date);

    // already compared?
    // const existing = await ComparedInventary.findOne({
    //   firstInv: firstInventary._id,
    //   secondInv: lastInventary._id,
    //   locatie: loc,
    //   salePoint: point,
    // });
    // if (existing) return res.status(200).json(existing);

    // 2) Load the rest in parallel
    const [ings, delProds, impSheets, orders, invoices] = await Promise.all([
      Ingredient.find({ locatie: loc, salePoint: point }).select('name uploadLog um').lean(),
      DelProd.find({
        locatie: loc,
        createdAt: { $gte: startTime, $lt: endTime },
        reason: 'dep',
        salePoint: point,
      })
        .populate({ path: 'billProduct.ings.ing', select: 'name ings um', populate: { path: 'ings.ing', select: 'name um' } })
        .populate({ path: 'billProduct.toppings.ing', select: 'name ings um', populate: { path: 'ings.ing', select: 'name um' } }).lean(),
      ImpSheet.find({ locatie: loc, date: { $gte: startTime, $lte: endTime }, salePoint: point })
        .populate({ path: 'ings.ing', select: 'name um ings productIngredient price', populate: { path: 'ings.ing', select: 'name um price' } }).lean(),
      Order.find({ locatie: loc, paymentDate: { $gte: startTime, $lte: endTime }, salePoint: point , status: 'done'})
        .populate([
          { path: 'products.ings.ing',     populate: { path: 'ings.ing' } },
          { path: 'products.toppings.ing', populate: { path: 'ings.ing' } },
        ]).lean(),
      Invoice.find({locatie: loc, salePoint: point})
            .populate({ path: 'products.ings.ing', populate: { path: 'ings.ing' } })
            .lean(),
    ]);

    let filtredInvoicese = []

    console.log('comenzi', orders.length)

    for(let i of invoices){
      const date = new Date(i.issueDate)
      const start = startTime.getTime()
      const end = endTime.getTime()
      const invoiceTime = date.getTime()
      if(invoiceTime >= start && invoiceTime <= end){
        filtredInvoicese.push(i)
      }
    }
    // === helpers ============================================================
    const r = (n) => round(n); // or roundd
    const idStr = (x) => (x?._id ? x._id.toString() : String(x));
    const sameId = (a, b) => a && b && idStr(a) === idStr(b);
    const gestMatch = (wrap) => wrap?.gestiune && sameId(wrap.gestiune, firstInventary.gestiune);

    // const gestMatch = (w) =>
    //   !w?.gestiune || sameId(w.gestiune, firstInventary.gestiune);
    // fast accumulators by _id
    const depMap  = new Map(); // deletions / sheets → depVal
    const consMap = new Map(); // orders consumption → saleUnload

    function addTo(map, ingDoc, qty) {
      if (!ingDoc?._id) return;
      const key = idStr(ingDoc._id);
      const prev = map.get(key);
      if (prev) prev.qty = r(prev.qty + qty);
      else map.set(key, { qty: r(qty), ing: ingDoc });
    }

    function processLeaf(map, w, mult = 1) {

      if (!w?.ing?._id || !gestMatch(w)) return;
      const qty = r((w.qty || 0) * (mult || 1));
      if (qty) addTo(map, w.ing, qty);
    }

    function processComposite(map, w, mult = 1) {
      if (!w?.ing?.ings?.length) return;
      for (const sub of w.ing.ings) {
        if(!sub.gestiune){
          console.log('Ingredient fara gestiune compus', sub.ing.name)
        }
        if (!sub?.ing?._id || !gestMatch(sub)) continue;
        const qty = r((sub.qty || 0) * (w.qty || 0) * (mult || 1));
        if (qty) addTo(map, sub.ing, qty);
      }
    }

    // === 3) impSheets -> depMap
    for (const sheet of impSheets) {
      for (const w of sheet.ings) {
        if (w?.ing?.productIngredient) processComposite(depMap, w, 1);
        if(!w.gestiune){
          console.log('Ingredient fara gestiune fise de deprecieri', w.ing.name)
        }
         processLeaf(depMap, w, 1);
      }
    }

    // === 4) delProds -> depMap
    for (const dp of delProds || []) {
      const bp = dp.billProduct; if (!bp) continue;
      for (const w of bp.ings || []) {
          if(!w.gestiune){
              console.log('Ingredient fara gestiune produse sterse', w.ing.name)
        }
        if (w?.ing?.ings?.length) {
          for (const sub of w.ing.ings) {
            if(!sub.gestiune){
              console.log('Ingredient fara gestiune compus produse sterse', sub.ing.name)
            }
            if (!sub?.ing?._id || !gestMatch(sub)) continue;
            const qty = r((sub.qty || 0) * (w.qty || 0));
            if (qty) addTo(depMap, sub.ing, qty);
          }
        } 
         processLeaf(depMap, w, 1);
      }
      for (const w of bp.toppings || []) {
        if (w?.ing?.ings?.length) {
          for (const sub of w.ing.ings) {
            if (!sub?.ing?._id || !gestMatch(sub)) continue;
            const qty = r((sub.qty || 0) * (w.qty || 0));
            if (qty) addTo(depMap, sub.ing, qty);
          }
        } 
         processLeaf(depMap, w, 1);
      }
    }
    // === 5) orders -> consMap
    for (const order of orders || []) {
      for (const prod of order.products || []) { 
        const mult = r(prod.quantity || 1);

        for (const w of prod.ings || []) {
          if(!w.ing){
            console.log('Lipsa ingredient orders', prod.name, order.paymentDate.toString(), order.index)
            console.log('CANTITATE', w.qty)
          }
          if(!w.gestiune){
            console.log('Ingredient fara gestiune comenzi', w.ing.name)
          }
          // if(w.ing.name === 'Apa Plata 0.5'){
          //   console.log(w.ing.name, w.qty)
          // }
          const scaled = { ...w, qty: r((w.qty || 0) * mult) };
          if(scaled.ing?.name === 'Oua'){
            console.log('Oua ', scaled.qty)
          }
          // console.log(w)
          if (scaled?.ing?.ings?.length) {
            for (const sub of scaled.ing.ings) {
              if (!sub?.ing?._id || !gestMatch(sub)) continue;
              const qty = r((sub.qty || 0) * (scaled.qty || 1));
              if (qty) addTo(consMap, sub.ing, qty);
            }
          }
          processLeaf(consMap, scaled, 1);
        }

        for (const t of prod.toppings || []) {
          const scaled = { ...t, qty: r((t.qty || 0) * mult) };
          if (scaled?.ing?.ings?.length) {
            for (const sub of scaled.ing.ings) {
              if (!sub?.ing?._id || !gestMatch(sub)) continue;
              const qty = r((sub.qty || 0) * (scaled.qty || 0));
              if (qty) addTo(consMap, sub.ing, qty);
            }
          }
           processLeaf(consMap, scaled, 1);
        }
      }
    }

    console.log('facturi filtrate', filtredInvoicese.length)
    for (const invoice of filtredInvoicese || []) {
      for (const prod of invoice.products || []) {
        const mult = r(prod.quantity || 1);

        for (const w of prod.ings || []) {
          if(!w.ing){
            console.log('Lipsa ingredient invoice', prod.name, invoice.issueDate, invoice.invoiceNumber)
          }
          const scaled = { ...w, qty: r((w.qty || 0) * mult) };
          if(scaled.ing?.name === 'Oua'){
            // console.log(scaled.gestiune)
          }
          // console.log(w)
          if (scaled?.ing?.ings?.length) {
            for (const sub of scaled.ing.ings) {
              if (!sub?.ing?._id || !gestMatch(sub)) continue;
              const qty = r((sub.qty || 0) * (scaled.qty || 0));
              if (qty) addTo(consMap, sub.ing, qty);
            }
          }
           processLeaf(consMap, scaled, 1);
        }
      }
    }

    // === 6) Build final "ingredients" BY ID =================================
    // compareMap: key = ingredient _id (string)
    const compareMap = new Map(); // value shape below

    function upsertById(ingDoc, mut) {
      if (!ingDoc?._id) return;
      const key = idStr(ingDoc._id);
      let obj = compareMap.get(key);
      if (!obj) {
        obj = {
          _id: ingDoc._id,
          name: ingDoc.name || '',
          um: ingDoc.um || '',
          first: 0,
          second: 0,
          scripticUnload: 0,
          saleUnload: 0,
          depVal: 0,
          firstPrice: ingDoc.price || 0,
          secondPrice: ingDoc.price || 0,
          price: ingDoc.price || 0,
          dep: undefined,
          upload: { value: 0, entries: [] },
        };
        compareMap.set(key, obj);
      }
      mut(obj);
    }

    // first inventory → "first"
    for (const it of firstInventary?.ingredients || []) {
      const ingDoc = it.ing || { _id: undefined, name: it.name, um: it.um, price: it.ing?.price };
      upsertById(ingDoc, (ci) => {
        ci.name  = ci.name || it.name;
        ci.um    = ci.um   || it.um;
        ci.first = r(ci.first + (it.faptic || 0));
        ci.firstPrice = it.averagePrice ?? ci.firstPrice ?? 0;
        ci.price = it.lastPrice ?? ci.price ?? 0
        ci.dep ??= it.dep;
      });
    }

    // last inventory → "second"
    for (const it of lastInventary?.ingredients || []) {
      const ingDoc = it.ing || { _id: undefined, name: it.name, um: it.um, price: it.ing?.price };
      upsertById(ingDoc, (ci) => {
        ci.name   = ci.name || it.name;
        ci.um     = ci.um   || it.um;
        ci.second = r(ci.second + (it.faptic || 0));
        ci.secondPrice = it.averagePrice ?? ci.secondPrice ?? 0;
        ci.price = it.lastPrice ?? ci.price ?? 0
        ci.dep   ??= it.dep;
      });
    }

    // depMap → depVal
    for (const { qty, ing } of depMap.values()) {
      upsertById(ing, (ci) => {
        ci.depVal = r(ci.depVal + (qty || 0));
        ci.um   = ci.um || ing?.um || '';
        ci.name = ci.name || ing?.name || '';
        ci.price = ci.price ?? ing?.price ?? 0;
      });
    }

    // consMap → saleUnload
    for (const { qty, ing } of consMap.values()) {
      upsertById(ing, (ci) => {
        ci.saleUnload = r(ci.saleUnload + (qty || 0));
        ci.um   = ci.um || ing?.um || '';
        ci.name = ci.name || ing?.name || '';
        ci.price =  ci.price ?? ing?.price ?? 0;
      });
    }

    // uploads (by ingredient _id)
    // Build a quick lookup of compare objects by ingredient name too (only for fallback),
    // but prefer _id matches from the Ingredient list.
    const compareById = (id) => (id ? compareMap.get(idStr(id)) : undefined);

    for (const ingDoc of ings || []) {
      const comp = compareById(ingDoc._id);
      if (!comp) continue; // if it never appeared elsewhere, skip uploads

      for (const log of ingDoc.uploadLog || []) {
        if(log.operation?.name === 'productie'){
          console.log(ingDoc.name)
        }
        const d = new Date(log.date);
        // compare by day (UTC 00:00)
        const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        if (t >= startTime.getTime() && t <= endTime.getTime() && (log.operation?.name === 'intrare' || log.operation?.name === 'productie')) {
          comp.upload.value = r(comp.upload.value + (log.qty || 0));
          comp.upload.entries.push(log);
        }
      }
    }

    // materialize to array
    const ingredients = Array.from(compareMap.values());

    // === 7) Save
    const savedCompare = await new ComparedInventary({
      dateFirst: firstInventary.date,
      dateSecond: lastInventary.date,
      ingredients,
      firstInv: firstInventary._id,
      secondInv: lastInventary._id,
      locatie: loc,
      salePoint: point,
      gestiune: firstInventary.gestiune,
    }).save();

    // console.log(savedCompare)
    await savedCompare.populate({ path: 'gestiune', select: 'name' });
    res.status(200).json({ message: 'Inventarul comparat a fost generat cu succes!', inv: savedCompare });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};



function allocateFromNewest(entries, globalQty) {
    if (!Array.isArray(entries) || globalQty <= 0) {
      return {totalCost: 0};
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
  
    const totalCost = allocations.reduce((sum, a) => sum + a.priceNoVat * a.qty, 0);  
    return {totalCost, allocations};
  }
  
  


 
