const {round, formatDateDMY} = require('../../utils/functions');



function createSupliersSolds(supliers, doc){


    let height = 30

    doc.image('public/icons/logo_true.png', 180, height, {width: 80})

    height += 60

    let total = 0

    doc.fontSize(14)
    doc.font('public/font/Montserrat-Bold.ttf')
    doc.text(`Restante furnizori la data de ${formatDateDMY(new Date())}`, 100, height)

    height += 30

    doc.fontSize(12)
    doc.font("public/font/Montserrat-Regular.ttf");
   supliers.forEach((s, i) => {
    if(s.sold !== 0){
        doc.text(`${i+1}.`, 10, height)
        doc.text(`${s.name}`, 25, height)
        doc.text(`${s.sold} Lei`, 250, height)
        doc.lineWidth(0.6);
        doc.moveTo(10, height+15).lineTo(340, height+15).stroke();

        height+=17
        total += s.sold
    }
   })

   doc.fontSize(14)
   doc.font('public/font/Montserrat-Bold.ttf')
   doc.text('TOTAL', 25, height)
   doc.text(`${round(total)} Lei`, 250, height)


return doc
}



module.exports = {createSupliersSolds}




