const Nir = require('../models/office/nir');
const Locatie = require('../models/office/locatie')
const PDFDocument = require("pdfkit");


module.exports.printNir = async (req, res, next) => {
    const nir = await Nir.findOne({}, {}, { sort: { _id: -1 } })
      .populate({
        path: "suplier",
        select: "name vatNumber",
      })
    const firma = await Locatie.findOne({name: 'True'});
      console.log(nir, firma)
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const date = nir.date
      .toLocaleDateString("en-GB", options)
      .replace(/\//g, "-");
  
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
    });
  
    // Add header
    doc.font("public/font/RobotoSlab-Regular.ttf")
    doc
      .fontSize(9)
      .text(
        `${firma.bussinessName} ${firma.vatNumber} ${firma.register} `,
        10,
        20,
        {
          width: 280,
        }
      );
    doc.fontSize(9).text(`${firma.address}`, 10, 30, {
      width: 280,
    });
  
    doc.moveDown();
  
    doc.lineWidth(0.4);
    doc.moveTo(5, 57).lineTo(280, 57).stroke();
  
    doc.moveDown();
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc
      .fontSize(16)
      .text("Nota de receptie si constatare de diferente", 275, 75, {
        underline: true,
      });
  
    doc.moveDown();
    // doc.font("Helvetica-Bold");
    doc.fontSize(12);
    doc.text("Nr. NIR", 20, 150, { width: 80, align: "center" });
    doc.text("Data", 110, 150, { width: 120, align: "center" });
    doc.text("Moneda", 240, 150, { width: 120, align: "center" });
    doc.text("Furnizor", 370, 150, { width: 220, align: "center" });
    doc.text("CIF", 590, 150, { width: 120, align: "center" });
    doc.text("Nr.Doc", 710, 150, { width: 80, align: "center" });
  
    doc.moveDown();
    doc.lineWidth(0.3);
    doc.moveTo(10, 169).lineTo(800, 169).stroke();
  
    doc.moveDown();
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(10);
    doc.text(nir.index, 20, 170, { width: 80, align: "center" });
    doc.text(date, 110, 170, { width: 120, align: "center" });
    doc.text("RON", 240, 170, { width: 120, align: "center" });
    doc.text(nir.suplier.name, 370, 170, { width: 220, align: "center" });
    doc.text(nir.suplier.vatNumber, 590, 170, { width: 120, align: "center" });
    doc.text(nir.nrDoc, 710, 170, { width: 80, align: "center" });
  
    doc.moveDown();
    let y = 220;
    // Table headers
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc.fontSize(10);
    doc.text("Denumire Articol", 10, y, { width: 110 });
    doc.text("UM", 115, y, { width: 40, align: "center" });
    doc.text("Qty", 160, y, { width: 40, align: "center" });
    doc.text("Tip", 225, y, { width: 70, align: "center" });
    doc.text("Gestiune", 300, y, { width: 70, align: "center" });
  
    if (firma.VAT) {
      doc.text("Pret/F/Tva", 375, y, { width: 70, align: "center" });
    } else if (!firma.VAT) {
      doc.text("Pret", 375, y, { width: 50, align: "center" });
    }
    doc.text("Valoare", 450, y, { width: 40, align: "center" });
    doc.text("Tva%", 505, y, { width: 30, align: "center" });
    doc.text("Val Tva", 540, y, { width: 40, align: "center" });
    doc.text("Total", 585, y, { width: 50, align: "center" });
    doc.text("Pret Vanzare", 640, y, { width: 65, align: "center" });
    doc.text("Val Vanzare", 705, y, { width: 60, align: "center" });
    doc.text("Total Tva", 770, y, { width: 60, align: "center" });
  
    // doc.moveDown();
  
    doc.lineWidth(0.2);
    doc.moveTo(5, 237).lineTo(825, 237).stroke();
  
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
      doc.text(produs.name, 10, y + i * 18 + 18, { width: 110 });
      doc.text(produs.um, 115, y + i * 18 + 18, { width: 40, align: "center" });
      doc.text(produs.qty.toString(), 160, y + i * 18 + 18, {
        width: 40,
        align: "center",
      });
      doc.text(produs.dep, 225, y + i * 18 + 18, {
        width: 70,
        align: "center",
      });
      doc.text(cap(produs.gestiune), 300, y + i * 18 + 18, {
        width: 70,
        align: "center",
      });
      doc.text(produs.price, 375, y + i * 18 + 18, {
        width: 50,
        align: "center",
      });
      doc.text(produs.value, 435, y + i * 18 + 18, {
        width: 50,
        align: "center",
      });
      doc.text(produs.tva, 495, y + i * 18 + 18, {
        width: 30,
        align: "center",
      });
      doc.text(produs.tvaValue, 530, y + i * 18 + 18, {
        width: 50,
        align: "center",
      });
      doc.text(produs.total, 585, y + i * 18 + 18, {
        width: 50,
        align: "center",
      });
      doc.text(
        `${produs.sellPrice? produs.sellPrice : 0}`,
        640,
        y + i * 18 + 18,
        { width: 60, align: "center" }
      );
      doc.text(
        `${produs.sellPrice ? produs.sellPrice * produs.qty : 0}`,
        705,
        y + i * 18 + 18,
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
        y + i * 18 + 18,
        { width: 60, align: "center" }
      );
      valTotal += parseFloat(produs.total)
      valoareIntTotal += parseFloat(produs.value);
      valTvaTotal += parseFloat(produs.tvaValue);
      valVanzare +=
        parseFloat(produs.sellPrice) * parseFloat(produs.qty);
      valTvaVanzare += round(
        parseFloat(produs.sellPrice) *
        parseFloat(produs.qty) *
        (parseFloat(produs.tva) / 100)
      );
    });
    const height = nir.ingredients.length * 18;
    doc.lineWidth(0.4);
    doc
      .moveTo(10, y + height + 18)
      .lineTo(830, y + height + 18)
      .stroke();
    doc.font("public/font/RobotoSlab-Bold.ttf");
    doc.fontSize(12);
    doc.text("Total:", 370, y + height + 26);
    doc.text(`${valoareIntTotal}`, 430, y + height + 26, {
      width: 50,
      align: "center",
    });
    doc.text(`${round(valTvaTotal)}`, 530, y + height + 26, {
      width: 50,
      align: "center",
    });
    if (firma.VAT) {
      doc.text(`${valTvaTotal + valoareIntTotal}`, 585, y + height + 26, {
        width: 50,
        align: "center",
      });
    } else if (!firma.VAT) {
      doc.text(`${valTotal}`, 585, y + height + 26, {
        width: 50,
        align: "center",
      });
    }
    doc.text(`${valVanzare}`, 705, y + height + 26, {
      width: 60,
      align: "center",
    });
    doc.text(`${valTvaVanzare}`, 770, y + height + 26, {
      width: 60,
      align: "center",
    });
  
    doc.lineWidth(0.6);
    doc
      .moveTo(365, y + height + 42)
      .lineTo(830, y + height + 42)
      .stroke();
  
    // doc.font("Helvetica-Bold");
    doc.fontSize(14);
    doc.text("Responsabil", 80, y + height + 100);
    doc.text(`Data`, 400, y + height + 100);
    doc.text("Semnatura", 680, y + height + 100);
    doc.font("public/font/RobotoSlab-Regular.ttf");
    doc.fontSize(12);
    // doc.text(`${cap(userLogat.nume)}`, 80, y + height + 120);
    doc.text(`${date}`, 400, y + height + 120);
  
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
        const pdfUrl = `data:application/pdf;base64,${buffer.toString("base64")}`;
        res.send(
          `<iframe src="${pdfUrl}" style="width:100%;height:100%;" frameborder="0"></iframe>`
        );
      });
    });
  };

 function round(num){
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  function cap(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }
