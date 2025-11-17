const {round} = require('../../utils/functions');



function createSupliersSolds(supliers, doc){


    let height = 30

    doc.image('public/icons/logo-true.png', 200, height, {width: 80})

    height += 40

    let total = 0

    doc.fontSize(14)
    doc.font('public/font/Montserrat-Bold.ttf')
    doc.text('Situatie furnizori', 220, height)

    height += 20

    doc.fontSize(12)
    doc.font("public/font/Montserrat-Regular.ttf");
   supliers.forEach((s, i) => {
       doc.text(`${i+1}`, 180, height)
       doc.text(`${s.name}`, 185, height)
       doc.text(`${s.sold} Lei`, 275, height)
       height+=13
       total += s.sold
   })

   doc.fontSize(14)
   doc.font('public/font/Montserrat-Bold.ttf')
   doc.text('TOTAL', 180, height)
   doc.text(`${round(total)}`, 270, height)


return doc
}



module.exports = {createSupliersSolds}




