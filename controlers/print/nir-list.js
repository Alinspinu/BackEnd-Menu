const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createNirsListXcelBuffer(nirs, start, end, locatie){

      const workbook = new ExcelJS.Workbook();
      let name = locatie
      const worksheet = workbook.addWorksheet('Lista documente');
      const docTitle =  [
          `${name}`,'',`Lista documente primite in perioada ${formatedDateToShow(start).split('ora')[0]} ---  ${formatedDateToShow(end).split('ora')[0]}`]
      const head = worksheet.addRow(docTitle)
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

      head.eachCell((cell) => {
        cell.font = {
        size: 12,
        bold: true,
        };
    });


      worksheet.getColumn(1).width = 4;
      worksheet.getColumn(2).width = 35; 
      worksheet.getColumn(3).width = 15; 
      worksheet.getColumn(4).width = 25; 
      worksheet.getColumn(5).width = 20; 

      worksheet.mergeCells('A1:B1')
      worksheet.mergeCells('C1:E1')
      worksheet.mergeCells('A2:E3')

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
}



module.exports = {createNirsListXcelBuffer}