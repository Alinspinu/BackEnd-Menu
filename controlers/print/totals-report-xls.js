const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createTotalsReportXcelBuffer(orders, salePoint, date){
  const workbook = new ExcelJS.Workbook();

  const intervals = generateHourlyIntervals()
  const worksheet = workbook.addWorksheet(`Raport totaluri vandute`);
  const docTitle =  [
      `${salePoint.locatie.bussinessName}`,'',`Raport totaluri din ${date} `]
  worksheet.addRow(docTitle)
  worksheet.addRow([`${salePoint.name}`], '')
  worksheet.addRow([])
  
  const header = ["Date", ...intervals.map(i => `${i.start} - ${i.end}`), 'Total'];
  const h = worksheet.addRow(header)
  h.eachCell((cell) => {
    cell.font = {
        bold: true,
        size: 11
    }
  })
  const grouped = groupByDateAndHourSum(orders, intervals);


  const intervalTotals = Array(intervals.length).fill(0);
let grandTotal = 0;

  // ROWS

  Object.keys(grouped).forEach(day => {
    const row = [];
  
    // Format date dd.MM.yyyy
    const [y, m, d] = day.split("-");
    row.push(`${d}.${m}.${y}`);
  
    let totalForDay = 0;
  
    intervals.forEach((_, index) => {
      const val = grouped[day][index];
      row.push(val);
  
      totalForDay += val;             // daily total
      intervalTotals[index] += val;   // interval total
    });
  
    row.push(totalForDay);            // daily total at the end
    grandTotal += totalForDay;        // accumulate grand total
  
    worksheet.addRow(row);
  });
  
  // FINAL TOTAL ROW
  const totalRow = ["TOTAL", ...intervalTotals, grandTotal];
  const f  = worksheet.addRow(totalRow);

  f.eachCell((cell) => {
    cell.font = {
        bold: true,
        size: 13
    }
  })

  for (let i = 0; i < intervals.length + 1; i++) {
    worksheet.getColumn(i+1).width = 12; // +2 because col 1 is Date
  }

  worksheet.getColumn(1).eachCell((cell) => {
    cell.font = {
        bold: true,
        size: 11
    }
  })
  
  // Last column = Total
  worksheet.getColumn(intervals.length + 2).width = 15;
  



  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}


function groupByDateAndHourSum(data, intervals) {
    const result = {};

  
    data.forEach(item => {
      const dx = new Date(item.createdAt);
      const d = new Date(dx.getTime() + 2 * 60 * 60 * 1000);
  
      // Convert date to key (YYYY-MM-DD)
      const dayKey = d.toISOString().split("T")[0];
      const hour = d.getHours();
  
      // Initialize date row if empty
      if (!result[dayKey]) {
        result[dayKey] = {};
        intervals.forEach((_, idx) => result[dayKey][idx] = 0);
      }
  
      // Find which interval the hour belongs to
      intervals.forEach((interval, index) => {
        const [startHour] = interval.start.split(":").map(Number);
        const [endHour] = interval.end.split(":").map(Number);
  
        // Example: hour 08:30 belongs to interval 08–09
        if (hour >= startHour && hour < endHour) {
          result[dayKey][index] += +item.total;  // SUM totals
        }
      });
    });
  
    return result;
  }



function generateHourlyIntervals() {
    const intervals = [];
  
    for (let hour = 0; hour < 24; hour++) {
      const start = hour.toString().padStart(2, "0") + ":00";
      const end = ((hour + 1) % 24).toString().padStart(2, "0") + ":00";
  
      intervals.push({
        start,
        end
      });
    }
  
    return intervals;
  }




module.exports = {createTotalsReportXcelBuffer}