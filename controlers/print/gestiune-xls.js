// utils/exportExcel.js
const ExcelJS = require("exceljs");
const {formatedDateToShow}  = require('../../utils/functions')

async function createExcelBuffer(data, locatie) {

const period = `${formatedDateToShow(data[0].date).split('ora')[0]} - ${formatedDateToShow(data[data.length - 1].date).split('ora')[0]}`

  const workbook = new ExcelJS.Workbook();

     
        const worksheet = workbook.addWorksheet('Raport de gestiune');
        const docTitle =  [
            `${locatie}`,'',`Raport de gestiune ${period}`,'','']
        const head = ['',``,'','', `TVA 11%`, '', 'TVA 21%','']
        const header = ['Nr',`Data`,'Descriere','Intrare', `Iesire`, 'Intrare', 'Iesire']
        worksheet.addRow(docTitle)
        worksheet.addRow([])
        worksheet.addRow([])
        worksheet.addRow(head)
        worksheet.addRow(header)

        data.forEach((el, i) => {
          const head =  worksheet.addRow([`${i+1}`,`${el.date.split('T')[0]}`,`Sold initial`,`${el.in11}`,`${0}`,`${el.in21}`, `${0}` ])
            head.eachCell((cell) => {
                cell.font = {
                size: 13,
                bold: true,
                };
            });
            el.entries.forEach((el, i) => {
               let in11 = 0
               let out11 = 0
               let in21 = 0
               let out21 = 0
               if(el.tva === 11){
                    if(el.type === 'intrare'){
                        in11 = el.value
                    } else {
                        out11 = el.value
                    }
                }
                if(el.tva === 21){
                    if(el.type === 'intrare'){
                        in21 = el.value
                    } else {
                        out21 = el.value
                    }
                }
               const e = worksheet.addRow([`${i+1}`,`${el.date.split('T')[0]}`,`${el.description}`,`${in11}`,`${out11}`, `${in21}`, `${out21}`])
            //    const sum = e.getCell(5)
            //    sum.font =  { color:  {argb: el.tip === 'income' ?  'FF00B050' : 'FF0000'} }
            });
         
           const foot =  worksheet.addRow(['',`${el.date.split('T')[0]}`,`Sold final`,`${0}`,`${el.out11}`, `${0}`, `${el.out21}`])

            foot.eachCell((cell) => {
                cell.font = {
                size: 13,
                bold: true,
                };
            });
            worksheet.addRow([])
        
        })
   
        worksheet.getRow(1).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 13
            }
        })
        worksheet.getRow(4).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 14
            }
        })
        worksheet.getColumn(1).width = 7;
        worksheet.getColumn(2).width = 12; 
        worksheet.getColumn(3).width = 60; 
        worksheet.getColumn(4).width = 10; 
        worksheet.getColumn(5).width = 10; 
        worksheet.mergeCells('A1:B2')
        worksheet.mergeCells('C1:E2')


  // ✨ Return the Excel file as a Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { createExcelBuffer };
