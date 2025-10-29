const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow} = require('../../utils/functions')


async function createExcelBufferFisa(data){
const loc = await Locatie.findById(data.locatie)
  const workbook = new ExcelJS.Workbook();
  let name = ''
  let suplier = false
    if(data.bussinessName){
        name = data.bussinessName
        suplier = true
    } else {
        name = data.name
        suplier = false
    }

  const worksheet = workbook.addWorksheet('Fisa partener');
  const docTitle =  [
      `${loc.bussinessName}`,'',`Fisa partener  ${suplier ? 'furnizor ' : 'client '}${name}`,'','']
  worksheet.addRow(docTitle)
  worksheet.addRow([])
  worksheet.addRow([])
  worksheet.addRow(['Nr',`Data`,'Tip','Document', `Serie/Numar`, 'Descriere', 'Credit', 'Debit', 'Sold'])
    let totalIn = 0
    let totalOut = 0
  data.records.forEach((e, i) => {
    let int = 0
    let out = 0
    if(e.typeOf === 'intrare'){
        int = e.document.amount
        totalIn += int
    } else {
        out = e.document.out
        totalOut += out
    }

    worksheet.addRow([`${i+1}`,`${formatedDateToShow(e.date).split('ora')[0]}`,`${e.typeOf}`,`${e.document.typeOf}`, `${e.document.docId}`, `${e.description || ''}`, `${int}`, `${out}`, `${e.sold}`])
  })

  const footer =  worksheet.addRow(['Totaluri',``,'','', ``, '', `${totalIn}`, `${totalOut}`, `${data.sold}`])

  const fn = footer.number

  worksheet.mergeCells(1, 1, 1, 2); // Columns A–D
  worksheet.mergeCells(1, 3, 1, 6); // Columns E–F
  worksheet.mergeCells(fn, 1, fn, 6); 





  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferFisa}