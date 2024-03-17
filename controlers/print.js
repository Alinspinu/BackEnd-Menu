const Nir = require('../models/office/nir');
const exceljs = require('exceljs');
const Ingredient = require('../models/office/inv-ingredient')
const Locatie = require('../models/office/locatie')
const Suplier = require('../models/office/suplier')
const Order = require('../models/office/product/order')
const Bill = require('../models/office/bill')
const User = require('../models/users/user')
const PDFDocument = require("pdfkit");
const { getProducts } = require('./back-office/product');
const { saveProductIngredient } = require('./nutrition');


module.exports.printNir = async (req, res, next) => {
  // const firma = await Locatie.findById(loc)
  const {id} = req.query
  
  const nir = await Nir.findById(id)
  .populate({
    path: "suplier",
    select: "name vatNumber",
  })
  .populate({
    path: 'locatie'
  })
  const firma = nir.locatie
      if(nir.discount.length){
      nir.discount.forEach(discount => {
        nir.ingredients.forEach(ing => {
          if(ing.tva === discount.tva){
            ing.price = round(ing.price + (ing.price * discount.procent / 100))
            ing.value = round(ing.price * ing.qty)
            ing.tvaValue = round(ing.value * ing.tva / 100)
            ing.total = round(ing.value + ing.tvaValue)
          }
        })
        const ingredient = {
          name: `Discount ${discount.tva}%`,
          um: "buc",
          qty: 1,
          dep: '-',
          price: -discount.value,
          value: -discount.value,
          gestiune: '-',
          tva: discount.tva,
          tvaValue: round(-discount.value * discount.tva / 100),
          total: round(-discount.value + (-discount.value * discount.tva / 100)),
          sellPrice: 0,
        }
        nir.ingredients.push(ingredient)
      })
        console.log(nir.discount)
      }
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const date = nir.documentDate
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");
  
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
    });
  
    // Add header
    doc.font("public/font/RobotoSlab-Regular.ttf")
    doc
      .fontSize(6)
      .text(
        `${firma.bussinessName} ${firma.vatNumber} ${firma.register} `,
        10,
        10,
        {
          width: 280,
        }
      );
    doc.fontSize(6).text(`${firma.address}`, 10, 15, {
      width: 280,
    });
  
    doc.moveDown();
  
    doc.lineWidth(0.4);
    doc.moveTo(5, 22).lineTo(280, 22).stroke();
  
    doc.moveDown();
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc
      .fontSize(12)
      .text("Nota de receptie si constatare de diferente", 275, 25, {
        underline: true,
      });
  
    doc.moveDown();
    // doc.font("Helvetica-Bold");
    doc.fontSize(9);
    doc.text("Nr. NIR", 20, 50, { width: 80, align: "center" });
    doc.text("Data", 110, 50, { width: 120, align: "center" });

    doc.text("Furnizor", 370, 50, { width: 220, align: "center" });
    doc.text("CIF", 590, 50, { width: 120, align: "center" });
    doc.text("Nr.Doc", 710, 50, { width: 80, align: "center" });
  
    doc.moveDown();
    doc.lineWidth(0.3);
    doc.moveTo(10, 62).lineTo(800, 62).stroke();
  
    doc.moveDown();
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(9);
    doc.text(nir.index, 20, 63, { width: 80, align: "center" });
    doc.text(date, 110, 63, { width: 120, align: "center" });

    doc.text(nir.suplier.name, 370, 63, { width: 220, align: "center" });
    doc.text(nir.suplier.vatNumber, 590, 63, { width: 120, align: "center" });
    doc.text(nir.nrDoc, 710, 63, { width: 80, align: "center" });
  
    doc.moveDown();
      let headerHeigth = 97
    let y = 100;
    const availableSpace = doc.page.height - y; // Calculate available space on the page
    // let startY = 10
    // let currentY = y;
  
    function addNewPageIfRequired(height) {
      if (y + height > 500) {
        console.log('hit the function')
        doc.addPage();
        y = 10;
      }
    }

    // Table headers
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc.fontSize(9);
    doc.text("Nr.", 10, y, { width: 15 });
    doc.text("Denumire Articol", 30, y, { width: 210 });
    doc.text("UM", 215, headerHeigth, { width: 30, align: "center" });
    doc.text("Qty", 250, headerHeigth, { width: 20, align: "center" });
    doc.text("Tip", 270, headerHeigth, { width: 65, align: "center" });
    doc.text("Gestiune", 340, headerHeigth, { width: 50, align: "center" });
  
    if (firma.VAT) {
      doc.text("Pret/F/Tva", 390, headerHeigth, { width: 70, align: "center" });
    } else if (!firma.VAT) {
      doc.text("Pret", 390, headerHeigth, { width: 50, align: "center" });
    }
    doc.text("Valoare", 460, headerHeigth, { width: 50, align: "center" });
    doc.text("Tva%", 510, headerHeigth, { width: 30, align: "center" });
    doc.text("Val Tva", 540, headerHeigth, { width: 40, align: "center" });
    doc.text("Total", 590, headerHeigth, { width: 50, align: "center" });
    doc.text("Pret Vanzare", 640, headerHeigth, { width: 65, align: "center" });
    doc.text("Val Vanzare", 705, headerHeigth, { width: 60, align: "center" });
    doc.text("Total Tva", 770, headerHeigth, { width: 60, align: "center" });
  
    // doc.moveDown();
  
    doc.lineWidth(0.1);
    doc.moveTo(5, 96).lineTo(825, 96).stroke();
  
    doc.moveDown();
    // Add table rows
  
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(10);
    let valoareIntTotal = 0;
    let valTvaTotal = 0;
    let valVanzare = 0;
    let valTvaVanzare = 0;
    let valTotal = 0;
    let lineHeigth = 16
    const ingCount = nir.ingredients.length
    if(ingCount >= 10 && ingCount <= 20){
      doc.fontSize(8);
      lineHeigth = 12
    }
    if(ingCount >= 21 && ingCount <= 30){
      doc.fontSize(7);
      lineHeigth = 10
    }
    if(ingCount >= 31 && ingCount <= 40){
      doc.fontSize(6);
      lineHeigth = 9
    }
    if(ingCount > 40){
      doc.fontSize(5);
      lineHeigth = 7
    }
    nir.ingredients.forEach((produs, i) => {
      doc.text(`${i+1}.`, 10, y + i * lineHeigth + lineHeigth , { width: 15 });
      doc.text(produs.name, 30, y + i * lineHeigth + lineHeigth , { width: 210 });
      doc.text(produs.um, 215, y + i * lineHeigth + lineHeigth, { width: 30, align: "center" });
      doc.text(produs.qty.toString(), 250, y + i * lineHeigth + lineHeigth, {
        width: 20,
        align: "center",
      });
      doc.text(produs.dep, 270, y + i * lineHeigth + lineHeigth, {
        width: 65,
        align: "center",
      });
      doc.text(cap(produs.gestiune), 340, y + i * lineHeigth + lineHeigth, {
        width: 50,
        align: "center",
      });
      doc.text(round(produs.price), 390, y + i * lineHeigth + lineHeigth, {
        width: 70,
        align: "center",
      });
      doc.text(round(produs.value), 460, y + i * lineHeigth + lineHeigth, {
        width: 50,
        align: "center",
      });
      doc.text(produs.tva + "%", 510, y + i * lineHeigth + lineHeigth, {
        width: 25,
        align: "center",
      });
      doc.text(round(produs.tvaValue), 535, y + i * lineHeigth + lineHeigth, {
        width: 40,
        align: "center",
      });
      doc.text(round(produs.total), 590, y + i * lineHeigth + lineHeigth, {
        width: 45,
        align: "center",
      });
      doc.text(
        `${produs.sellPrice? produs.sellPrice : 0}`,
        640,
        y + i * lineHeigth + lineHeigth,
        { width: 60, align: "center" }
      );
      doc.text(
        `${produs.sellPrice ? produs.sellPrice * produs.qty : 0}`,
        705,
        y + i * lineHeigth + lineHeigth,
        { width: 60, align: "center" }
      );
      doc.text(
        `${produs.sellPrice
          ? round(
            produs.sellPrice * produs.qty * (produs.tva / 100)
          )
          : "0"
        }`,
        770,
        y + i * lineHeigth + lineHeigth,
        { width: 60, align: "center" }
      );
      valTotal +=  parseFloat(produs.total);
      valoareIntTotal += parseFloat(produs.value);
      valTvaTotal += parseFloat(produs.tvaValue);
      valVanzare +=
        parseFloat(produs.sellPrice) * parseFloat(produs.qty);
      valTvaVanzare += round(
        parseFloat(produs.sellPrice) *
        parseFloat(produs.qty) *
        (parseFloat(produs.tva) / 100)
      );

      // y += 5
    });
    const height = nir.ingredients.length * lineHeigth;
    doc.lineWidth(0.4);
    doc
      .moveTo(10, y + height + 14)
      .lineTo(830, y + height + 14)
      .stroke();
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc.fontSize(9);
    doc.text("Total:", 370, y + height + 20);
    doc.text(`${round(valoareIntTotal)}`, 460, y + height + 20, {
      width: 50,
      align: "center",
    });
    doc.text(`${round(valTvaTotal)}`, 530, y + height + 20, {
      width: 50,
      align: "center",
    });
    if (firma.VAT) {
      doc.text(`${round(valTvaTotal + valoareIntTotal)}`, 585, y + height + 20, {
        width: 50,
        align: "center",
      });
    } else if (!firma.VAT) {
      doc.text(`${round(valTotal)}`, 585, y + height + 20, {
        width: 50,
        align: "center",
      });
    }
    doc.text(`${round(valVanzare)}`, 705, y + height + 20, {
      width: 60,
      align: "center",
    });
    doc.text(`${round(valTvaVanzare)}`, 770, y + height + 20, {
      width: 60,
      align: "center",
    });
  
    doc.lineWidth(0.5);
    doc
      .moveTo(365, y + height + 35)
      .lineTo(830, y + height + 35)
      .stroke();
  
    // doc.font("Helvetica-Bold");
    doc.fontSize(9);
    doc.text("Responsabil", 80, y + height + 45);
    doc.text(`Data`, 400, y + height + 45);
    doc.text("Semnatura", 680, y + height + 45);
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(9);
    // doc.text(`${cap(userLogat.nume)}`, 80, y + height + 120);
    doc.text(`${date}`, 400, y + height + 55);
  
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



  module.exports.createIngredientsInvXcel = async (req, res, next) => {
          const {loc} = req.body
          let filterTo = {}
          const filter = req.body.filter
          if(filter && filter.gestiune.length){
            filterTo.gestiune = filter.gestiune
          }
          if(filter && filter.type.length){
            if(filter.type === "compus"){
              filterTo.ings = { $exists: true, $ne: [] }
            } else {
              filterTo.ings = { $eq: [] }
            }
          }
          filterTo.locatie = loc
    try{

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Lista ingrediente');
        const ings = await Ingredient.find(filterTo)
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
          if(el.qty > 0){
            const price = round(el.qty * el.price)
            totalPretAchizitie += price
          }
          worksheet.addRow(
            [
              `${i+1}`,
              `${el.name}`,
              `${el.um}`,
              `${round(el.qty)}`,
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

    console.log(totalsRowNumber)
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




module.exports.printConsum = async (req, res) => {
  try{
    let ings = []
    const {dep, loc, startDate, endDate, dont} = req.body
    const start = new Date(startDate).setUTCHours(0,0,0,0)
    const end = new Date(endDate).setUTCHours(0,0,0,0)
    const startDateToShow = new Date(startDate).toISOString().split('T')[0]
    const endDateToShow = new Date(endDate).toISOString().split('T')[0]
    const orders = await Order.find({locatie: loc, createdAt: {$gte: start, $lte: end}, dont: dont}).populate([
      {
        path: 'products.ings.ing', 
        populate: {path: 'ings.ing'}
      },
      {
        path: 'products.toppings.ing', 
        populate: {path: 'ings.ing'}
      }
    ])
    console.log('numar comenzi', orders.length)
      if(orders){
        orders.forEach(order=> {
          order.products.forEach(product => {
            product.ings.forEach(ing => {
             
              if(ing.ings && ing.ings.length){
                ing.ings.forEach(ig => {
                  // if(ig.ing.name === "Lapte Vegetal"){
                  //   console.log(ig.ing.qty)
                  // }
                  const existingIngredient = ings.find(p =>p.ing.name === ig.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + ig.qty,
                      ing: existingIngredient.ing
                    }
                    ings = ings.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
                    // existingIngredient.qty += ig.qty 
                  } else {
                    ings.push(ig);
                  }
                })
              } else {
                if(ing && ing.ing){
                  const existingIngredient = ings.find(p =>p.ing.name === ing.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + ing.qty,
                      ing: existingIngredient.ing
                    }
                    ings = ings.map(p => (p.ing.name === ing.ing.name ? updatedIng : p));
                    // existingIngredient.qty += ing.qty
                  } else {
                    ings.push(ing);
                  }
                }
                else {
                  // console.log(ing)
                }
              }
            })
            if(product.toppings.length){
              product.toppings.forEach(topping=>{
                if(topping.ing.ings.length){
                  topping.ing.ings.forEach(ig => {
                    const existingIngredient = ings.find(p =>p.ing.name === ig.ing.name);
                    if (existingIngredient) {
                      const updatedIng = {
                        qty: existingIngredient.qty + ig.qty,
                        ing: existingIngredient.ing
                      }
                        ings = ings.map(p => (p.ing.name === ig.ing.name ? updatedIng : p));
                    } else {
                      ings.push(ig);
                    }
                  })
                }
                else{
                  const existingIngredient = ings.find(p =>p.ing.name === topping.ing.name);
                  if (existingIngredient) {
                    const updatedIng = {
                      qty: existingIngredient.qty + topping.qty,
                      ing: existingIngredient.ing
                    }
                    // if(updatedIng.ing.name === "Lapte Vegetal"){
                    //   console.log(updatedIng.qty)
                    // }
                    ings = ings.map(p => (p.ing.name === topping.ing.name ? updatedIng : p));
                  } else {
                    const ig = {
                      qty: topping.qty,
                      ing: topping.ing
                    }
                    ings.push(ig);
                  }
                }
              })
            }
          })
        })
      } 
      ings.sort((a, b) => a.ing.name.localeCompare(b.ing.name))
      filterIngredients = ings.sort((a, b) => a.ing.name.localeCompare(b.ing.name))
      if(dep && dep.length){
        filterIngredients = filterIngredients.filter(ing => ing.ing.dep === dep)
      }
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet(`Consum Materii Prime`);


      const docTitle =  [
        `Consum ${startDateToShow} pana la ${endDateToShow}`,
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
        `Denumire Ingredient`,
        'Departament',
        'UM',
        'Cota Tva',
        `Pret/UM/F TVA`, 
        'Valoare F TVA',
        'Valoare TVA',
        'Valoare cu Tva',
        'Pret Vanzare',
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


      filterIngredients.forEach((ing, i) =>{
        const priceNoVat = ing.ing.price * ing.qty
        const priceVat = priceNoVat * (ing.ing.tva / 100)
        const priceWithVat = priceNoVat + priceVat
        worksheet.addRow(
          [
            `${i+1}`,
            `${ing.ing.name}`,
            `${ing.ing.dep}`,
            `${ing.ing.um}`,
            `${ing.ing.tva} %`,
            `${ing.ing.price}`,
            `${round(priceNoVat)}`,
            `${round(priceVat)}`,
            `${round(priceWithVat)}`,
            `${ing.ing.sellPrice}`,
            `${round(ing.qty)}`,
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
        `${round(totals.priceNoVat)}`,
        `${round(totals.priceVat)}`,
        `${round(totals.priceWithVat)}`,
        `${round(totals.sellPrice)}`
      ]
      worksheet.addRow(totalsRow)

      const totalsRowNumber = worksheet.lastRow.number
      worksheet.getRow(totalsRowNumber).eachCell((cell)=>{
          cell.font = {
              bold: true,
              size: 14
          }
      })

      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 20; 
      worksheet.getColumn(3).width = 10; 
      worksheet.getColumn(4).width = 6; 
      worksheet.getColumn(5).width = 9; 
      worksheet.getColumn(6).width = 13; 
      worksheet.getColumn(7).width = 13; 
      worksheet.getColumn(8).width = 13; 
      worksheet.getColumn(9).width = 13; 
      worksheet.getColumn(10).width = 13; 
      worksheet.getColumn(11).eachCell((cell) => {
        cell.font = {
          bold: true,
          size: 14
      },
        width = 15,
        cell.alignment = { vertical: "middle", horizontal: 'right'}
      }) 
      worksheet.mergeCells(`A${totalsRowNumber}:F${totalsRowNumber}`)

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



module.exports.factura = async (req, res, next) => {
  const {orderId, locId, clientId, userId} = req.body
  const nota = await Order.findById(orderId)
  const locatie = await Locatie.findById(locId)
  const client = await Suplier.findById(clientId)
  const user = await User.findById(userId)
  const bill = new Bill({
      serie: 'SLR',
      locatie: locatie._id,
      client: clientId,
      products: nota.products
  })
 const savedBill = await bill.save()
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const date = savedBill.createdAt
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");

  const doc = new PDFDocument({
      size: "A4",
      layout: "portrait",
  });

  //HEADER FURNIZOR

  //Nume furnizor
  doc.fontSize(10)
  doc.text('Furnizor', 25 + 10, 10)
  doc.fontSize(18);
  doc.font('Times-Bold')
  doc.text(`${locatie.bussinessName}`, 25 + 10, 25);
  doc.lineWidth(1.3);
  doc.moveTo(25 + 10, 45).lineTo(560, 45).stroke();

  //header date firma
  doc.fontSize(10);
  doc.text(`C.I.F.:`, 25 + 10, 50, { width: 30, align: "left" });
  doc.text(`Nr. Reg. Com.:`, 25 + 10, 62, { width: 70, align: "left" });
  doc.text(`Capital social:`, 25 + 10, 74, { width: 70, align: "left" });
  doc.text(`Adresa:`, 25 + 10, 86, { width: 38, align: "left" })
  doc.font("public/font/RobotoSlab-Regular.ttf");
  doc.text(`Email:`, 25 + 10, 140, { width: 35, align: "left" })
  doc.text(`Banca:`, 25 + 10, 152, { width: 35, align: "left" })
  doc.text(`Cont:`, 25 + 10, 164, { width: 30, align: "left" })

  //date firma

  doc.fontSize(10);
  doc.font('Times-Roman')
  doc.text(`${locatie.vatNumber}`, 55 + 10, 50);
  doc.text(`${locatie.register}`, 95 + 10, 62);
  doc.text(`200 lei`, 95 + 10, 74);
  doc.font("public/font/RobotoSlab-Regular.ttf");
  doc.text(`${locatie.address}`, 25 + 10, 86 + 12, { width: 220, align: "left" })

  doc.text(`office@truefinecoffee.ro`, 60 + 10, 140)
  doc.text(`${locatie.bank}`, 60 + 10, 152)
  doc.text(`${locatie.account}`, 55 + 10, 164)

  //HEADER CLIENT
  //Nume client
  doc.fontSize(10)

  doc.fontSize(12);
  doc.font('Times-Bold')


  // header date client
  doc.fontSize(10);
  doc.font('Times-Bold')
  doc.text('Client:', 395 - 40, 50, { width: 35, align: "left" })
  doc.text(`C.I.F.:`, 395 - 40, 82 - 7, { width: 30, align: "left" });
  doc.text(`Nr. Reg. Com.:`, 395 - 40, 94 - 7, { width: 70, align: "left" });
  doc.text(`Adresa:`, 395 - 40, 106 - 7, { width: 40, align: "left" })



  //date client
  doc.fontSize(10);
  doc.font('Times-Roman')
  doc.text(`${client.name}`, 430 - 40, 50, { width: 215, align: "left" });
  doc.text(`${client.vatNumber}`, 415 + 10 - 40, 82 - 7, { width: 145, align: "left" });
  doc.text(`${client.register}`, 455 + 10 - 40, 94 - 7, { width: 105, align: "left" });
  doc.font("public/font/RobotoSlab-Regular.ttf");
  doc.text(`${client.address || ''}`, 395 - 40, 106 + 5, { width: 215, align: "left" })



  //Titlu factura

  doc.roundedRect(220, 220, 130, 50, 5)
  doc.lineWidth(0.5);
  doc.stroke()
  doc.font('Times-Roman')
  doc.fontSize(24)
  doc.text('FACTURA', 228, 190)
  doc.fontSize(11)
  doc.text('Numar:', 225, 190 + 35, { width: 40, align: "left" })
  doc.text('Serie:', 225, 205 + 35, { width: 40, align: "left" })
  doc.text('Data:', 225, 220 + 35, { width: 40, align: "left" })

  // Titlu Factura Date
  doc.font('Times-Bold')
  doc.text(`${bill.index}`, 265, 190 + 35)
  doc.text(`${bill.serie}`, 265, 205 + 35)
  doc.text(`${date}`, 265, 220 + 35)

  //header produse
  doc.rect(25, 280, 18, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.font('Times-Roman')
  doc.fontSize(9)
  doc.text('Nr.', 26, 281)
  doc.text('crt.', 26, 296)

  doc.rect(43, 280, 230, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('Denumirea produselor si serviciilor', 44, 293, { width: 228, align: "center" })

  doc.rect(273, 280, 30, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('U.M.', 275, 293, { width: 28, align: "center" })

  doc.rect(303, 280, 60, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('Cantitate', 305, 293, { width: 58, align: "center" })

  doc.rect(363, 280, 60, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('Pret unitar', 365, 287, { width: 58, align: "center" })
  doc.text('fara T.V.A.', 365, 299, { width: 58, align: "center" })

  doc.rect(423, 280, 60, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('Valoare', 425, 287, { width: 58, align: "center" })
  doc.text('fara T.V.A.', 425, 299, { width: 58, align: "center" })

  doc.rect(483, 280, 77, 30)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('T.V.A.', 485, 285, { width: 75, align: "center" })
  doc.text('Cota', 485, 299, { width: 35, align: "left" })
  doc.text('Valoare', 521, 299, { width: 38, align: "right" })

  //little header
  doc.rect(25, 311, 18, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('0', 26, 315, { width: 17, align: "center" })

  doc.rect(43, 311, 230, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('1', 44, 315, { width: 228, align: "center" })

  doc.rect(273, 311, 30, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('2', 274, 315, { width: 28, align: "center" })

  doc.rect(303, 311, 60, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('3', 304, 315, { width: 58, align: "center" })

  doc.rect(363, 311, 60, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('4', 364, 315, { width: 58, align: "center" })

  doc.rect(423, 311, 60, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('5 = 3 x 4', 424, 315, { width: 58, align: "center" })

  doc.rect(483, 311, 77, 15)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.text('6', 484, 315, { width: 75, align: "center" })
  y = 317
  let heghtValue = 12
  //Body produse
  doc.rect(25, 327, 18, 330)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(43, 327, 230, 330)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(273, 327, 30, 330)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(303, 327, 60, 330)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(363, 327, 60, 330)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(423, 327, 60, 330)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(483, 327, 77, 330)
  doc.lineWidth(0.5);
  doc.stroke()
  // radare produse

  let valFaraTva = 0
  let valTva = 0
  doc.font("public/font/RobotoSlab-Regular.ttf");
  doc.fontSize(9)
  let products = []
  savedBill.products.forEach(el => {
    const existingProduct = products.find(p => p.name === el.name)
    if(existingProduct){
      existingProduct.quantity += el.quantity
    } else {
      products.push(el)
    }
  })
  if(nota.tips > 0){
    const tips ={
      name: 'Bacsis',
      quantity: 1,
      price: nota.tips,
      total: nota.tips,
      tva: 0,
      discount: 0,
    }
    products.push(tips)
  }
  const productsCount = products.length
  let rowHeigth = 12

  if(productsCount >= 25 && productsCount <= 40){
    doc.fontSize(8)
    rowHeigth = 10
  }
  if(productsCount >= 41 && productsCount <= 50){
    doc.fontSize(6)
    rowHeigth = 8
  }
  if(productsCount > 50){
    doc.fontSize(5)
    rowHeigth = 7
  }

  products.forEach((el, i) => {
    const price = +el.total - el.discount
    if(el.name.length > 30){
      el.name = el.name.slice(0, 40)
    }
      let newValue = y + heghtValue
      doc.text(`${i + 1}`, 26, newValue, { width: 17, align: "center" })
      doc.text(`${el.name}`, 47, newValue, { width: 225, align: 'left' })
      doc.text(`Buc`, 274, newValue, { width: 28, align: "center" })
      doc.text(`${el.quantity}.00`, 304, newValue, { width: 58, align: "center" })
      doc.text(`${round(price / (1 + (el.tva / 100)))}`, 364, newValue, { width: 58, align: "center" })
      doc.text(`${round(el.quantity * (price / (1 + (el.tva / 100))))}`, 424, newValue, { width: 58, align: "center" })
      doc.text(`${el.tva}%`, 486, newValue, { width: 35, align: "left" })
      doc.text(`${round((el.quantity * price) - (el.quantity * (price / (1 + (el.tva / 100)))))}0`, 523, newValue, { width: 30, align: "right" })
      const valTotProdFaraTva = round(el.quantity * (price - (price * (el.tva / 100))))
      const valTotProdTva = round((el.quantity * price) - (el.quantity * (price - (price * (el.tva / 100)))))
      valFaraTva += valTotProdFaraTva
      valTva += valTotProdTva
      heghtValue += rowHeigth
  })

  doc.fontSize(10)
  doc.font('Times-Roman')
  doc.text(`Document intocmit de ${user.name}`, 27, 659)
  //footer factura
  doc.rect(25, 669, 100, 105)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.fontSize(10)
  doc.font('Times-Roman')
  doc.text('Semnatura si', 26, 675, { width: 98, align: 'center' })
  doc.text('stampila', 26, 687, { width: 98, align: 'center' })
  doc.text('furnizorului', 26, 699, { width: 98, align: 'center' })

  doc.rect(125, 669, 238, 105)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.fontSize(9)
  doc.text('Numele delegatului:', 126, 672, { width: 80, align: 'right' })
  doc.text('Buletin/CI:', 126, 688, { width: 80, align: 'right' })
  doc.text('Seria:', 216, 688, { width: 30, align: 'left' })
  doc.text('Nr.:', 256, 688, { width: 50, align: 'left' })
  doc.text('Eliberat:', 126, 704, { width: 80, align: 'right' })

  doc.text('Semnatura Delegat', 126, 722)
  doc.rect(363, 669, 60, 105)
  doc.lineWidth(0.5);
  doc.stroke()
  doc.font('Times-Bold')
  doc.fontSize(12)
  doc.text('TOTAL', 365, 672)
  doc.text('TOTAL', 425, 725)
  doc.text(`${round(valFaraTva + valTva)} Lei`, 484, 725, { width: 73, align: 'right' })
  doc.fontSize(9)
  doc.font('Times-Roman')
  doc.text('Semnatura', 364, 721, { width: 58, align: 'center' })
  doc.text('de', 364, 734, { width: 58, align: 'center' })
  doc.text('primire', 364, 746, { width: 58, align: 'center' })
  doc.font('Times-Bold')
  doc.text(`${round(valFaraTva)} Lei`, 424, 675, { width: 58, align: 'center' })
  doc.text(`${round(valTva)} Lei`, 484, 675, { width: 73, align: 'right' })
  doc.lineWidth(0.3);
  doc.moveTo(125, 719).lineTo(560, 719).stroke();



  doc.rect(423, 669, 60, 105)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.rect(483, 669, 77, 105)
  doc.lineWidth(0.5);
  doc.stroke()

  doc.end()
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
  })
}









 function round(num){
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  function cap(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }
