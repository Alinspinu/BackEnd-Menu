const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createSheetListXcelBuffer(sheet){
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Fisa de  ${sheet.consumption ? 'consum' : 'deprecieri'}`);
  const docTitle =  [
      `${sheet.salePoint.locatie.bussinessName}`,'',`Fisa de  ${sheet.consumption ? 'consum' : 'deprecieri'}`]
  worksheet.addRow(docTitle)
  worksheet.addRow([`${sheet.salePoint.name}`], '')
  worksheet.addRow([])
  worksheet.addRow([])
  const subTitle = [`Responsabil`, '', `${sheet.user.name}`]
  worksheet.addRow(subTitle)
  const date = ['Data','', formatedDateToShow(sheet.date).split('ora')[0]]
  worksheet.addRow(date)
  worksheet.addRow([])
  worksheet.addRow([])
  worksheet.addRow(['Nr',`Ingredient`, 'Gestiune', 'UM', 'Pret (f Tva)', 'Cantitate', 'Total (f Tva)'])
    let total = 0
  sheet.ings.forEach((e, i) => {
    total += (e.ing.price * e.qty)
    worksheet.addRow([`${i+1}`,`${e.ing.name}`, `${e.gestiune.name}`, `${e.ing.um}`, e.ing.price, e.qty, round(e.ing.price * e.qty), ])
  })
  const space =   worksheet.addRow([])
  const footer =  worksheet.addRow(['Total',``,'','', ``, ``, round(total),])

  footer.eachCell((cell) => {
        cell.font = {
            bold: true,
            size: 13
        }
  })

  worksheet.getRow(5).eachCell((cell)=>{
    cell.font = {
        bold: true,
        size: 13
    }
})
  worksheet.getRow(1).eachCell((cell)=>{
    cell.font = {
        bold: true,
        size: 15
    }
})

  const fn = footer.number
  const sn = space.number



  worksheet.mergeCells(1, 1, 1, 2); // Columns A–D
  worksheet.mergeCells(1, 3, 1, 9); // Columns E–F
  worksheet.mergeCells(fn, 1, fn, 6); 
  worksheet.mergeCells(sn, 1, sn, 9); 

  worksheet.mergeCells('A3:I4');
  worksheet.mergeCells('A5:B5');
  worksheet.mergeCells('A6:B6');
  worksheet.mergeCells('A7:I8');

  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = 20; 
  worksheet.getColumn(3).width = 12; 
  worksheet.getColumn(4).width = 8; 
  worksheet.getColumn(5).width = 12; 
  worksheet.getColumn(6).width = 12; 
  worksheet.getColumn(7).width = 12; 






  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createSheetListXcelBuffer}