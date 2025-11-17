const {round} = require('../../utils/functions');



function createSupliersSolds(supliers, doc){


    let height = 30

    doc.image('public/icons/logo_true.png', 200, height, {width: 80})

    height += 60

    let total = 0

    doc.fontSize(14)
    doc.font('public/font/Montserrat-Bold.ttf')
    doc.text('Situatie furnizori', 220, height)

    height += 20

    doc.fontSize(12)
    doc.font("public/font/Montserrat-Regular.ttf");
   supliers.forEach((s, i) => {
       doc.text(`${i+1}`, 180, height)
       doc.text(`${s.name}`, 195, height)
       doc.text(`${s.sold} Lei`, 355, height)
       height+=13
       total += s.sold
   })

   doc.fontSize(14)
   doc.font('public/font/Montserrat-Bold.ttf')
   doc.text('TOTAL', 195, height)
   doc.text(`${round(total)}`, 345, height)


return doc
}



module.exports = {createSupliersSolds}




