const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')





async function createExcelBufferUsersSheet(shedules, start, end){

const days = []
const users = []
shedules.forEach(s => {
    s.days.forEach(d => {
        const dt = new Date(d.date).setUTCHours(0,0,0,0)
        if(dt <= end && dt >=start){
            days.push(d)
        }
        d.users.forEach(u => {
            if(u.employee && u.employee.employee){
                const us = users.find(uu => uu.employee.employee.fullName === u.employee.employee.fullName)
                if(!us){
                    users.push(u)
                }
            } else {
                console.log(u)
            }
        })
    })
})

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Condica de  prezenta');



  // ----- 1️⃣ BUILD MULTI-ROW HEADERS -----
  const headerRow1 = [`${days[0].date.toISOString().split('T')[0]} - ` + `${days[days.length - 1].date.toISOString().split('T')[0]}`];
  const headerRow2 = ['Nume angajat'];

  days.forEach((d) => {
    const formatted = d.date.toISOString().split('T')[0] + ' ' + d.day; 
    headerRow1.push(formatted, '', '');
    headerRow2.push('Intrare', 'Iesire', 'Ore');
  });

  headerRow1.push('Total', 'Semnatura');
  headerRow2.push('', '');


  sheet.addRow(headerRow1);
  sheet.addRow(headerRow2);




  // ----- 2️⃣ MERGE DATE CELLS (Row 1) -----
  let colIndex = 2; // Start from 2 (because 1 = User)
  days.forEach(() => {
    sheet.mergeCells(1, colIndex, 1, colIndex + 2); // merge 3 columns
    colIndex += 3;
  });

  sheet.mergeCells(1, colIndex, 2, colIndex); // total hours
  sheet.mergeCells(1, colIndex + 1, 2, colIndex + 1); // signature

  // Style headers
  sheet.getRow(1).font = { bold: true, size: 11 };
  sheet.getRow(2).font = { bold: true, size: 10 };
  sheet.getRow(1).alignment = { horizontal: 'center' };
  sheet.getRow(2).alignment = { horizontal: 'center' };

  // ----- 3️⃣ ADD USER ROWS -----
  users.forEach((u) => {
    const rowData = [u.employee.employee.fullName];
    let totalHours = 0;
    days.forEach((d) => {
      const dayUser = d.users.find(
        (du) => du.employee._id.toString() === u.employee._id.toString()
      );

      if (dayUser) {
        const wp = dayUser.workPeriod;
        const startDate = new Date(wp.start);
        const endDate = new Date(wp.end);
        const st = startDate.toLocaleTimeString('ro-RO', {
            timeZone: 'Europe/Bucharest',
            hour: '2-digit',
            minute: '2-digit',
          });
          
          const en = endDate.toLocaleTimeString('ro-RO', {
            timeZone: 'Europe/Bucharest',
            hour: '2-digit',
            minute: '2-digit',
          });
        rowData.push(st || '', en || '', wp.hours?.toString() || '');
        totalHours += wp.hours || 0;
      } else {
        rowData.push('-', '-', '0');
      }
    });
    rowData.push(totalHours, '');
    sheet.addRow(rowData);
  });

  // ----- 4️⃣ FORMAT COLUMNS -----
  sheet.columns.forEach((col) => {
    col.width = 5.5;
    col.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Make first column wider
  sheet.getColumn(1).width = 20;
  sheet.getColumn(1).alignment = {vertical: 'start'};
  sheet.getColumn(days.length * 3 + 3).width = 15; // Signature (wider)

  sheet.getColumn(1).eachRow({ includeEmpty: true }, (row) => {
    const cell = row.getCell(1);
    cell.border = {
      ...cell.border, // keep existing borders (if any)
      right: { style: 'medium' }, // thicker line
    };
  });

  days.forEach((_, i) => {
    const rightColIndex = 1 + (i + 1) * 3; // every 3 columns after 'User'
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const cell = row.getCell(rightColIndex);
      cell.border = {
        ...cell.border, // keep existing borders (if any)
        right: { style: 'medium' }, // thicker line
      };
    });
  });




  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferUsersSheet}