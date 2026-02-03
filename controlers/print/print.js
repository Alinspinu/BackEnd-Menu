const Nir = require('../../models/office/nir');
const exceljs = require('exceljs');
const Ingredient = require('../../models/office/inv-ingredient')
const Locatie = require('../../models/office/locatie')
const Recipt = require('../../models/office/recipt')
const Order = require('../../models/office/product/order')
const Dep = require('../../models/office/product/dep')
const Inventary = require('../../models/office/inventary')
const Product = require('../../models/office/product/product')
const ComparedInventary = require('../../models/office/comp-inv')
const Invoice = require('../../models/office/invoice')
// const {createRaortXml} = require('../../utils/print/printOrders');

const {sendBillToCustomer} = require('../../utils/mail');
const { formatedDateToShow } = require('../../utils/functions');

const {createRecipt} = require('./recipt')
const {createInfoice} =require('./invoice')
const {createNir} = require('./nir');
const {createSupliersSolds} = require('./supliers-solds')
const {exportOrdersToExcel} = require('./printHours')
const dep = require('../../models/office/product/dep');

const PDFDocument = require("pdfkit");



module.exports.printSolds = async (req, res) => {
  const {loc} = req.body
  try{

    const locatie = await Locatie.findById(loc).populate({path: 'supliersList'})

    let doc = new PDFDocument({
      size: "A5",
      layout: "portrait",
    });

    createSupliersSolds(locatie.supliersList, doc)

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
  }
}


function updateSuplierRecords(suplier){
  suplier.sold = 0
  const sortedRecords = suplier.records.sort((a,b)=>+new Date(a.date)-(+new Date(b.date)));
  sortedRecords[0].sold = 0
  // if(sortedRecords[0].typeOf === 'intrare'){
  // } else {
  //     sortedRecords[0].sold = -sortedRecords[0].document.amount
  // }
  sortedRecords.forEach(r => {
          if(r.typeOf === 'intrare'){
           suplier.sold = round( suplier.sold + r.document.amount)
           r.sold = suplier.sold
          } else {
           suplier.sold = round( suplier.sold - r.document.amount)
           r.sold = suplier.sold
          }
      })
      suplier.record = sortedRecords
    return suplier
 }

module.exports.printNir = async (req, res, next) => {
  const {id} = req.query
  try{
    const nir = await Nir.findById(id)
    .populate({
    path: "suplier",
      select: "name vatNumber",
    })
    .populate({
      path: 'locatie'
    })
    .populate({
      path: 'salePoint'
    })

    let doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
    });

    createNir(nir, doc)

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

  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }

  };



  module.exports.createNirsXcel = async (req, res, next) => {
    const {startDate, endDate, loc} = req.body
    const start = new Date(startDate).setUTCHours(0,0,0,0)
    const end = new Date(endDate).setUTCHours(0,0,0,0)
    const startDateToShow = new Date(startDate).toISOString().split('T')[0]
    const endDateToShow = new Date(endDate).toISOString().split('T')[0]
    try{
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Rapoarte NIR');
        const nirs = await Nir.find({locatie: loc, documentDate:{ $gte: start, $lte: end} }).populate({path: "suplier"}).populate({path: 'locatie'})
        const docTitle =  [
          `${nirs[0].locatie.bussinessName}`,
           '',
           '',
           `Rapoarte NIR de la ${startDateToShow}, pană la ${endDateToShow}`,
           '',
           '',
           '',
           '',
           '']
        const header = [
          'Nr',
          `Data`,
          'Nr Document',
          `Valoare fară Tva`, 
          "Disc Fara TVA", 
          "Valoare TVA",
          "Valoare cu TVA",
          "Valoare Vanzare",
          "Furnizor"
        ]
        let totals = {
          valFTva: 0,
          valDiscount: 0,
          tvaVal: 0,
          sellPrice: 0,
        }


        worksheet.addRow(docTitle)
        worksheet.addRow([])
        worksheet.addRow(header)

        nirs.forEach(el => {
          let valFTva = 0
          let valDiscount = 0
          let tvaVal = 0
          let sellPrice = 0
          el.ingredients.forEach(ing=> {
            valFTva += ing.value
            tvaVal += ing.tvaValue
            sellPrice += ing.sellPrice
          })
          if(el.discount.length){
            el.discount.forEach(obj => {
              valDiscount += obj.value
            })
          }
          worksheet.addRow(
            [
              `${el.index}`,
              `${el.documentDate.toISOString().split('T')[0]}`,
              `${el.nrDoc}`,
              `${round(valFTva + valDiscount)}`,
              `${round(valDiscount)}`,
              `${round(tvaVal)}`,
              `${round(valFTva + tvaVal)}`,
              `${round(sellPrice)}`,
              `${el.suplier.name}`
            ]
            )
            totals.valFTva += valFTva;
            totals.valDiscount += valDiscount;
            totals.tvaVal += tvaVal;
            totals.sellPrice += sellPrice;
        })

        const totalsRow = [
          'TOTALURI',
          '',
          '',
          `${round(totals.valFTva)}`,
          `${round(totals.valDiscount)}`,
          `${round(totals.tvaVal)}`,
          `${round(totals.tvaVal + totals.valFTva)}`,
          `${round(totals.sellPrice)}`
        ]

        const totalsDetailsRow = [
          '',
          '',
          '',
          `T Valoare fară Tva`, 
          "T Disc Fara TVA", 
          "T Valoare TVA",
          "T Valoare cu TVA",
          "T Valoare Vanzare",
        ]
        worksheet.addRow(totalsRow)
        worksheet.addRow(totalsDetailsRow)

        worksheet.getColumn(1).eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: 'center'}
        })
        worksheet.getColumn(2).eachCell((cell)=> {
          cell.alignment = { vertical: "middle", horizontal: 'center'}
        })

        worksheet.getColumn(3).eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: 'center'}
        })
        worksheet.getColumn(4).eachCell((cell) => {
          cell.alignment = {vertical: "middle", horizontal: 'right' };
        });
        worksheet.getColumn(5).eachCell((cell) => {
          cell.alignment = {vertical: "middle", horizontal: 'right' };
        });
        worksheet.getColumn(6).eachCell((cell) => {
          cell.alignment = {vertical: "middle", horizontal: 'right' };
        });
        worksheet.getColumn(7).eachCell((cell) => {
          cell.alignment = {vertical: "middle", horizontal: 'right' };
        });
        worksheet.getColumn(8).eachCell((cell) => {
          cell.alignment = {vertical: "middle", horizontal: 'right' };
        });
        worksheet.getColumn(9).eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: 'center'}
        });

      worksheet.getRow(1).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
        cell.alignment = {horizontal: 'center'}
    })
    worksheet.getRow(3).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 12
        }
        cell.alignment = {horizontal: 'center'}
    })
    const totalsRowNumber = worksheet.lastRow.number -1;
        worksheet.getRow(totalsRowNumber).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 14
            }
        })
        worksheet.getColumn(1).width = 5;
        worksheet.getColumn(2).width = 12; 
        worksheet.getColumn(3).width = 14; 
        worksheet.getColumn(4).width = 14; 
        worksheet.getColumn(5).width = 14; 
        worksheet.getColumn(6).width = 14; 
        worksheet.getColumn(7).width = 15; 
        worksheet.getColumn(8).width = 15; 
        worksheet.getColumn(9).width = 30; 
        worksheet.mergeCells(`A${totalsRowNumber}:C${totalsRowNumber}`)
        worksheet.mergeCells(`A1:C1`)
        worksheet.mergeCells(`D1:I1`)
        worksheet.mergeCells(`A2:I2`)
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
          workbook.xlsx.write(res)
          .then(() => {
            res.end();
          })
          .catch((error) => {
            console.error('Error writing Excel file:', error);
            res.status(500).send('Internal Server Error');
          });
    }catch(err){
        console.log(err)
        res.status(500).json({message: "Error", err})
    }
}



