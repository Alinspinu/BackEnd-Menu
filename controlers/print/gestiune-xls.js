// utils/exportExcel.js
const ExcelJS = require("exceljs");
const {formatedDateToShow}  = require('../../utils/functions')

async function createExcelBuffer(data, locatie) {

const period = `${formatedDateToShow(data[0].date).split('ora')[0]} - ${formatedDateToShow(data[data.length - 1].date).split('ora')[0]}`

  const workbook = new ExcelJS.Workbook();

     
        const worksheet = workbook.addWorksheet('Raport de gestiune');
        const docTitle =  [
            `${locatie}`,'',`Raport de gestiune ${period}`,'','']
        worksheet.addRow(docTitle)
        worksheet.addRow([])
        worksheet.addRow([])

        data.forEach((el, i) => {

            const d = formatedDateToShow(el.date).split('ora')[0]

            const headVat =  worksheet.addRow(['',``,'', `TVA 11%`, '', 'TVA 21%',''])
            headVat.eachCell((cell) => {
                cell.font = {
                bold: true,
                },
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            const rowNumber = headVat.number;
            worksheet.mergeCells(rowNumber, 1, rowNumber, 3); // Columns A–D
            worksheet.mergeCells(rowNumber, 4, rowNumber, 5); // Columns E–F
            worksheet.mergeCells(rowNumber, 6, rowNumber, 7); 

            worksheet.addRow(['Nr',`Data`,'Descriere','Intrare', `Iesire`, 'Intrare', 'Iesire'])


          const head =  worksheet.addRow([`${i+1}`,`${d}`,`Sold initial`,`${el.in11}`,`${0}`,`${el.in21}`, `${0}` ])
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
               const e = worksheet.addRow([`${i+1}`,`${d}`,`${el.description}`,`${in11}`,`${out11}`, `${in21}`, `${out21}`])
            });
         
           const foot =  worksheet.addRow(['',`${d}`,`Sold final`,`${0}`,`${el.out11}`, `${0}`, `${el.out21}`])

            foot.eachCell((cell) => {
                cell.font = {
                size: 13,
                bold: true,
                };
            });
           const emptyRow =  worksheet.addRow([])
           const num = emptyRow.number
           worksheet.mergeCells(num, 1, num, 7);
        
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
        worksheet.getColumn(1).width = 4;
        worksheet.getColumn(2).width = 16; 
        worksheet.getColumn(3).width = 30; 
        worksheet.getColumn(4).width = 10; 
        worksheet.getColumn(5).width = 10; 
        worksheet.mergeCells('A1:B2')
        worksheet.mergeCells('C1:G2')


  // ✨ Return the Excel file as a Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { createExcelBuffer };
