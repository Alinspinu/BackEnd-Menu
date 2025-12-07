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
  
  const header = ["Date", ...intervals.map(i => `${i.start} - ${i.end}`)];
  worksheet.addRow(header)
  const grouped = groupByDateAndHourSum(orders, intervals);

  // ROWS
  Object.keys(grouped).forEach(day => {
    const row = [];

    // Format date dd.MM.yyyy
    const [y, m, d] = day.split("-");
    const formatted = `${d}.${m}.${y}`;

    row.push(formatted);

    intervals.forEach((_, index) => {
      row.push(grouped[day][index]); // summed value
    });

    worksheet.addRow(row);
  });





  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}


function groupByDateAndHourSum(data, intervals) {
    const result = {};

  
    data.forEach(item => {
      const d = new Date(item.createdAt);
  
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