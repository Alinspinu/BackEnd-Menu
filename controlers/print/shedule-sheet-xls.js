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

const sheet = workbook.addWorksheet('Schedule');

// 1️⃣ HEADER ROW
const header = ['User'];
days.forEach(d => {
  const formatted = d.date.toISOString().split('T')[0]; // e.g. 2025-10-25
  header.push(formatted);
});
sheet.addRow(header);

// 2️⃣ ROWS FOR EACH USER
users.forEach(u => {
  const row = [u.name];

  // loop through each day (column)
  days.forEach(d => {
    const dayUser = d.users.find(
      du => du.employee._id.toString() === u._id.toString()
    );

    if (dayUser) {
      // fill with hours, position, etc.
      row.push(`${dayUser.workPeriod.hours} hrs`);
    } else {
      row.push('—'); // dash or blank if user not found that day
    }
  });

  sheet.addRow(row);
});

// 3️⃣ STYLING (optional)
sheet.getRow(1).font = { bold: true };
sheet.columns.forEach(col => {
  col.width = 15;
  col.alignment = { horizontal: 'center', vertical: 'middle' };
});



// Add rows from your data array






  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferUsersSheet}