const ExcelJS = require("exceljs");


 async function exportOrdersToExcel(groupedData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Monthly Sales');

  // Header
  sheet.columns = [
    { header: 'Date', key: 'day', width: 15 },
    { header: 'Hour', key: 'hour', width: 10 },
    { header: 'Total Sales', key: 'total', width: 15 }
  ];

  // Styling header
  sheet.getRow(1).font = { bold: true };

  // Fill rows
  groupedData.forEach(dayEntry => {
    dayEntry.hours.forEach(hourEntry => {
      sheet.addRow({
        day: dayEntry.day,
        hour: `${hourEntry.hour}:00`,
        total: hourEntry.total
      });
    });
    sheet.addRow({});

  });

  // Optional formatting
  sheet.eachRow(row => {
    row.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;

}


module.exports = {exportOrdersToExcel}