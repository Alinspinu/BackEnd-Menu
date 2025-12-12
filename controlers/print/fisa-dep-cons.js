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
  const subTitle = [`Responsabil`, '', `${sheet.user.employee.fullName}`]
  worksheet.addRow(subTitle)
  const date = ['Data','', formatedDateToShow(sheet.date).split('ora')[0]]
  worksheet.addRow(date)
  worksheet.addRow([])
  worksheet.addRow([])
  const head = worksheet.addRow(['Nr',`Ingredient`, 'Tip',  'Gestiune', 'UM', 'Cantitate', 'Pret (f Tva)',  'Total (f Tva)'])
    let total = 0
  sheet.ings.forEach((e, i) => {
    const type = e.ing.productIngredient ? 'Compus' : 'Simplu'
    total += (e.ing.price * e.qty)
   const r = worksheet.addRow([`${i+1}`,`${e.ing.name}`, type, `${e.gestiune.name}`, `${e.ing.um}`, e.qty, e.ing.price, round(e.ing.price * e.qty), ])
    if(e.ing.productIngredient){
        // r.eachCell((cell) => {
        //     cell.font = {
        //       color: { argb: 'FFFF9999' } 
        //     };
        //   });
        e.ing.ings.forEach((ee, i) => {
         const type = ee.ing.productIngredient ? 'Compus' : 'Simplu'
         const row =  worksheet.addRow(['',`${ee.ing.name}`, type, `${e.gestiune.name}`, `${ee.ing.um}`, round(ee.qty * e.qty), ee.ing.price, round(ee.ing.price * ee.qty *e.qty), ])
         row.eachCell((cell) => {
            cell.font = {
              color: { argb: 'FFFF9999' } // Red text
            };
          });
        })
    }
  })
  const space =   worksheet.addRow([])
  const footer =  worksheet.addRow(['Total',``,'','', ``, ``,``, round(total),])

  footer.eachCell((cell) => {
        cell.font = {
            bold: true,
            size: 13
        }
  })

  head.eachCell((cell) => {
    cell.font = {
        bold: true,
        size: 12
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
  const hn = head.number


  
  worksheet.mergeCells(fn, 1, fn, 7); 
  worksheet.mergeCells(sn, 1, sn, 8); 



  worksheet.mergeCells('A1:B1');
  worksheet.mergeCells('C1:H1');
  worksheet.mergeCells('A2:H2');
  
  worksheet.mergeCells('A3:H4');
  worksheet.mergeCells('A5:B5');
  worksheet.mergeCells('C5:H5');
  worksheet.mergeCells('A6:B6');
  worksheet.mergeCells('C6:H6');
  worksheet.mergeCells('A7:H8');

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



module.exports = {createSheetListXcelBuffer}