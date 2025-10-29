// utils/exportExcel.js
const ExcelJS = require("exceljs");
const {formatedDateToShow, formatDateDMY}  = require('../../utils/functions')

async function createExcelBuffer(data, locatie) {


    const days = data.days
    const totals = data.totals

const period = `${formatedDateToShow(days[0].date).split('ora')[0]} - ${formatedDateToShow(days[days.length - 1].date).split('ora')[0]}`

  const workbook = new ExcelJS.Workbook();

     
        const worksheet = workbook.addWorksheet('Raport de gestiune');
        const docTitle =  [
            `${locatie}`,'',`Raport de gestiune ${period}`,'','']
        worksheet.addRow(docTitle)
        worksheet.addRow([])
        worksheet.addRow([])

        days.forEach((el, i) => {

            const d = formatDateDMY(el.date)

            const headVat =  worksheet.addRow(['',``,'', `TVA 11%`, '', 'TVA 21%','', 'TVA 0%',''])
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
            worksheet.mergeCells(rowNumber, 8, rowNumber, 9); 

            worksheet.addRow(['Nr',`Data`,'Descriere','Intrare', `Iesire`, 'Intrare', 'Iesire', 'Intrare', 'Iesire'])


          const head =  worksheet.addRow([`${i+1}`,`${d}`,`Sold initial`,`${el.in11}`,`${0}`,`${el.in21}`, `${0}`, `${el.in0}`, `${0}` ])
            head.eachCell((cell) => {
                cell.font = {
                size: 13,
                bold: true,
                };
            });
            el.entries.forEach((el, i) => {
               let in0 = 0
               let out0 = 0
               let in11 = 0
               let out11 = 0
               let in21 = 0
               let out21 = 0
               let text = ''
               if(el.tva === 11){
                    if(el.type === 'intrare'){
                        in11 = el.value
                        text = ' (intrare 11%)'
                    } else {
                        out11 = el.value
                        text = ' (iesire 11%)'
                    }
                }
                if(el.tva === 21){
                    if(el.type === 'intrare'){
                        in21 = el.value
                        text = ' (intrare 21%)'
                    } else {
                        out21 = el.value
                        text = ' (iesire 21%)'
                    }
                }
                if(el.tva === 0){
                    if(el.type === 'intrare'){
                        in0 = el.value
                        text = ' (intrare 0%)'
                    } else {
                        out0 = el.value
                        text = ' (iesire 0%)'
                    }
                }
               const e = worksheet.addRow([`${i+1}`,`${d}`,`${el.description + text}`,`${in11}`,`${out11}`, `${in21}`, `${out21}`, `${in0}`, `${out0}`])
            });
         
           const foot =  worksheet.addRow(['',`${d}`,`Sold final`,`${0}`,`${el.out11}`, `${0}`, `${el.out21}`, `${0}`, `${el.out0}`])

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


        const to =  worksheet.addRow(['', 'Totaluri', '', `${totals.tottalIn11}`, `${totals.totalOut11}`, `${totals.totalIn21}`, `${totals.totalOut21}`, `${totals.totalIn0}`, `${totals.totalOut0}` ])

        const tnum = to.number

        worksheet.mergeCells(tnum, 2, tnum, 3)

        const emptRow =  worksheet.addRow([])
        const num = emptRow.number
        worksheet.mergeCells(num, 1, num, 7);

        const bc = worksheet.addRow(['', 'Bacsis', '', '', '', '', '', '', `${totals.totalOutBacsis}`])
        const sg  = worksheet.addRow(['', 'TAXA SGR', '', '', '', '', '', '', `${totals.totalOutSGR}`])

        const bnum = bc.number
        const snum = sc.number
        worksheet.mergeCells(bnum, 2, bnum, 3);
        worksheet.mergeCells(bnum, 4, bnum, 8);
        worksheet.mergeCells(snum, 2, snum, 3);
        worksheet.mergeCells(snum, 4, snum, 8);


   
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
        worksheet.getColumn(2).width = 14; 
        worksheet.getColumn(3).width = 35; 
        worksheet.getColumn(4).width = 10; 
        worksheet.getColumn(5).width = 10; 
        worksheet.mergeCells('A1:B2')
        worksheet.mergeCells('C1:G2')


  // ✨ Return the Excel file as a Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { createExcelBuffer };
