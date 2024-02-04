const Nir = require('../models/office/nir');
const exceljs = require('exceljs');
const Ingredient = require('../models/office/inv-ingredient')
const Locatie = require('../models/office/locatie')
const Order = require('../models/office/product/order')
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
    doc.fontSize(7);
    doc.text("Denumire Articol", 10, y, { width: 210 });
    doc.text("UM", 215, headerHeigth, { width: 30, align: "center" });
    doc.text("Qty", 250, headerHeigth, { width: 30, align: "center" });
    doc.text("Tip", 290, headerHeigth, { width: 50, align: "center" });
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
    nir.ingredients.forEach((produs, i) => {
      const lineHeigth = 8
      doc.fontSize(5);
      doc.text(produs.name, 10, y + i * lineHeigth + lineHeigth , { width: 210 });
      doc.text(produs.um, 215, y + i * lineHeigth + lineHeigth, { width: 30, align: "center" });
      doc.text(produs.qty.toString(), 250, y + i * lineHeigth + lineHeigth, {
        width: 30,
        align: "center",
      });
      doc.text(produs.dep, 290, y + i * lineHeigth + lineHeigth, {
        width: 50,
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
    const height = nir.ingredients.length * 8;
    doc.lineWidth(0.4);
    doc
      .moveTo(10, y + height + 10)
      .lineTo(830, y + height + 10)
      .stroke();
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc.fontSize(9);
    doc.text("Total:", 370, y + height + 18);
    doc.text(`${round(valoareIntTotal)}`, 460, y + height + 18, {
      width: 50,
      align: "center",
    });
    doc.text(`${round(valTvaTotal)}`, 530, y + height + 18, {
      width: 50,
      align: "center",
    });
    if (firma.VAT) {
      doc.text(`${round(valTvaTotal + valoareIntTotal)}`, 585, y + height + 18, {
        width: 50,
        align: "center",
      });
    } else if (!firma.VAT) {
      doc.text(`${round(valTotal)}`, 585, y + height + 18, {
        width: 50,
        align: "center",
      });
    }
    doc.text(`${round(valVanzare)}`, 705, y + height + 18, {
      width: 60,
      align: "center",
    });
    doc.text(`${round(valTvaVanzare)}`, 770, y + height + 18, {
      width: 60,
      align: "center",
    });
  
    doc.lineWidth(0.5);
    doc
      .moveTo(365, y + height + 30)
      .lineTo(830, y + height + 30)
      .stroke();
  
    // doc.font("Helvetica-Bold");
    doc.fontSize(9);
    doc.text("Responsabil", 80, y + height + 40);
    doc.text(`Data`, 400, y + height + 40);
    doc.text("Semnatura", 680, y + height + 40);
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(9);
    // doc.text(`${cap(userLogat.nume)}`, 80, y + height + 120);
    doc.text(`${date}`, 400, y + height + 50);
  
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

        sortedIngs.forEach((el, i) => {
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

        worksheet.getColumn(1).width = 5;
        worksheet.getColumn(2).width = 25; 
        worksheet.getColumn(3).width = 10; 
        worksheet.getColumn(4).width = 16; 
        worksheet.getColumn(5).width = 16; 
        worksheet.mergeCells(`A1:D1`)
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
    const {filter, loc, startDate, endDate} = req.body
    const start = new Date(startDate).setUTCHours(0,0,0,0)
    const end = new Date(endDate).setUTCHours(0,0,0,0)
    const startDateToShow = new Date(startDate).toISOString().split('T')[0]
    const endDateToShow = new Date(endDate).toISOString().split('T')[0]
    const orders = await Order.find({locatie: loc, createdAt: {$gte: start, $lte: end}}).populate([
      {
        path: 'products.ings.ing', 
        populate: {path: 'ings.ing'}
      },
      {
        path: 'products.toppings.ing', 
        populate: {path: 'ings.ing'}
      }
    ])
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
                    if(updatedIng.ing.name === "Lapte Vegetal"){
                      console.log(updatedIng.qty)
                    }
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

      // const depFilter = ings.filter(obj => obj.ing['dep'] === filter.dep)
      // const gestFilter = ings.filter(obj => obj.ing['gestiune'] === filter.gesiune)
      // const prodIngFilter = ings.filter(obj => obj.ing['productIngredient'] === true)
      // let filterIngredients = [...prodIngFilter, ...gestFilter, ...depFilter]
      // if(filterIngredients.length) {
      //   filterIngredients.sort((a, b) => a.ing.name.localeCompare(b.ing.name))
      // } else {
      // }
      filterIngredients = ings.sort((a, b) => a.ing.name.localeCompare(b.ing.name))



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
        `Consum`, 
      ]
      worksheet.addRow(docTitle)
      worksheet.addRow(header)

      let totals = {
        priceNoVat: 0,
        priceVat: 0,
        priceWithVat: 0,
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
            `${round(ing.qty)}`,
          ]
          )
         totals.priceNoVat += priceNoVat 
         totals.priceVat += priceVat
         totals.priceWithVat += priceWithVat
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
      worksheet.getColumn(10).eachCell((cell) => {
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










 function round(num){
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  function cap(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }
