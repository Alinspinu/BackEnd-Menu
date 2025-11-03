const PDFDocument = require("pdfkit");

const {round, formatedDateToShow} = require('../../utils/functions')




function createSalaryReport(pontaj, mode, us){

    const firstDay = new Date(pontaj.days[0].date);
    const lastDay = new Date(pontaj.days[pontaj.days.length - 1].date);
    
    const month = firstDay.getMonth();
    const year = firstDay.getFullYear();
    
    let startDate = new Date(firstDay);
    let endDate = new Date(lastDay);
    
    switch (mode) {
      case '01-15':
        startDate = new Date(firstDay);
        endDate = new Date(firstDay);
        endDate.setDate(firstDay.getDate() + 14); // adds 14 calendar days
        break;
    
      case '15-30/31':
        startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() + 14);
        endDate = new Date(lastDay);
        break;
    
      case '01-30/31':
        startDate = new Date(firstDay);
        endDate = new Date(lastDay);
        break;
    }
    
    const start = startDate.getDate();
    const end = endDate.getDate();

    let users = []

    let totalIncome = 0
    let totalTax = 0

    for(let d of pontaj.days){

        const day = new Date(d.date).getDate()
        if(day >= start && day <= end ){            
            for(let u of d.users){
                let tax = u.tax
                let income = u.value
                if(!u.employee.employee.salary.fix){  
                    totalIncome += income
                    totalTax += tax
                    const existingUser = users.find(us => us.name === u.employee.employee.fullName)
                    if(existingUser){
                        existingUser.tax += tax
                        existingUser.income += income
                    } else {
                        const us = {
                            name: u.employee.employee.fullName,
                            position: u.employeePosition.name,
                            tax: tax,
                            income: income
                        }
                        users.push(us)
                    }
                }
            }
        for(let u of us){
            const income = round(u.employee.salary.inHeand / pontaj.days.length)
            const tax = round(u.employee.salary.onPaper.tax / pontaj.days.length)
            const existingUser = users.find(us => us.name === u.employee.fullName)
            if(existingUser){
                existingUser.tax += tax
                existingUser.income += income
            } else {
                const us = {
                    name: u.employee.fullName,
                    position: u.employee.employeePosition.name,
                    tax: round(u.employee.salary.onPaper.tax / pontaj.days.length),
                    income: round(u.employee.salary.inHeand / pontaj.days.length)
                }
                users.push(us)
            }
        }

        }
    
    }


    let doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
      });

      const pageWidth = doc.page.width;

      let lineHeigth = 12
      let y = 100

      doc.font("public/font/RobotoSlab-Regular.ttf")
      doc
        .fontSize(12)
        .text(
          ` Raport salarii ${formatedDateToShow(startDate).split('ora')[0]} - ${formatedDateToShow(endDate).split('ora')[0]} `,
          (pageWidth / 2) - 150,
          50,
          {
            // width: 150,
            underline: true
          }
        );
        doc.moveDown();
    
        users.forEach((u, i) => {
            doc
            .fontSize(10)
            .text(`${u.name}`, 50, y + i * lineHeigth + lineHeigth);
            doc.text(`${u.position}`, 180, y + i * lineHeigth + lineHeigth);
            doc.text(`${ round(u.tax)}`, 280, y + i * lineHeigth + lineHeigth);
            doc.text(`${ round(u.income)}`, 360, y + i * lineHeigth + lineHeigth);
        })

  
 




      return doc
}


module.exports = {createSalaryReport}