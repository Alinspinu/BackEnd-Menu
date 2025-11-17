const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createNirsListXcelBuffer(nirs, start, end, locatie){

      const workbook = new ExcelJS.Workbook();
      let name = locatie
      const worksheet = workbook.addWorksheet('Lista documente');
      const docTitle =  [
          `${name}`,'',`Lista documente primite in perioada ${formatedDateToShow(start).split('ora')[0]} ---  ${formatedDateToShow(end).split('ora')[0]}`]
      worksheet.addRow(docTitle)
      worksheet.addRow([])
      worksheet.addRow([])
      worksheet.addRow(['Nr','Furnizor',`Data Document`, `Numar Document`, 'Valoare'])

      nirs.forEach((n, i) => {
        const row = [
            i+1,
            `${n.suplier.name}`,
            new Date(n.documentDate),
            `${n.nrDoc}`,
            n.totalDoc
        ]
        worksheet.addRow(row)
      })

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
}



module.exports = {createNirsListXcelBuffer}