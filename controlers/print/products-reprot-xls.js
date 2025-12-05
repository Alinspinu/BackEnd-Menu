const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createProductsReportXcelBuffer(products, salePoint, date){
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Raport produse vandute`);
  const docTitle =  [
      `${salePoint.locatie.bussinessName}`,'',`Raport produse vandute din ${date} `]
  worksheet.addRow(docTitle)
  worksheet.addRow([`${salePoint.name}`], '')


  products.forEach((p, i) => {
    worksheet.addRow(
        [
            i+1,
            `${p.name}`,
            p.tva,
            p.quantity,
            p.price,
            p.price * p.quantity,
            p.discount

        ]
    )
  })

    // for(let p of products){
 
    // }



  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = 20; 
  worksheet.getColumn(3).width = 8; 
  worksheet.getColumn(4).width = 12; 
  worksheet.getColumn(5).width = 8; 
  worksheet.getColumn(6).width = 12; 
  worksheet.getColumn(7).width = 12; 
  worksheet.getColumn(8).width = 12; 






  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createProductsReportXcelBuffer}