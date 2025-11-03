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
                        existingUser.hours += u.hours
                    } else {
                        const us = {
                            name: u.employee.employee.fullName,
                            position: u.employeePosition.name,
                            hours: u.hours,
                            tax: tax,
                            income: income
                        }
                        users.push(us)
                    }
                }
            }

        }
    
    }

    let full = mode === '01-30/31' ? true : false 
    for(let u of us){
        const income = full ? u.employee.salary.inHeand : round(u.employee.salary.inHeand / 2)
        const tax = full ? u.employee.salary.onPaper.tax : round(u.employee.salary.onPaper.tax / 2)
        totalIncome += income
        totalTax += tax
        const existingUser = users.find(us => us.name === u.employee.fullName)
        if(existingUser){
            existingUser.tax += tax
            existingUser.income += income
        } else {
            const us = {
                name: u.employee.fullName,
                position: u.employee.employeePosition.name,
                tax: tax,
                hours: full ? u.employee.salary.norm : u.employee.salary.norm / 2,
                income: income
            }
            users.push(us)
        }
    }

    users.sort((a,b) => a.position.localeCompare(b.position))
    users = users.filter(u => u.position !== '-' && u.position !== 'Administrator')


    let doc = new PDFDocument({
        size: "A4",
        layout: "portrait",
      });

      const pageWidth = doc.page.width;

      let lineHeigth = 12
      let y = 100

      doc.font("public/font/RobotoSlab-Regular.ttf")
      doc
        .fontSize(13)
        .text(
          ` Raport salarii ${formatedDateToShow(startDate).split('ora')[0]} - ${formatedDateToShow(endDate).split('ora')[0]} `,
          (pageWidth / 2) - 150,
          20,
          {underline: true}
        );
        doc.moveDown();

        const startLine = pageWidth / 2 - 255
        doc.lineWidth(0.2);
        doc.fontSize(13)
        doc.text('Nume angajat', startLine + 25, 90 )
        doc.text('Functie', startLine + 130 + 25, 90 )
        doc.text('Ore', startLine + 110 + 155, 90,)
        doc.text('Venit NET', startLine + 40 + 295, 90)
        doc.text('Taxe', startLine+ 435, 90)
        doc
        .moveTo(startLine, 110)
        .lineTo(startLine + 470, 110)
        .stroke();

        users.forEach((u, i) => {
            doc.fontSize(10)
            doc.text(`${i+1}.`, startLine, y + i * lineHeigth + lineHeigth)    
            doc.text(`${u.name}`, startLine + 25, y + i * lineHeigth + lineHeigth);
            doc.text(`${u.position}`, startLine + 130 + 25, y + i * lineHeigth + lineHeigth);
            doc.text(`${u.hours}`,startLine + 110 + 155, y + i * lineHeigth + lineHeigth);
            doc.text(`${ round(u.income)}`,startLine + 40 + 295, y + i * lineHeigth + lineHeigth);
            doc.text(`${ round(u.tax)}`, startLine+ 435, y + i * lineHeigth + lineHeigth);
            doc.lineWidth(0.1);
            doc
            .moveTo(startLine, y + i * lineHeigth + lineHeigth + lineHeigth)
            .lineTo(startLine + 470, y + i * lineHeigth + lineHeigth + lineHeigth)
            .stroke();
        })
        let height = (users.length  * lineHeigth) + y;
        doc.fontSize(13)
        doc.font("public/font/RobotoSlab-Bold.ttf");
        doc.text('TOTAL', startLine + 25, height + 15)
        doc.text(`${round(totalIncome)}`, startLine + 30 + 295, height + 15, {underline: true})
        doc.text(`${round(totalTax)}`, startLine+ 425,  height + 15)

  
 




      return doc
}


module.exports = {createSalaryReport}