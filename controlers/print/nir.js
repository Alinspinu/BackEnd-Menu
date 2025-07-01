const PDFDocument = require("pdfkit");

const {round} = require('../../utils/functions')


function createNir (nir) {
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
      }
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };

    const date = nir.documentDate
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");

    const recDate = nir.receptionDate
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");

    let doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
    });
  
    // Add header
    doc.font("public/font/RobotoSlab-Regular.ttf")
    doc
      .fontSize(8)
      .text(
        `${firma.bussinessName} ${firma.vatNumber} ${firma.register} `,
        10,
        10,
        {
          width: 380,
        }
      );
    doc.fontSize(7).text(`${firma.address}`, 10, 20, {
      width: 380,
      underline: true
    });

    doc.fontSize(9).text(`Punct de lucru: ${nir.salePoint.name.toUpperCase()}`, 600, 15, {
      width: 280,
    });
  
    doc.moveDown();
  
    // doc.lineWidth(0.4);
    // doc.moveTo(5, 30).lineTo(340, 30).stroke();
    let titleHeigth = 40
    let headHeigth = titleHeigth + 30
    let headerHeigth = titleHeigth + 77
  
    doc.moveDown();
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc
      .fontSize(12)
      .text("Nota de receptie si constatare de diferente", 275, titleHeigth, {
        underline: true,
      });
  
    doc.moveDown();
    // doc.font("Helvetica-Bold");
    doc.fontSize(9);
    doc.text("Nr. NIR", 20, headHeigth, { width: 80, align: "center" });
    doc.text("Data Document", 110, headHeigth, { width: 120, align: "center" });
    doc.text("Data Receptie", 230, headHeigth, { width: 120, align: "center" });

    doc.text("Furnizor", 370, headHeigth, { width: 220, align: "center" });
    doc.text("CIF", 590, headHeigth, { width: 120, align: "center" });
    doc.text("Nr.Doc", 710, headHeigth, { width: 80, align: "center" });
  
    doc.moveDown();
    doc.lineWidth(0.3);
    doc.moveTo(10, 82).lineTo(800, headHeigth + 12).stroke();
    
    doc.moveDown();
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(9);
    doc.text(nir.index, 20, headHeigth + 13, { width: 80, align: "center" });
    doc.text(date, 110, headHeigth + 13, { width: 120, align: "center" });
    doc.text(recDate, 230, headHeigth + 13, { width: 120, align: "center" });

    doc.text(nir.suplier.name, 370, headHeigth + 13, { width: 220, align: "center" });
    doc.text(nir.suplier.vatNumber, 590, headHeigth + 13, { width: 120, align: "center" });
    doc.text(nir.nrDoc, 710, headHeigth + 13, { width: 100, align: "center" });
  
    doc.moveDown();
  
    let y = headerHeigth;
 
    doc.lineWidth(0.1);
    doc.moveTo(5, headerHeigth - 2).lineTo(825, headerHeigth - 2).stroke();
  
    doc.moveDown();
  
    doc.fontSize(9);
    let valoareIntTotal = 0;
    let valTvaTotal = 0;
    let valVanzare = 0;
    let valTvaVanzare = 0;
    let valTotal = 0;
    let lineHeigth = 14
    const ingChunks = splitIngredients(nir.ingredients)

    let pages = ingChunks.length

    

    nir.ingredients.forEach((produs, i) => {
      valTotal +=  parseFloat(produs.total);
      valoareIntTotal += parseFloat(produs.value);
      valTvaTotal += parseFloat(produs.tvaValue);
      valVanzare += parseFloat(produs.sellPrice) * parseFloat(produs.qty);
      valTvaVanzare += round(
        parseFloat(produs.sellPrice) *
        parseFloat(produs.qty) *
        (parseFloat(produs.tva) / 100)
      );
    });

    ingChunks.forEach((ch, i) => {
        doc = addIngredients(doc, ch, lineHeigth, y, i+1, pages, valTotal, valoareIntTotal, valTvaTotal, valVanzare, valTvaVanzare, firma.VAT, date)
    })


    return doc
}


function addIngredients(doc, ingredients, lineHeigth, y, page, pageLenght, valTotal, valoareIntTotal, valTvaTotal, valVanzare, valTvaVanzare, vat, date) {
    if(page !== 1) {
        y = y - 80
    } 
       let headerHeigth = y
        doc.font("public/font/RobotoSlab-Bold.ttf");
        doc.fontSize(9);
        doc.text("Nr.", 10, headerHeigth, { width: 15 });
        doc.text("Denumire Articol", 30, headerHeigth, { width: 210 });
        doc.text("UM", 215, headerHeigth, { width: 25, align: "center" });
        doc.text("Qty", 250, headerHeigth, { width: 30, align: "center" });
        doc.text("Tip", 270, headerHeigth, { width: 65, align: "center" });
        doc.text("Gestiune", 340, headerHeigth, { width: 50, align: "center" });
    
        if (vat) {
        doc.text("Pret/F/Tva", 390, headerHeigth, { width: 70, align: "center" });
        } else {
        doc.text("Pret", 390, headerHeigth, { width: 50, align: "center" });
        }
        doc.text("Valoare", 460, headerHeigth, { width: 50, align: "center" });
        doc.text("Tva%", 510, headerHeigth, { width: 30, align: "center" });
        doc.text("Val Tva", 540, headerHeigth, { width: 40, align: "center" });
        doc.text("Total", 590, headerHeigth, { width: 50, align: "center" });
        doc.text("Pret Vanzare", 640, headerHeigth, { width: 65, align: "center" });
        doc.text("Val Vanzare", 705, headerHeigth, { width: 60, align: "center" });
        doc.text("Total Tva", 770, headerHeigth, { width: 60, align: "center" });

        doc.font("public/font/RobotoSlab-Regular.ttf");

    ingredients.forEach((produs, i) => {
        doc.text(`${i+1}.`, 10, y + i * lineHeigth + lineHeigth , { width: 15 });
        doc.text(produs.name, 30, y + i * lineHeigth + lineHeigth , { width: 210 });
        doc.text(produs.um, 215, y + i * lineHeigth + lineHeigth, { width: 25, align: "center" });
        doc.text(round(produs.qty).toString(), 250, y + i * lineHeigth + lineHeigth, {
          width: 30,
          align: "center",
        });
        doc.text(produs.dep.split(' ')[0], 270, y + i * lineHeigth + lineHeigth, {
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
    })
    const pageWidth = doc.page.width;
      
    let height = ingredients.length * lineHeigth;
    if(page < pageLenght){
        doc.fontSize(10)
        //   .fillColor('gray')
          .text(`Page ${page} of ${pageLenght}`, pageWidth / 2 - 40, height + y + 20);
        doc.addPage()
    } else {
        if(ingredients.length > 30 || (ingredients.length > 24 && page === 1)) {
            doc.addPage()
            height = 20
        }
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
        if (vat) {
        doc.text(`${round(valTvaTotal + valoareIntTotal)}`, 585, y + height + 20, {
            width: 50,
            align: "center",
          });
        } else {
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

        doc.fontSize(10)
        //   .fillColor('gray')
          .text(`Page ${page} of ${pageLenght}`, pageWidth / 2 - 40, height + y + 20);

    }
    return doc
}

  function splitIngredients(arr, firstChunkSize = 26, otherChunkSize = 30) {
    const result = [];
  
    // First chunk
    result.push(arr.slice(0, firstChunkSize));
  
    // Remaining chunks
    for (let i = firstChunkSize; i < arr.length; i += otherChunkSize) {
      result.push(arr.slice(i, i + otherChunkSize));
    }
  
    return result;
  }


function cap(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

module.exports = {createNir}