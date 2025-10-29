const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')





async function createExcelBufferUsersSheet(shedules, start, end){

const days = []
const users = []
shedules.forEach(s => {
    s.days.forEach(d => {
        const dt = new Date(d.date).setUTCHours(0,0,0,0)
        if(dt >= end && dt <= start){
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

console.log('zile', days.length)
console.log('utilizatori', users.length)

const workbook = new ExcelJS.Workbook();


const sheet = workbook.addWorksheet('People');

// Get all unique keys from the objects
const columns = Object.keys(days[0]).map(key => ({
  header: key.toUpperCase(),
  key,
  width: 15
}));

console.log(columns)

sheet.columns = columns;

// Add rows from your data array
sheet.addRows(days);






  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferUsersSheet}