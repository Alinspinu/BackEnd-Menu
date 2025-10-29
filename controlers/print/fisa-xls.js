const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createExcelBufferFisa(data, suplier){
const loc = await Locatie.findById(data.locatie)
  const workbook = new ExcelJS.Workbook();
  let name = data.name
  const worksheet = workbook.addWorksheet('Fisa partener');
  const docTitle =  [
      `${loc.bussinessName}`,'',`Fisa partener  ${suplier ? 'furnizor ' : 'client '}${name}`,'','']
  worksheet.addRow(docTitle)
  worksheet.addRow([])
  worksheet.addRow([])
  worksheet.addRow(['Nr',`Data`,'Tip','Document', `Numar`, 'Credit', 'Debit', 'Sold', 'Descriere'])
    let totalIn = 0
    let totalOut = 0
  data.records.forEach((e, i) => {
    let int = 0
    let out = 0
    if(e.typeOf === 'intrare'){
        int = e.document.amount
        totalIn += int
    } else {
        out = e.document.amount
        totalOut += out
    }

    worksheet.addRow([`${i+1}`,`${formatedDateToShow(e.date).split('ora')[0]}`,`${e.typeOf}`,`${e.document.typeOf}`, `${e.document.docId}`, `${round(int)}`, `${ round(out)}`, `${ suplier ? e.sold : -e.sold}`, `${e.description || ''}`])
  })

  const footer =  worksheet.addRow(['Totaluri',``,'','', ``, `${totalIn}`, `${totalOut}`, `${suplier ? data.sold : -data.sold}`,''])

  footer.eachCell((cell) => {
        cell.font = {
            bold: true,
            size: 13
        }
  })

  worksheet.getRow(4).eachCell((cell)=>{
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



  worksheet.mergeCells(1, 1, 1, 2); // Columns A–D
  worksheet.mergeCells(1, 3, 1, 9); // Columns E–F
  worksheet.mergeCells(fn, 1, fn, 5); 

  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = 18; 
  worksheet.getColumn(3).width = 10; 
  worksheet.getColumn(4).width = 12; 
  worksheet.getColumn(5).width = 12; 
  worksheet.getColumn(6).width = 13; 
  worksheet.getColumn(7).width = 13; 
  worksheet.getColumn(8).width = 13; 
  worksheet.getColumn(9).width = 22; 





  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferFisa}