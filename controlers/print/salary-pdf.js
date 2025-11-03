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
        layout: "landscape",
      });

      const pageWidth = doc.page.width;

      let lineHeigth = 14
      let y = 150

      doc.font("public/font/RobotoSlab-Regular.ttf")
      doc
        .fontSize(13)
        .text(
          ` Raport salarii ${formatedDateToShow(startDate).split('ora')[0]} - ${formatedDateToShow(endDate).split('ora')[0]} `,
          (pageWidth / 2) - 150,
          50,
          {underline: true}
        );
        doc.moveDown();

        doc.fontSize(13)
        doc.text('Nume angajat', 50, 120, {width: 130, underline: true})
        doc.text('Functie', 180, 120, {width: 200, underline: true} )
        doc.text('Ore lucrate', 380, 120, {width: 130, underline: true})
        doc.text('Venit NET', 410, 120, {width: 90, underline: true})
        doc.text('Taxe', 500, 120,{underline: true})
    
        users.forEach((u, i) => {
            doc.fontSize(11)
            doc.text(`${i+1}`, 40, y + i * lineHeigth + lineHeigth, {width: 10, underline: true})    
            doc.text(`${u.name}`, 50, y + i * lineHeigth + lineHeigth, {width: 130, underline: true});
            doc.text(`${u.position}`, 180, y + i * lineHeigth + lineHeigth, {width: 200, underline: true});
            doc.text(`${u.hours}`, 380, y + i * lineHeigth + lineHeigth, {width: 130, underline: true});
            doc.text(`${ round(u.income)}`, 410, y + i * lineHeigth + lineHeigth, {width: 90, underline: true});
            doc.text(`${ round(u.tax)}`, 500, y + i * lineHeigth + lineHeigth, {underline: true});
        })

  
 




      return doc
}


module.exports = {createSalaryReport}