module.exports.printHorsSales = async (req, res) => {

    const {loc, start, end, point} = req.body
    try{
        const startTime = new Date(start).setUTCHours(0,0,0,0)
        const endTime = new Date(end).setUTCHours(23, 59, 59, 9999)
        const orders = await Order.find({locatie: loc, paymentDate: {$gte: startTime, $lte: endTime}, status: 'done', salePoint: point, invoice: false})

        const data = groupOrdersForCharts(orders)
        if(data){
          const buffer = await exportOrdersToExcel(data)
  
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');
      
          // Send the buffer directly
          res.send(Buffer.from(buffer));
        } else {
          throw new Error('Error')
        }

    } catch(error){
      console.log(err)
      res.status(500).json({message: "Error", err})
    }
}



// function groupOrdersForCharts(orders) {
//   const map = {};

//   orders.forEach(o => {
//     const d = new Date(o.createdAt);

//     // add +2 hours
//     d.setHours(d.getHours() + 2);

//     const day = d.toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
//     const hour = d.getHours(); // local hour

//     map[day] ??= {};
//     map[day][hour] ??= 0;
//     map[day][hour] += o.total;
//   });

//   return Object.entries(map).map(([day, hours]) => ({
//     day,
//     hours: Object.entries(hours)
//       .sort(([a], [b]) => a - b)
//       .map(([hour, total]) => ({
//         hour: Number(hour),
//         total
//       }))
//   }));
// }

function groupOrdersForCharts(orders) {
  const map = {};

  orders.forEach(o => {
    const d = new Date(o.createdAt);

    // ⏰ adjust server time (+2 hours)
    d.setHours(d.getHours() + 2);

    const dayOfWeek = d.getDay();

    // ✅ keep ONLY Saturday (6) & Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) return;

    const day = d.toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
    const hour = d.getHours();

    map[day] ??= {};
    map[day][hour] ??= 0;
    map[day][hour] += o.total;
  });

  return Object.entries(map)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([day, hours]) => ({
      day,
      hours: Object.entries(hours)
        .sort(([a], [b]) => a - b)
        .map(([hour, total]) => ({
          hour: Number(hour),
          total
        }))
    }));
}




  module.exports.createIngredientsInvXcel = async (req, res, next) => {
          const {loc} = req.body
          let filterTo = {}
          const filter = req.body.filter
          if(filter && filter.gestiune.length){
            filterTo.gest = filter.gestiune
          }
          if(filter && filter.type.length){
            if(filter.type === "compus"){
              filterTo.ings = { $exists: true, $ne: [] }
            } else {
              filterTo.ings = { $eq: [] }
            }
          }
          if(filter && filter.dep.length){
            filterTo.dept = filter.dep
          }
          filterTo.status = true
          // filterTo.ings = { $eq: [] }
          // filter.dep = 'marfa'

          filterTo.locatie = loc
    try{
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Lista ingrediente');
        const ings = await Ingredient.find(filterTo).select([ '-unloadLog', '-uploadLog'])
        const sortedIngs = ings.sort((a, b) => a.name.localeCompare(b.name))
     
        const docTitle =  [
          'Lista ingrediente',
           '',
           '',
           '']
        const header = [
          'Nr',
          `Denumire Ingredient`,
          'UM',
          `Cantitate`, 
          `Pret`, 
        ]
        worksheet.addRow(docTitle)
        worksheet.addRow(header)
        let totalPretAchizitie = 0
       
        sortedIngs.forEach((el, i) => {
          let qty = el.qty
          if(el.qty > 0){
            const price = round(el.qty * el.price)
            totalPretAchizitie += price
          }
          if(filter.date && filter.date.length){

              const day = el.inventary.find(day => day.day.split('T')[0] === filter.date)
              if(day){
                qty = day.qty
              }
          }
          worksheet.addRow(
            [
              `${i+1}`,
              `${el.name}`,
              `${el.um}`,
              `${round(qty)}`,
              `${el.price} Lei`,
            ]
            )
        })
        worksheet.addRow(['Total cu Tva', '', '', '', `${round(totalPretAchizitie)} Lei`])
        worksheet.getColumn(1).eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: 'center'}
        })
        worksheet.getColumn(2).eachCell((cell)=> {
          cell.alignment = { vertical: "right", horizontal: 'left'}
        })

        worksheet.getColumn(3).eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: 'center'}
        })
        worksheet.getColumn(5).eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: 'right'}
        })

      worksheet.getRow(1).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
        cell.alignment = {horizontal: 'center'}
    })


      worksheet.getRow(2).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 13
        }
        cell.alignment = {horizontal: 'center'}
    })

    const totalsRowNumber = worksheet.lastRow

    totalsRowNumber.eachCell((cell)=>{
      cell.font = {
          bold: true,
          size: 14
      }
      cell.alignment = {horizontal: 'right'}
  })

        worksheet.getColumn(1).width = 5;
        worksheet.getColumn(2).width = 25; 
        worksheet.getColumn(3).width = 10; 
        worksheet.getColumn(4).width = 16; 
        worksheet.getColumn(5).width = 16; 
        worksheet.mergeCells(`A1:D1`)
        worksheet.mergeCells(`A${totalsRowNumber.number}:D${totalsRowNumber.number}`)
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
          workbook.xlsx.write(res)
          .then(() => {
            res.end();
          })
          .catch((error) => {
            console.error('Error writing Excel file:', error);
            res.status(500).send('Internal Server Error');
          });
    }catch(err){
        console.log(err)
        res.status(500).json({message: "Error", err})
    }
}




