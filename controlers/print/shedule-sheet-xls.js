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

console.log('zile', days.length)
console.log('utilizatori', users.length)

const workbook = new ExcelJS.Workbook();


const sheet = workbook.addWorksheet('People');

// Get all unique keys from the objects
sheet.columns = Array.from({ length: days.length }, (_, i) => ({
    header: `Column ${i + 1}`,  // or you can leave it empty ''
    key: `col${i + 1}`,
    width: 15
  }));



// Add rows from your data array






  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



module.exports = {createExcelBufferUsersSheet}