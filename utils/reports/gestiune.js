
const Product = require('../../models/office/product/product')
const SubProduct = require('../../models/office/product/sub-product')

const {normalizeText, round, formatedDateToShow} = require('../functions')



async function createRG(start, end, nirs, ings, gest, orders, in0, in11, in21, dep, invoices){

    // const startDate = new Date(start).setHours(0,0,0,0)
    // const endDate = new Date(end).setHours(23,59,59, 9999)
    const days = getDaysBetween(start, end)

    let inv11Value = in11
    let inv21Value = in21
    let inv0Value = in0

    totalIn0 = 0
    totalIn11 = 0
    totalIn21 = 0

    totalOut0 = 0
    totalOut11 = 0
    totalOut21 = 0

    totalOutBacsis = 0
    totalOutSGR = 0


    for(let i of invoices){
      const day = days.find(d => new Date(d.date).toDateString() === new Date(i.createdAt).toDateString())
      if(day){

        for(let p of i.products){
          p.tva = p.vatPrecent
          p.discount = p.discount?.value || 0
          if(p.productId){
            const dbProduct = p.productId
            if(!dbProduct.departament) console.log('produst fara departament ' , p.name)
              if(dbProduct.departament?.toString() === dep){
                let sgrTax = 0
                if(dbProduct.sgrTax){
                  sgrTax = 0.5 * p.quantity
                  const existinSGREntry = day.entries.find(e => e.description === 'Vanzare SGR')
                  if(existinSGREntry){
                    existinSGREntry.value += sgrTax
                  } else {
                    const entry = {
                      date: i.createdAt,
                      description: 'Vanzare SGR',
                      nrDoc: i.invoiceNumber,
                      value: sgrTax,
                      type: 'iesire',
                      docId: i._id.toString(), 
                      tva: 0
                    }
                    day.entries.push(entry)
                  }
                  totalOutSGR += sgrTax
                  totalOut0 += sgrTax
    
                }
                if(p.ings[0]){
                  if(p.ings[0].gestiune){
                    if(p.ings[0].gestiune.toString() === gest){
                        const price = round(((p.price * p.quantity) - p.discount)-sgrTax)
    
                        if(p.tva === 11){
                          totalOut11 += price
                        }
                        if(p.tva === 21){
                          totalOut21 += price
                        }
    
                        const existingEntry = day.entries.find(e => e.description === 'Vanzare cu amanuntul' && e.tva === p.tva)
                        if(existingEntry){
                          existingEntry.value += price
                        } else {
                          const entry = {
                            date: i.createdAt,
                            description: 'Vanzare cu amanuntul',
                            nrDoc: i.invoiceNumber,
                            value: price,
                            type: 'iesire',
                            docId: i._id.toString(), 
                            tva: p.tva,
                          }
                          day.entries.push(entry)
                        }
                      } else {
                        console.log('ingredient gasit ca marfa cu alta gestiune decat bar ', p.name, ' ',  p.ings[0].gestiune)
                      }
                    } else {
                      console.log('ingredient fara gestiune', p.name)
                    }
                  } else {
                    console.log('ingredient fara ingredient', p.name)
                  }
                }
              }
          }
        }

      }
    



    for(let o of orders){
      const day = days.find(d => new Date(d.date).toDateString() === new Date(o.createdAt).toDateString())
      if(day){
      if(o.tips && o.tips > 0){
        const existingTipsEntry = day.entries.find(e => e.description === 'Vanzare Bacsis' )
        if(existingTipsEntry){
          existingTipsEntry.value += o.tips
        } else {
          const entry = {
            date: o.createdAt,
            description: 'Vanzare Bacsis',
            nrDoc: o.dayCounter,
            value: o.tips,
            type: 'iesire',
            docId: o._id.toString(), 
            tva: 0
          }
          day.entries.push(entry)
        }
        totalOutBacsis += o.tips
        totalOut0 += o.tips
      }
      for(let p of o.products){
        if(!p.departament) console.log('produst fara departament ' , p.name)
          if(p.departament?.toString() === dep){
            let sgrTax = 0
            if(p.sgrTax){
              sgrTax = 0.5 * p.quantity
              const existinSGREntry = day.entries.find(e => e.description === 'Vanzare SGR')
              if(existinSGREntry){
                existinSGREntry.value += sgrTax
              } else {
                const entry = {
                  date: o.createdAt,
                  description: 'Vanzare SGR',
                  nrDoc: o.dayCounter,
                  value: sgrTax,
                  type: 'iesire',
                  docId: o._id.toString(), 
                  tva: 0
                }
                day.entries.push(entry)
              }
              totalOutSGR += sgrTax
              totalOut0 += sgrTax

            }
            if(p.ings[0]){
              if(p.ings[0].gestiune){
                if(p.ings[0].gestiune.toString() === gest){
                    const price = round(((p.price * p.quantity) - p.discount)-sgrTax)

                    if(p.tva === 11){
                      totalOut11 += price
                    }
                    if(p.tva === 21){
                      totalOut21 += price
                    }

                    const existingEntry = day.entries.find(e => e.description === 'Vanzare cu amanuntul' && e.tva === p.tva)
                    if(existingEntry){
                      existingEntry.value += price
                    } else {
                      const entry = {
                        date: o.createdAt,
                        description: 'Vanzare cu amanuntul',
                        nrDoc: o.dayCounter,
                        value: price,
                        type: 'iesire',
                        docId: o._id.toString(), 
                        tva: p.tva,
                      }
                      day.entries.push(entry)
                    }
                  } else {
                    console.log('ingredient gasit ca marfa cu alta gestiune decat bar ',  formatedDateToShow(o.createdAt), ' ', p.quantity, ' ',   p.name, ' ',  p.ings[0].gestiune)
                  }
                } else {
                  console.log('ingredient fara gestiune', p.name)
                }
              } else {
                console.log('ingredient fara ingredient', p.name)
              }
            }
          }
      }
    }

    for(let ing of ings){
      for(let nir of nirs){
        const day = days.find(d => new Date(d.date).toDateString() === new Date(nir.documentDate).toDateString())
        if(day){
        for(let i of nir.ingredients){
          let tva = i.tva
          if(i.invGestiune.toString() === gest){
            if(i.ing.toString() === ing._id.toString()){
              if(tva === 0 && i.name !== 'Taxa SGR'){
                const prod = await Product.findOne({'ings.ing': i.ing}).select('tva').lean()
                if(prod && prod.tva){
                  tva = prod.tva
                } else {
                  const sub = await SubProduct.findOne({'ings.ing': i.ing}).select('tva').lean()
                  if(sub && sub.tva){
                    tva = sub.tva
                  }
                }
              }

              if(tva === 0){
                totalIn0 += (i.sellPrice * i.qty)
              }
              if(tva === 11){
                totalIn11 += (i.sellPrice * i.qty)
              }

              if(tva === 21){
                totalIn21 += (i.sellPrice * i.qty)
              }
            
                const existingEntry = day.entries.find(e => e.docId === nir._id.toString() && e.tva === tva)
                if(existingEntry){
                    existingEntry.value += (i.sellPrice * i.qty)
                } else {
                  const entry = {
                    date: nir.documentDate,
                    description: nir.suplier.name,
                    nrDoc: nir.nrDoc,
                    value: i.sellPrice * i.qty,
                    type: 'intrare',
                    docId: nir._id.toString(),
                    tva: tva
                  }
                  day.entries.push(entry)
                }
              }
  
            }
          }
          }
      }
    }
    days[0].in0 = +inv0Value;
    days[0].in11 = +inv11Value;
    days[0].in21 = +inv21Value;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
    
      if (!day) {
        console.warn(`⚠️ Missing day at index ${i}`);
        continue;
      }
    
      day.out0 = day.in0 || 0;
      day.out11 = day.in11 || 0;
      day.out21 = day.in21 || 0;
    
      // console.log(`📅 Day ${i + 1} (${day.date || 'no date'})`);
      // console.log(`   Starting IN 0%: ${day.in0}`);
      // console.log(`   Starting IN 11%: ${day.in11}`);
      // console.log(`   Starting IN 21%: ${day.in21}`);
    
      for (let e of day.entries || []) {
        if (e.type === 'intrare') {
          if(e.tva === 0){
            day.out0 += e.value;
            // console.log(`   ➕ Intrare: +${e.value} → OUT 0%: ${day.out0}`);
          } else if(e.tva === 11){
            day.out11 += e.value;
            // console.log(`   ➕ Intrare: +${e.value} → OUT 11%: ${day.out11}`);
          } else if(e.tva === 21){
            day.out21 += e.value;
            // console.log(`   ➕ Intrare: +${e.value} → OUT 21%: ${day.out21}`);
          } else {
            // console.log(`   ⚠️ Unknown entry TVA:`, e.tva);
          }

        } else if (e.type === 'iesire') {
          if(e.tva === 0){
            day.out0 -= e.value;
            // console.log(`   ➖ Iesire: -${e.value} → OUT 0%: ${day.out0}`);
          } else if(e.tva === 11){
            day.out11 -= e.value;
            // console.log(`   ➖ Iesire: -${e.value} → OUT 11%: ${day.out11}`);
          } else if( e.tva === 21){
            day.out21 -= e.value;
            // console.log(`   ➖ Iesire: -${e.value} → OUT 21%: ${day.out21}`);
          } else{
            // console.log(`   ⚠️ Unknown entry TVA:`, e.tva);
          }
        } else {
          // console.log(`   ⚠️ Unknown entry type:`, e);
        }
      }
    
      // console.log(`   🔄 Resulting OUT 0%: ${day.out0}`);
      // console.log(`   🔄 Resulting OUT 11%: ${day.out11}`);
      // console.log(`   🔄 Resulting OUT 21%: ${day.out21}`);
      // console.log('----------------------------------------');
    
      if (days[i + 1]) {
        days[i + 1].in0 = day.out0;
        days[i + 1].in11 = day.out11;
        days[i + 1].in21 = day.out21;
      }
    }
    console.log(typeof +inv0Value)
    const totals = {
      totalIn0: round(totalIn0 + +inv0Value),
      totalIn11: round(totalIn11 + +inv11Value),
      totalIn21: round(totalIn21 + +inv21Value),
      totalOut0: round(totalOut0),
      totalOut11: round(totalOut11),
      totalOut21: round(totalOut21),
      totalOutBacsis: round(totalOutBacsis),
      totalOutSGR: round(totalOutSGR)
    }

    return {days, totals}
}



// function getDaysBetween(startDateStr, endDateStr) {
//     const startDate = new Date(startDateStr);
//     const endDate = new Date(endDateStr);
//     const result = [];
  
//     // Normalize time to midnight
//     startDate.setHours(0, 0, 0, 0);
//     endDate.setHours(0, 0, 0, 0);
  
//     for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//       result.push({
//         date: new Date(d).toISOString(),
//         in0: 0,
//         in11: 0,
//         in21: 0,
//         out0: 0,
//         out11: 0,
//         out21: 0,
//         entries: []
//       });
//     }
  
//     return result;
//   }

  function getDaysBetween(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const result = [];
  
    // Normalize time to midnight local time
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
  
    for (
      let d = new Date(startDate);
      d.getTime() <= endDate.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      // Clone and format date safely
      const localDate = new Date(d);
      result.push({
        date: localDate.toISOString(),
        in0: 0,
        in11: 0,
        in21: 0,
        out0: 0,
        out11: 0,
        out21: 0,
        entries: [],
      });
    }
  
    return result;
  }




module.exports = {createRG, getDaysBetween}