module.exports.printInventary = async(req, res, next) => {
  const {id} = req.query
  const inventary = await Inventary.findById(id)
          .populate({path: 'ingredients.ing', select: 'price um sellPrice tva'})
          .populate({path: 'locatie', select: 'bussinessName'})
          .populate({path: 'gestiune', select: 'name'})
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const date = inventary.date
    .toLocaleDateString("en-GB", options)
    .replace(/\//g, "-");

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet(`Inventar din ${date}`);
  const sortedIngs = inventary.ingredients.sort((a, b) => a.dep.localeCompare(b.dep))


  const docTitle =  [
    `Inventar gestiune ${inventary.gestiune.name} ${date}`,
     '',
     '',
     '',
     '',
     '',
     '',
     '',
     '',
     '']
  const header = [
    'Nr',
    `Denumire Ingredient`,
    'UM',
    'TVA la vanzare',
    'Departament',
    'Pret achizitie (fara tva)',
    'Pret vanzare (cu tva)',
    `Cantitate (um)`, 
    `Valoare achizitie`, 
    `Valoare vanzare`, 
  ]
  worksheet.addRow(docTitle)
  worksheet.addRow(header)


  let totalDeps = []
  let totalIn = 0
  let totalOut = 0

   sortedIngs.forEach((el, i) => {
    if(!el.ing) {
      console.log(el)
    } else {
      let tva = el.ing.tva
      if( el.dep === 'marfa' && tva === 0 && el.name !== 'Taxa SGR'){
        tva = 21
      }
      const name = el.dep + ' ' + tva + '%'
      const inVal = round(el.faptic * el.ing.price)
      const outVal = round(el.faptic * el.ing.sellPrice || 0)
      totalIn += inVal
      totalOut += outVal
      const dep = totalDeps.find(d => d.name === name)
      if(dep){
        dep.totalIn += inVal
        dep.totalOut += outVal
      } else {
        const d = {
          name: name,
          totalIn: inVal,
          totalOut: outVal
        }
        totalDeps.push(d)
      }
      worksheet.addRow(
        [
          `${i+1}`,
          `${el.name}`,
          `${el.ing.um}`,
          `${tva} %`,
          `${el.dep}`,
          `${el.ing.price}`,
          `${el.ing.sellPrice || 0}`,
          `${round(el.faptic)}`,
          `${round(el.faptic * el.ing.price)}`,
          `${round(el.faptic * el.ing.sellPrice || 0)}`,
        ]
        )
    }
  })


worksheet.getColumn(3).eachCell((cell) => {
  cell.alignment = { vertical: "middle", horizontal: 'center'}
})
worksheet.getColumn(4).eachCell((cell) => {
  cell.alignment = { vertical: "middle", horizontal: 'center'}
})
worksheet.getColumn(5).eachCell((cell) => {
  cell.alignment = { vertical: "middle", horizontal: 'center'}
})
worksheet.getColumn(6).eachCell((cell) => {
  cell.alignment = { vertical: "middle", horizontal: 'center'}
})
worksheet.getColumn(7).eachCell((cell) => {
  cell.alignment = { vertical: "middle", horizontal: 'center'}
})
worksheet.getColumn(8).eachCell((cell) => {
  cell.alignment = { vertical: "middle", horizontal: 'center'}
})


totalDeps.forEach((d, i) => {
  const row = worksheet.addRow(
      [
        `${i+1}`, 
        `Total ${d.name}`, 
        '', 
        '',
        '', 
        '', 
        ``, 
        ``, 
        `${round(d.totalIn)}`, 
        `${round(d.totalOut)}`, 
      ]
      )
    const num = row.number
    worksheet.mergeCells(`B${num}:H${num}`)
    row.eachCell((cell)=>{
      cell.font = {
          bold: true,
          size: 12
      }
    })
})


worksheet.addRow(
    [
      '', 
      'TOTALURI (achizitie / vanzare)', 
      '', 
      '',
      '', 
      '', 
      ``, 
      ``, 
      `${round(totalIn)}`, 
      `${round(totalOut)}`, 
    ]
    )


  const totalsRowNumber = worksheet.lastRow

  totalsRowNumber.eachCell((cell)=>{
  cell.font = {
      bold: true,
      size: 14
  }
  })

  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 35; 
  worksheet.getColumn(3).width = 5; 
  worksheet.getColumn(4).width = 8; 
  worksheet.getColumn(5).width = 15; 
  worksheet.getColumn(6).width = 10; 
  worksheet.getColumn(7).width = 10; 
  worksheet.getColumn(8).width = 10; 
  worksheet.getColumn(9).width = 11; 
  worksheet.getColumn(10).width = 11; 
  worksheet.mergeCells(`A1:J1`)
  worksheet.mergeCells(`B${totalsRowNumber.number}:H${totalsRowNumber.number}`)

  worksheet.getColumn(1).eachCell((cell) => {
    cell.alignment = { vertical: "middle", horizontal: 'center'}
  })
  worksheet.getColumn(2).eachCell((cell)=> {
    cell.alignment = { vertical: "right", horizontal: 'left'}
  })

  worksheet.getColumn(9).eachCell((cell) => {
    cell.alignment = { vertical: "middle", horizontal: 'right'}
  })
  worksheet.getColumn(10).eachCell((cell) => {
    cell.alignment = { vertical: "middle", horizontal: 'right'}
  })

  worksheet.getRow(1).eachCell((cell)=>{
    cell.font = {
        bold: true,
        size: 14
    }
    cell.alignment = {horizontal: 'center'}
  })
  

  worksheet.getRow(2).eachCell((cell)=>{
    cell.font = {
        bold: true,
        size: 12
    }
    cell.alignment = { wrapText: true, horizontal: 'center' }
  })



  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
  workbook.xlsx.write(res)
  .then(() => {
    res.end();
  })
  .catch((error) => {
    console.error('Error writing Excel file:', error);
    res.status(500).send('Internal Server Error');
  });
}



module.exports.printCompareInv = async (req, res) => {
  const {id, dep, gest} = req.query
  try{
    const inventary = await ComparedInventary.findById(id).populate({path: 'locatie', select: 'bussinessName'})

    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const firstDate = inventary.dateFirst
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");
    const secondDate = inventary.dateSecond
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");
  
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(`Inventar comparat ${firstDate} - ${secondDate}`);
    const sortedIngs = inventary.ingredients.sort((a, b) => a.name.localeCompare(b.name))
    let filtredIngs = sortedIngs

    if(gest.length){
      filtredIngs = filtredIngs.filter(i => i.gestiune === gest)
    }
    if(dep.length) {
      filtredIngs = filtredIngs.filter(i => i.dep === dep)
    }
 
  
    const docTitle =  [
      `Inventar comparat ${firstDate} - ${secondDate}`,
       '',
       '',
       '',
       '',
       '',
       '',
       '',
       '',
       '',
       '',
       '']
    const header = [
      'Nr',
      `Denumire Ingredient`,
      'UM',
      `Inventar ${firstDate}`,
      'Intrari',
      `Inventar ${secondDate}`,
      'Scriptic',
      `Vanzari`, 
      `Deprecieri`, 
      `Diferenta (um)`, 
      'Pret cu TVA (lei / um)',
      `Diferenta (lei)`, 
    ]
    worksheet.addRow(docTitle)
    worksheet.addRow(header)
    filtredIngs.forEach((ing, i) => {
      worksheet.addRow(
        [
          `${i+1}`,
          `${ing.name}`,
          `${ing.um}`,
          `${round(ing.first)}`,
          `${round(ing.upload.value)}`,
          `${round(ing.second)}`,
          `${round(ing.first+ing.upload.value - ing.second)}`,
          `${round(ing.saleUnload)}`,
          `${round(ing.depVal)}`,
          `${round(ing.saleUnload + ing.depVal - (ing.first+ing.upload.value - ing.second))}`,
          `${ing.price}`,
          `${round((ing.saleUnload + ing.depVal - (ing.first+ing.upload.value - ing.second)) * ing.price)}`,
        ]
        )
    })

    worksheet.getColumn(1).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(2).eachCell((cell)=> {
      cell.alignment = { vertical: "right", horizontal: 'left'}
    })
  
    worksheet.getColumn(3).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(4).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(5).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(6).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(7).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(8).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(9).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
    worksheet.getColumn(10).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
  
    worksheet.getColumn(11).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
  
    worksheet.getColumn(12).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'center'}
    })
  
  worksheet.getRow(1).eachCell((cell)=>{
    cell.font = {
        bold: true,
        size: 14
    }
    cell.alignment = {horizontal: 'center'}
  })
  
  
  worksheet.getRow(2).eachCell((cell)=>{
    cell.font = {
        bold: true,
        size: 13
    }
    cell.alignment = {horizontal: 'center'}
  })
  
  
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 25; 
    worksheet.getColumn(3).width = 10; 
    worksheet.getColumn(4).width = 20; 
    worksheet.getColumn(5).width = 13; 
    worksheet.getColumn(6).width = 20; 
    worksheet.getColumn(7).width = 13; 
    worksheet.getColumn(8).width = 13; 
    worksheet.getColumn(9).width = 15; 
    worksheet.getColumn(10).width = 15; 
    worksheet.getColumn(11).width = 18; 
    worksheet.getColumn(12).width = 15; 
    worksheet.mergeCells(`A1:L1`)

    worksheet.eachRow(row => {
      row.eachCell(cell => {
        if (typeof cell.value === 'number') {
          cell.numFmt = '0.000'; //
        }
      });
    });
  

    workbook.xlsx.writeBuffer().then(buffer => {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="example.xlsx"');
      res.send(buffer);
    }).catch(err => {
      console.error('Error writing Excel file:', err);
      res.status(500).send('Internal Server Error');
    });

  } catch(error){
    console.log(error)
    res.status(200).json(error)
  }
}




module.exports.printConsum = async (req, res) => {
  try{

    let productDeps = []
    const {loc, startDate, endDate, point, mail = undefined} = req.body

    const departaments =  await Dep.find({locatie: loc, salePoint: point})
    const start = new Date(startDate).setHours(0,0,0,0)
    const end = new Date(endDate).setHours(23,59,59,0)
    const startDateToShow = formatedDateToShow(start)
    const endDateToShow = formatedDateToShow(end)
    const locatie = await Locatie.findById(loc)
    const invoices = await Invoice.find({locatie: loc, salePoint: point, createdAt: {$gte: start, $lte: end}})
                    .populate({path:'products.productId', select: 'name departament sgrTax'})
                    .populate([
                      {
                        path: 'products.ings.ing', 
                        populate: {path: 'ings.ing'}
                      }
                    ]).lean()
    const orders = await Order.find({locatie: loc, salePoint: point, paymentDate: {$gte: start, $lte: end}, status: 'done'}).populate([
      {
        path: 'products.ings.ing', 
        populate: {path: 'ings.ing'}
      },
      {
        path: 'products.toppings.ing', 
        populate: {path: 'ings.ing'}
      }
    ]).lean()

      if(invoices){
        invoices.forEach(i => {
          i.products.forEach(product => {
            product.productionCost = 0
            for(let i of product.ings){
              if(i.ing){
                if(i.ing.ings && i.ing.ings.length){
                  for(let ii of i.ing.ings){
                    let price = ii.ing.price
                    if(ii.ing.invGestiune[0].entries){
                      price =  ii.ing.invGestiune[0]?.entries[0]?.priceNoVat || ii.ing.price
                    }
                    product.productionCost += (i.qty * ii.qty * price * product.quantity)
                  }
                } else {
                  let price = i.ing.price
                  if(i.ing.invGestiune[0].entries){
                    price =  i.ing.invGestiune[0]?.entries[0]?.priceNoVat || i.ing.price
                  }
                  product.productionCost += (i.qty * price * product.quantity)
                }
              }
            }
            product.tot = product.total
            product.tva = product.vatPrecent
            product.discount = product.discount?.value || 0
            const dbProd = product.productId
            if(dbProd){
              if(dbProd.sgrTax){
                product.tot = round( product.tot - (0.5 * product.quantity))
                product.price = product.price - 0.5
                product.sgrTax = true
              }
              let total0 = product.tva === 0 ? product.tot - product.discount : 0
              let total11 = product.tva === 11 ? product.tot - product.discount : 0
              let total21 = product.tva === 21 ? product.tot - product.discount : 0
              let cons0 = product.tva === 0 ? product.productionCost || 0 : 0
              let cons11 = product.tva === 11 ? product.productionCost : 0
              let cons21 = product.tva === 21 ? product.productionCost : 0
              let disc0 = product.tva === 0 ? product.discount || 0 : 0
              let disc11 = product.tva === 11 ? product.discount : 0
              let disc21 = product.tva === 21 ? product.discount : 0
              const productDep = productDeps.find(d => d.id === dbProd.departament.toString())
              if(productDep){
                  const prod = productDep.products.find(p => p.name === product.name)
                  if(prod){
                    prod.quantity += product.quantity
                    prod.tot += product.tot
                    prod.discount += product.discount
                    prod.productionCost += product.productionCost
                  } else {
                    productDep.products.push(product)
            
                  }
  
                  productDep.total0 += total0
                  productDep.total11 += total11
                  productDep.total21 += total21
                  productDep.cons0 += cons0
                  productDep.cons11 += cons11
                  productDep.cons21 += cons21
                  productDep.disc0 += disc0
                  productDep.disc11 += disc11
                  productDep.disc21 += disc21
  
              } else {
                const d = departaments.find(dep => dep._id.toString() === dbProd.departament.toString())
                if(d){
                  const dep = {
                    name: d.name,
                    id: dbProd.departament.toString(),
                    total0: total0,
                    total11: total11,
                    total21: total21,
                    disc0: disc0,
                    disc11: disc11,
                    disc21: disc21,
                    cons0: cons0,
                    cons11: cons11,
                    cons21: cons21,
                    products: [product],
                    ings: []
                  }
                  productDeps.push(dep)
                } else {
                  console.log(' Nu am gasit departament pentru ', product.name, ' ', product.departament)
                }
              }
            } else {
              console.log('produs fara product id ', product.name )
            }
          })
        })
      }



      if(orders){
        orders.forEach(order=> {
          order.products.forEach(product => {
           product.productionCost = 0
           for(let i of product.ings){
            if(i.ing){
              if(i.ing.ings && i.ing.ings.length){
                for(let ii of i.ing.ings){
                  let price = ii.ing.price
                  if(ii.ing.invGestiune[0].entries){
                    price =  ii.ing.invGestiune[0]?.entries[0]?.priceNoVat || ii.ing.price
                  }
                  product.productionCost += (i.qty * ii.qty * price * product.quantity)
                }
              } else {
                let price = i.ing.price
                if(i.ing.invGestiune[0].entries){
                  price =  i.ing.invGestiune[0]?.entries[0]?.priceNoVat || i.ing.price
                }
                product.productionCost += (i.qty * price * product.quantity)
              }
            } else {
              console.log(i)
            }
          }

          for(let t of product.toppings){
            if(t.ing.ings && t.ing.ings.length){
              for(let ii of t.ing.ings){
                let price = ii.ing.price
                if(ii.ing.invGestiune[0].entries){
                  price =  ii.ing.invGestiune[0]?.entries[0]?.priceNoVat || ii.ing.price
                }
                product.productionCost += (t.qty * ii.qty * price * product.quantity)
              }
            } else {
              let price = t.ing.price
              if(t.ing.invGestiune[0].entries){
                price =  t.ing.invGestiune[0]?.entries[0]?.priceNoVat || t.ing.price
              }
              product.productionCost += (t.qty * price * product.quantity)
            }
          }
            product.tot = parseFloat(product.total)
            if(product.departament){
              if(product.sgrTax){
                product.tot = round( product.tot - (0.5 * product.quantity))
                product.price = product.price - 0.5
              }
              let total0 = product.tva === 0 ? product.tot - product.discount : 0
              let total11 = product.tva === 11 ? product.tot - product.discount : 0
              let total21 = product.tva === 21 ? product.tot - product.discount : 0
              let cons0 = product.tva === 0 ? product.productionCost || 0 : 0
              let cons11 = product.tva === 11 ? product.productionCost : 0
              let cons21 = product.tva === 21 ? product.productionCost : 0
              let disc0 = product.tva === 0 ? product.discount || 0 : 0
              let disc11 = product.tva === 11 ? product.discount : 0
              let disc21 = product.tva === 21 ? product.discount : 0
              const productDep = productDeps.find(d => d.id === product.departament.toString())
              if(productDep){
                  const prod = productDep.products.find(p => p.name === product.name)
                  if(prod){
                    prod.quantity += product.quantity
                    prod.tot += product.tot
                    prod.discount += product.discount
                    prod.productionCost += product.productionCost
                  } else {
                    productDep.products.push(product)
                  }

                  productDep.total0 += total0
                  productDep.total11 += total11
                  productDep.total21 += total21
                  productDep.cons0 += cons0
                  productDep.cons11 += cons11
                  productDep.cons21 += cons21
                  productDep.disc0 += disc0
                  productDep.disc11 += disc11
                  productDep.disc21 += disc21

              } else {
                const d = departaments.find(dep => dep._id.toString() === product.departament.toString())
                if(d){
                  const dep = {
                    name: d.name,
                    id: product.departament.toString(),
                    total0: total0,
                    total11: total11,
                    total21: total21,
                    cons0: cons0,
                    cons11: cons11,
                    cons21: cons21,
                    disc0: disc0,
                    disc11: disc11,
                    disc21: disc21,
                    products: [product],
                    ings: []
                  }
                  productDeps.push(dep)
                } else {
                  console.log(' Nu am gasit departament pentru ', product.name, ' ', product.departament)
                }
              }
            }else {
              console.log('Produs fara departament ', product.name)
            }
          })
        })
      }

      productDeps.forEach(d => {
        d.products.forEach(product => {
          if(product.sgrTax){
            const tax = d.products.find(t => t.name === 'Taxa SGR')
            if(tax){
              tax.quantity += product.quantity
              tax.tot += (product.quantity * 0.5)
              tax.productionCost += (product.quantity * 0.5)
            } else {
              d.products.push({name: 'Taxa SGR', price: 0.5, productionCost: 0.5, tva: 0, quantity: product.quantity, tot: product.quantity * 0.5, discount: 0})
            }
            d.total0 += (product.quantity * 0.5)
            d.cons0 += (product.quantity * 0.5)
          }

          product.ings.forEach(ing => {
            if (ing.ing && ing.ing.ings && ing.ing.ings.length) {
              // Nested ingredient
              ing.ing.ings.forEach(ig => {
                const scaledQty = ing.qty * ig.qty * product.quantity;
                const existing = d.ings.find(p => p.ing.name === ig.ing.name);
                if (existing) existing.qty += scaledQty;
                else d.ings.push({ qty: scaledQty, ing: { ...ig.ing } });
              });
            } else if (ing.ing) {
              // Simple ingredient
              const scaledQty = ing.qty * product.quantity;
              const existing = d.ings.find(p => p.ing.name === ing.ing.name);
              if (existing) existing.qty += scaledQty;
              else d.ings.push({ qty: scaledQty, ing: { ...ing.ing } });
            }
          });
          
          // toppings
          if (product.toppings?.length) {
            product.toppings.forEach(topping => {
              if (topping.ing.ings?.length) {
                topping.ing.ings.forEach(ig => {
                  const scaledQty = topping.qty * ig.qty * product.quantity;
                  const existing = d.ings.find(p => p.ing.name === ig.ing.name);
                  if (existing) existing.qty += scaledQty;
                  else d.ings.push({ qty: scaledQty, ing: { ...ig.ing } });
                });
              } else {
                const scaledQty = topping.qty * product.quantity;
                const existing = d.ings.find(p => p.ing.name === topping.ing.name);
                if (existing) existing.qty += scaledQty;
                else d.ings.push({ qty: scaledQty, ing: { ...topping.ing } });
              }
            });
          }
        })
       })

      const workbook = new exceljs.Workbook();

      productDeps.forEach(d => {
        d.products.sort((a, b) => {
          if (a.tva !== b.tva) return a.tva - b.tva;
          return a.name.localeCompare(b.name);
        });
        const pSheet = workbook.addWorksheet(`Produse vandute ${d.name}`);
        const pTitle =  [
          `Perioada - ${startDateToShow} pana la ${endDateToShow}`,
           '',
           '',
          ]
        
          const pHead = [
            'Nr',
            `Denumire Produs`,
            `TVA`,
            `Pret / um`,
            'Cantitate',
            'Cost (f tva)',
            'Discount',
            'Total (D * E - G)',
          ]
          pSheet.addRow(pTitle)
          pSheet.addRow(pHead)
  
          d.products.forEach((p, i) => {
            pSheet.addRow(
              [
                `${i+1}`,
                `${p.name}`,
                `${p.tva} %`,
                p.price,
                p.quantity,
                round(p.productionCost),
                round(p.discount),
                round(p.tot - p.discount),
              ]
              )
          })
          pSheet.addRow([
            '',
            `TOTAL 0%`,
            '',
            '',
            '',
            round(d.cons0),
            round(d.disc0),
            round(d.total0),
          ])
  
          pSheet.addRow([
            '',
            `TOTAL 11%`,
            '',
            '',
            '',
            round(d.cons11),
            round(d.disc11),
            round(d.total11),
          ])
          pSheet.addRow([
            '',
            `TOTAL 21%`,
            '',
            '',
            '',
            round(d.cons21),
            round(d.disc21),
            round(d.total21),
          ])
          pSheet.addRow([
            '',
            `TOTAL GENERAL`,
            '',
            '',
            '',
            round(d.cons0 + d.cons11 + d.cons21),
            round(d.disc0 + d.disc11 + d.disc21),
            round(d.total11 + d.total21 + d.total0)
          ])
  
          pSheet.getColumn(1).width = 5;
          pSheet.getColumn(2).width = 40; 
          pSheet.getColumn(3).width = 5; 
          pSheet.getColumn(4).width = 10; 
          pSheet.getColumn(5).width = 10; 
          pSheet.getColumn(6).width = 20; 
          pSheet.getColumn(7).width = 20; 
          pSheet.getColumn(8).width = 20; 
  
          const lastRowNumber = pSheet.lastRow.number;
          for (let i = lastRowNumber; i > lastRowNumber - 4; i--) {
            const row = pSheet.getRow(i);
            pSheet.mergeCells(`C${i}:E${i}`)
            // pSheet.mergeCells(`C${i}:F${i}`)
            row.eachCell((cell) => {
              cell.font = { bold: true, size: 15 };
            });
          }
  
          pSheet.mergeCells(`A1:G1`)
  
          pSheet.getRow(1).eachCell((cell)=>{
            cell.font = {
                size: 14
            }
        })
          pSheet.getRow(2).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 13
            }
        })



      const worksheet = workbook.addWorksheet(`Consum Ingrediente ${d.name}`);


      const docTitle =  [
        `Consum ${startDateToShow} pana la ${endDateToShow}`,
         '',
         '',
         '',
         '',
         '',
         '',
         ''
        ]
      const header = [
        'Nr',
        `Denumire Ingredient`,
        'Departament',
        'UM',
        'Cota Tva',
        `Pret/UM/F TVA`, 
        'Valoare F TVA',
        `Consum`, 
      ]
      worksheet.addRow(docTitle)
      worksheet.addRow(header)

      let totals = {
        priceNoVat: 0,
        priceVat: 0,
        priceWithVat: 0,
        sellPrice: 0
      }

      d.ings.forEach((ing, i) =>{
        if(!ing.ing.invGestiune[0].entries){
          console.log(ing.ing.name)
        }

        ing.ing.invGestiune[0]?.entries?.sort((a, b) => new Date(a.date) - new Date(b.date));
        let price = ing.ing.price
        if(ing.ing.invGestiune[0].entries){
          price =  ing.ing.invGestiune[0]?.entries[0]?.priceNoVat || ing.ing.price
        }


        const priceNoVat = price * ing.qty
        const priceVat = priceNoVat * (ing.ing.tva / 100)
        const priceWithVat = priceNoVat + priceVat
        worksheet.addRow(
          [
            `${i+1}`,
            `${ing.ing.name}`,
            `${d.name}`,
            `${ing.ing.um}`,
            `${ing.ing.tva} %`,
            price,
            round(priceNoVat),
            round(ing.qty),
          ]
          )
         totals.priceNoVat += priceNoVat 
         totals.priceVat += priceVat
         totals.priceWithVat += priceWithVat
         totals.sellPrice += (ing.ing.sellPrice * ing.qty)
      })

      const totalsRow = [
        'TOTALURI',
        '',
        '',
        '',
        '',
        '',
        //  `${round(d.cons0 + d.cons11 + d.cons21)}`,
          round(totals.priceNoVat),
      ]
      worksheet.addRow(totalsRow)

      const totalsRowNumber = worksheet.lastRow.number
      worksheet.getRow(totalsRowNumber).eachCell((cell)=>{
          cell.font = {
              bold: true,
              size: 14
          }
      })
      worksheet.getRow(1).eachCell((cell)=>{
          cell.font = {
              size: 14
          }
      })
      worksheet.getRow(2).eachCell((cell)=>{
          cell.font = {
              bold: true,
              size: 13
          }
      })
      worksheet.getRow(7).eachCell((cell)=>{
        cell.numFmt = '#,##0.00'; 
      })

      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 30; 
      worksheet.getColumn(3).width = 15; 
      worksheet.getColumn(4).width = 6; 
      worksheet.getColumn(5).width = 9; 
      worksheet.getColumn(6).width = 13; 
      worksheet.getColumn(7).width = 13; 
      worksheet.getColumn(8).eachCell((cell) => {
        cell.font = {
          bold: true,
          size: 14
      },
        width = 15,
        cell.alignment = { vertical: "middle", horizontal: 'right'}
      }) 
      worksheet.mergeCells(`A${totalsRowNumber}:F${totalsRowNumber}`)
      worksheet.mergeCells(`A1:H1`)

      })

      if(mail) {
        const buffer = await workbook.xlsx.writeBuffer();
        const message = await sendBillToCustomer(buffer, mail, locatie.name, 'Raport productie ' + locatie.bussinessName + ' perioada ' + startDateToShow + ' - ' + endDateToShow);
        res.status(200).json({message: 'Raportul a fost creart si trimis la ', mail})
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
        workbook.xlsx.write(res)
        .then(() => {
          res.end();
        })
        .catch((error) => {
          console.error('Error writing Excel file:', error);
          res.status(500).send('Internal Server Error');
        });
      }



  } catch(err){
    console.log(err)
  }
}



module.exports.factura = async (req, res, next) => {
  const {id, email, mode} = req.body
  try{

  let doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
  });
  const invoice = await Invoice.findById(id).populate({path: 'locatie'})

    createInfoice(invoice, doc)

  const buffers = [];
  doc.on("data", (chunk) => {
      buffers.push(chunk);
  });
  doc.on("end", async () => {
    const pdfBuffer = Buffer.concat(buffers);
    if (mode) {
      const message = await sendBillToCustomer(pdfBuffer, email, invoice.locatie.name, 'Factura', true);
      res.status(200).json(message);
    } else {
      res.type("application/pdf");
      res.send(pdfBuffer);
    }
  });

  doc.end()

} catch(error){
  console.log(error)
  res.status(500).json(error)
}
  
}


module.exports.printFactur1 = async (req, res, next) => {
  const {point, loc, start, end} = req.body

  let doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
  });


  const startTime = new Date(start).setUTCHours(0,0,0,0)
  const endTime = new Date(end).setUTCHours(23,59,59,0)

  try{
  const invoices = await Invoice.find({locatie: loc, salePoint: point, createdAt: {$gte: startTime, $lt: endTime}}).populate({path: 'locatie'})

  console.log('facturi ', invoices.length)

  for(let i of invoices){
      createInfoice(i, doc)
      doc.addPage()
  }


  const buffers = [];
  doc.on("data", (chunk) => {
      buffers.push(chunk);
  });

  doc.on("end", async () => {
    const pdfBuffer = Buffer.concat(buffers);
    res.type("application/pdf");
    res.send(pdfBuffer);
  });

  doc.end()

} catch(error){
  console.log(error)
  res.status(500).json(error)
}
  
}





module.exports.printOrEmailRecipt = async (req, res) => {
  const {id, mode, email} = req.body
  try{
    const recipt = await Recipt.findById(id).populate({path: 'locatie'}).populate({path: 'client.customer'}).populate({path: 'invoice', select: 'invoiceNumber issueDate'})
     const doc = createRecipt(recipt, mode)
    const buffers = [];
    doc.on("data", (chunk) => {
        buffers.push(chunk);
    });
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      if (mode) {
        const message = await sendBillToCustomer(pdfBuffer, email, recipt.locatie.name, 'Chitanta');
        res.status(200).json(message);
      } else {
        res.type("application/pdf");
        res.send(pdfBuffer);
      }
    });
    doc.end()
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }

}






module.exports.saleProducts = async (req, res, next) => {
  const {products, startDay, endDay} = req.body
  const parsedProducts = JSON.parse(products)
  try{
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(`Produse vandute`);
  
  
    const docTitle =  [
      `Centralizator produse vândute în perioada ${startDay} -- ${endDay}`,
       '',
       '',
       '',
       '',
       '',
       '',
      ]
    const header = [
      'Nr',
      `Denumire Produs`,
      'Cantitate',
      'Preț UM',
      `Discount`, 
      `Total`, 
      'Total Încasat',
    ]
    worksheet.addRow(docTitle)
    worksheet.addRow()
    worksheet.addRow(header)
    let totalSale = 0
    let totalDiscount = 0
    parsedProducts.forEach((product, i) => {
      const total = round(product.quantity * product.price - product.discount)
      worksheet.addRow(
        [
          `${i+1}`,
          `${product.name}`,
          `${product.quantity} buc`,
          `${product.price} Lei`,
          `${round(product.discount)} Lei`,
          `${round(product.quantity * product.price)} Lei`,
          `${total} Lei`
        ]
        )
        totalDiscount += product.discount
        totalSale += total
    })
  
    const totalsRow = [
      'TOTALURI',
      '',
      '',
      '',
      `- ${round(totalDiscount)} Lei`,
      `+ ${round(totalDiscount + totalSale)} Lei`,
      `= ${round(totalSale)} Lei`,
    ]
    worksheet.addRow()
    worksheet.addRow(totalsRow)
  
    const totalsRowNumber = worksheet.lastRow.number
    worksheet.getRow(totalsRowNumber).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
    worksheet.getRow(1).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
    worksheet.getRow(3).eachCell((cell)=>{
        cell.font = {
            bold: true,
            // size: 14
        }
    })
  
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 35; 
    worksheet.getColumn(3).width = 10; 
    worksheet.getColumn(4).width = 10; 
    worksheet.getColumn(5).width = 10; 
    worksheet.getColumn(6).width = 10; 
    worksheet.getColumn(7).width = 18; 
    worksheet.getColumn(7).eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 14
    },
      cell.alignment = { vertical: "middle", horizontal: 'right'}
    }) 
    worksheet.mergeCells(`A1:G1`)
    worksheet.mergeCells(`A2:G2`)
    worksheet.mergeCells(`A${totalsRowNumber}:D${totalsRowNumber}`)
    worksheet.mergeCells(`A${totalsRowNumber-1}:G${totalsRowNumber-1}`)
  
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
    workbook.xlsx.write(res)
    .then(() => {
      res.end();
    })
    .catch((error) => {
      console.error('Error writing Excel file:', error);
      res.status(500).send('Internal Server Error');
    });
  } catch(err){
    console.log(err)
    res.status(500).json({message: err.message})
  }
}




module.exports.printConsumption = async (req, res, next) => {
  const {ings, startDay, endDay} = req.body
  const parsedIngs = JSON.parse(ings)

  try{
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(`Consum Materii Prime`);
    const docTitle =  [
      `Centralizator consum materii prime ${startDay} -- ${endDay}`,
       '',
       '',
       '',
       '',
       '',
      ]
    const header = [
      'Nr',
      `Denumire Ingredient`,
      `Consum`, 
      'UM',
      `Pret UM cu TVA Lei`,
      `Total Lei`, 
    ]
    worksheet.addRow(docTitle)
    worksheet.addRow()
    worksheet.addRow(header)

    let totalConsumption = 0

    parsedIngs.forEach((ing, i) =>{
      const total = round(ing.qty * ing.ing.tvaPrice)
      worksheet.addRow(
        [
          `${i+1}`,
          `${ing.ing.name}`,
          `${round(ing.qty)}`,
          `${ing.ing.um}`,
          `${roundd(ing.ing.tvaPrice)}`,
          `${round(ing.qty * ing.ing.tvaPrice)}`,
        ]
        )
        if(total){
          totalConsumption += total
        }
    })
    const totalsRow = [
      'TOTAL CONSUM',
      '',
      '',
      '',
      '',
      `${round(totalConsumption)} Lei`,
 
    ]
    worksheet.addRow()
    worksheet.addRow(totalsRow)

    const totalsRowNumber = worksheet.lastRow.number
    worksheet.getRow(totalsRowNumber).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
    worksheet.getRow(1).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 15
        }
    })
    worksheet.getRow(3).eachCell((cell)=>{
        cell.font = {
            bold: true,
            // size: 15
        }
    })

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30; 
    worksheet.getColumn(3).width = 10; 
    worksheet.getColumn(4).width = 10; 
    worksheet.getColumn(5).width = 20; 
    worksheet.getColumn(6).width = 15; 
    worksheet.getColumn(5).eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: 'right'}
    }) 
    worksheet.getColumn(6).eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 14
    },
      cell.alignment = { vertical: "middle", horizontal: 'right'}
    }) 
    worksheet.mergeCells(`A1:F1`)
    worksheet.mergeCells(`A2:F2`)
    worksheet.mergeCells(`A${totalsRowNumber}:D${totalsRowNumber}`)
    worksheet.mergeCells(`A${totalsRowNumber-1}:F${totalsRowNumber-1}`)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
    workbook.xlsx.write(res)
    .then(() => {
      res.end();
    })
    .catch((error) => {
      console.error('Error writing Excel file:', error);
      res.status(500).send('Internal Server Error');
    });
  } catch(err){
  console.log(err)
}
}


module.exports.printProductRecipes = async (req, res, next) => {

  const {filter, ing = true, im = true, d = true } = req.body
  try{
    const products = await Product.find(filter)
        .select('name description ings image toppings category mainCat subProducts qty price')
        .populate({path: 'ings.ing', select: 'name price um tvaPrice'})
        .populate({path: 'toppings.ing', select: 'name price um tvaPrice'})
        .populate({path: 'locatie', select: 'bussinessName'})
        .populate({path: 'category', select: 'name'})
        .populate({path: 'subProducts', select: 'name price qty description ings', populate: {path: 'ings.ing', select: 'name price tvaPrice um'}})
      if(!products.length){
        return res.status(404).json({message: 'Nu au fost găsit nici un produs!'})
      }
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Produse');
        const docTitle =  [
          `${products[0].locatie.bussinessName}`,
           '',
           '',
           `Produse`,
           '',
           '',
           '',
           '',
           '',
           '']
           const header = [
            'Nr',
            `Denumire Produs / Ingredient`,
            `${ing ? '(Rețetă)': ''}`,
            `Cost productie`, 
            `Pret Vanzare`, 
            'Adaos',
            // 'Cost procent',
          ]
          worksheet.addRow(docTitle)
          worksheet.addRow()
          products.forEach((product, i) => {
            const ings =  product.ings
            const rT = ings.reduce((sum, ingredient) => {
              return sum + Math.round(ingredient.qty * ingredient.ing.tvaPrice);
            }, 0);
            worksheet.addRow(header)
            worksheet.addRow(
              [ 
                `${i+1}`,
                `${product.name}`,
                '',
                 round(rT),
                 product.price,
                 round((product.price-rT)/rT * 100),
                 round(rT/product.price),
              ]
              )
              const rowCount = worksheet.rowCount
              worksheet.getRow(rowCount).eachCell((cell)=>{
              cell.font = {
                  bold: true,
              }
          })
          if(product.subProducts.length){
            worksheet.addRow()
            worksheet.addRow([
              ``,
              `Opțiune obligatorie (max 1)`,
            ])
            const row = worksheet.rowCount
            worksheet.getRow(row).eachCell((cell)=>{
            cell.font = {
                bold: true,
            }
          })
            product.subProducts.forEach(sub => {
              const ings =  sub.ings
              const rT = ings.reduce((sum, ingredient) => {
                return sum + Math.round(ingredient.qty * ingredient.ing.tvaPrice);
              }, 0);

              worksheet.addRow(
                [ 
                  ``,
                  `${sub.name}`,
                  ``,
                  round(rT),
                  sub.price,
                  round((sub.price-rT)/rT * 100),
                  round(rT/sub.price),
                ]
                )
                
                const row = worksheet.rowCount
                worksheet.getRow(row).eachCell((cell)=>{
                cell.font = {
                    bold: true,
                }
              })
                ings.forEach((ing, i) => {
                  const tot = round(ing.qty * ing.ing.tvaPrice)
                  worksheet.addRow(
                    [
                      'Ing',
                      `${ing.ing.name}`,
                      `${round(ing.qty)} ${ing.ing.um}`,
                      '',
                      '',
                      `${tot} Lei`,
                      '',
                      '',
                    ]
                    )
                })
                worksheet.addRow()
               
            })
            worksheet.addRow()
          }
          if(product.toppings.length){
           const toppings = product.toppings.filter(t => !t.name.includes('To Go'))
           if(toppings.length){
            if(!product.subProducts.length) worksheet.addRow()
             worksheet.addRow([
               ``,
               `Topinguri la alegere`,
             ])
             const rowT = worksheet.rowCount
             worksheet.getRow(rowT).eachCell((cell)=>{
             cell.font = {
                 bold: true,
             }
           })
             toppings.forEach(top => {   
              const ingPrice = round(top.ing.tvaPrice * top.qty)        
                 worksheet.addRow(
                   [ 
                     ``,
                     `${top.name}`,
                     ``,
                     `${ingPrice} Lei`,
                     `${top.price} Lei`,
                     `${round((top.price-ingPrice)/ingPrice * 100)} %`,
                     '',
                   ]
                   )
             })
             worksheet.addRow()
           }
          }
        if(ing) ings.forEach((ing, i) => {
          const tot = round(ing.qty * ing.ing.tvaPrice)
          worksheet.addRow(
            [
              'Ing',
              `${ing.ing.name}`,
              `${round(ing.qty)} ${ing.ing.um}`,
              '',
              '',
              tot,
              '',
              '',
            ]
            )
        })
        worksheet.addRow()
        })
        worksheet.getColumn(1).width = 5;
        worksheet.getColumn(2).width = 25;
        worksheet.getColumn(3).width = 13; 
        worksheet.getColumn(4).width = 18; 
        worksheet.getColumn(5).width = 18; 
        worksheet.getColumn(6).width = 10; 
        worksheet.getColumn(7).width = 10; 
        worksheet.getColumn(8).width = 10; 
        worksheet.getColumn(9).width = 15; 
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
        workbook.xlsx.write(res)
        .then(() => {
          res.end();
        })
        .catch((error) => {
          console.error('Error writing Excel file:', error);
          res.status(500).send('Internal Server Error');
        });
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.printProduction = async (req, res, next) => {
  const {products, startDay, endDay} = req.body
  const parsedProducts = JSON.parse(products)
  try{
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet(`Produse vandute`);
  
  
    const docTitle =  [
      `Raport productie detaliat în perioada ${startDay} pana la ${endDay}`,
       '',
       '',
       '',
       '',
       '',
       '',
       '',
       '',
      ]
    const header = [
      'Nr',
      `Denumire Produs / Ingredient`,
      '(Rețetă / 1 Buc)',
      'Cantitate',
      'Preț UM',
      'Discount',
      `Total-Ing`, 
      `Total`, 
      'Adaos',
    ]
    worksheet.addRow(docTitle)
    worksheet.addRow()
    let totalSale = 0
    let totalCons = 0
    parsedProducts.forEach((product, i) => {
      const total = round(product.quantity * product.price - product.discount)
      worksheet.addRow(header)
      worksheet.addRow(
        [ 
          `${i+1}`,
          `${product.name}`,
          '',
          `${product.quantity} buc`,
          `${product.price} Lei`,
          `${round(product.discount)} Lei`,
          '',
          `${total} Lei`,
          '',
        ]
        )
        const rowCount = worksheet.rowCount
        worksheet.getRow(rowCount).eachCell((cell)=>{
        cell.font = {
            bold: true,
        }
    })
      totalSale += total
      const ings =  showProduction(product)
      let totalRecipe = 0

      ings.forEach((ing, i) => {
        const tot = round(ing.qty * ing.ing.tvaPrice * product.quantity)
        worksheet.addRow(
          [
            'Ing',
            `${ing.ing.name}`,
            `${round(ing.qty)} ${ing.ing.um}`,
            `${round(ing.qty * product.quantity)} ${ing.ing.um}`,
            `${round(ing.ing.tvaPrice)} Lei`,
            '',
            `${tot} Lei`,
            '',
          ]
          )
          totalRecipe += tot
          totalCons += tot 
      })
      const recipeTotal = [
        `Total consum ingrediente (${product.quantity} X ${product.name})`,
        '',
        '',
        '',
        '',
        '',
        '',
        `${round(totalRecipe)} Lei`,
        `${round((total-totalRecipe)/totalRecipe * 100)} %`,
      ]
      worksheet.addRow(recipeTotal)
      const recipeTotalIndex = worksheet.rowCount
      worksheet.getRow(recipeTotalIndex).eachCell((cell) => {
        cell.font = {
          bold: true
        }
      })
      worksheet.mergeCells(`A${recipeTotalIndex}:F${recipeTotalIndex}`)
      worksheet.addRow()
      worksheet.mergeCells(`A${recipeTotalIndex+1}:I${recipeTotalIndex+1}`)
})

    const totalsRow = [
      'TOTAL ÎNCASAT',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `${round(totalSale)} Lei`,
    ]

    const totalsCons = [
      'TOTAL CONSUM',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `${round(totalCons)} Lei`,
    ]

    const totalsAdaos = [
      'TOTAL ADAOS COMERCIAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `${round((totalSale-totalCons)/ totalCons * 100)} %`,
    ]
    worksheet.addRow()
    worksheet.addRow(totalsRow)
    worksheet.addRow(totalsCons)
    worksheet.addRow(totalsAdaos)
  
    const totalsRowNumber = worksheet.lastRow.number
    worksheet.getRow(totalsRowNumber-2).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
    worksheet.getRow(totalsRowNumber-1).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
    worksheet.getRow(totalsRowNumber).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
    worksheet.getRow(1).eachCell((cell)=>{
        cell.font = {
            bold: true,
            size: 14
        }
    })
  
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 13; 
    worksheet.getColumn(4).width = 10; 
    worksheet.getColumn(5).width = 10; 
    worksheet.getColumn(6).width = 10; 
    worksheet.getColumn(7).width = 10; 
    worksheet.getColumn(8).width = 10; 
    worksheet.getColumn(9).width = 15; 
    worksheet.getColumn(9).eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 14
    },
      cell.alignment = { vertical: "middle", horizontal: 'right'}
    }) 
    worksheet.mergeCells(`A1:I1`)
    worksheet.mergeCells(`A2:I2`)
    worksheet.mergeCells(`A${totalsRowNumber-3}:I${totalsRowNumber-3}`)
    worksheet.mergeCells(`A${totalsRowNumber-2}:H${totalsRowNumber-2}`)
    worksheet.mergeCells(`A${totalsRowNumber-1}:H${totalsRowNumber-1}`)
    worksheet.mergeCells(`A${totalsRowNumber}:H${totalsRowNumber}`)
  
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
    workbook.xlsx.write(res)
    .then(() => {
      res.end();
    })
    .catch((error) => {
      console.error('Error writing Excel file:', error);
      res.status(500).send('Internal Server Error');
    });
  } catch(err){
    console.log(err)
    res.status(500).json({message: err.message})
  }
}




module.exports.report = async (req, res) => {
  try{
    const {report} = req.body
    // createRaortXml(report)
    res.status(200).json({message: 'Raport printat'})
  } catch(err) {
    console.log(err)
    res.status(500).json(err)
  }
}




 function round(num){
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
 function roundd(num){
    return Math.round((num + Number.EPSILON) * 100000) / 100000;
  }
  function cap(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }




  function showProduction(product){
    let = productIngredients = []
    const productQty = product.quantity
    const ingredients = [...product.ings]
    ingredients.forEach((ing) => {
      if(ing.ings && ing.ing.ings.length){
        ing.ing.ings.forEach((ing) => {
          if(ing.ing){
            const existingIng = this.productIngredients.find((p) => p.ing._id === ing.ing._id)
            if(existingIng){
              existingIng.qty += ing.qty
            } else {
              const ig = {...ing}
              this.productIngredients.push(ig)
            }
          }
          })
        }
        if(ing.ing){
          const existingIng = this.productIngredients.find((p) => p.ing._id === ing.ing._id)
          if(existingIng){
            existingIng.qty += ing.qty
          } else {
            const ig = {...ing}
            this.productIngredients.push(ig)
          }
        }
    })
    if(product.toppings.length){
      const toppings = [...product.toppings]
      toppings.forEach((topping) => {
        if(topping.ing){
          if(topping.ing.ings.length){
            topping.ing.ings.forEach((ing) => {
              if(ing.ing){
                const existingIng = this.productIngredients.find((p) => p.ing._id === ing.ing._id)
                if(existingIng){
                  existingIng.qty += ing.qty
                } else {
                  const ig = {...ing}
                  this.productIngredients.push(ig)
                }
              }
            })
          } else {
            const existingIng = this.productIngredients.find((p) => p.ing._id === topping.ing._id)
            if(existingIng){
              existingIng.qty += topping.qty
            } else {
              const topp = {...{qty: topping.qty, ing: topping.ing}}
              this.productIngredients.push(topp)
            }
          }
        }
      })
    }
    return productIngredients
  }
