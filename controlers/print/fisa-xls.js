const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow} = require('../../utils/functions')


async function createExcelBufferFisa(data){
const loc = await Locatie.find(data.locatie)
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
      `${loc.bussinessName}`,'',`'Fisa partener ' + ${suplier ? 'furnizor ' : 'client '} + ${name}`,'','']
  worksheet.addRow(docTitle)
  worksheet.addRow([])
  worksheet.addRow([])
  worksheet.addRow(['Nr',`Data`,'Tip','Document', `Serie/Numar`, 'Descriere', 'Credie', 'Debit', 'Sold'])

  data.records.forEach((e, i) => {
    let int = e.typeOf === 'intrare' ? e.document.amount : 0
    let out = e.typeOf === 'intrare' ? 0 : e.document.amount
    worksheet.addRow([`${i+1}`,`${formatedDateToShow(e.date).split('ora')[0]}`,`${e.typeOf}`,`${e.document.typeOf}`, `${e.document.docId}`, `${e.description}`, `${int}`, `${out}`, `${e.sold}`])
  })




  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferFisa}