const subProduct = require('../../../models/office/product/sub-product');
const {round, formatDateEFactura} = require('../../../utils/functions')


function createOrderInvoice(order, customer, supplier, unload) {
  const invoice = {
    serie: 'T',
    unload: unload,
    invoiceCode: unload ? '380' : '751',
    note: unload ? 'Factură fiscală' : 'Factură încasată cu bon fiscal la data de ' + formatDateEFactura(order.updatedAt),
    issueDate: formatDateEFactura(order.updatedAt),
    dueDate: formatDateEFactura(order.updatedAt),
    currencyId: 'RON',
    supplier: {
      name: supplier.bussinessName,
      vatNumber: supplier.vatNumber,
      vat: supplier.VAT,
      registration: supplier.register,
      legalForm: 'Capital social 200 lei',
      contact: {
        name: supplier.contactName,
        email: supplier.email,
        telephone: supplier.telephone,
      },
      address: {
        street: supplier.invoiceAddress.street,
        city: supplier.invoiceAddress.city,
        postalCode: supplier.invoiceAddress.postalCode,
        coutrySubentity: supplier.invoiceAddress.coutrySubentity,
        country: 'RO'
      }
    },
    client: {
      name: customer.name,
      vatNumber: customer.vatNumber,
      vat: customer.vat,
      registration: customer.register,
      legalForm: 'Capital social',
      contact: {
        name: '-',
        email: customer.email
      },
      address: {
        street: customer.invoiceAddress.street,
        city: customer.invoiceAddress.city,
        postalCode: customer.invoiceAddress.postalCode,
        coutrySubentity: customer.invoiceAddress.coutrySubentity,
        country: 'RO'
      },
    },
    paymentMeans: {
      code: 42,
      name: `CONT BANCA ${supplier.bank} IN LEI`,
      iban: supplier.account,
      swift: supplier.switf
    },


    products: order.products.map(p => {
      let sgrTax = p.sgrTax ? 0.5 : 0
      let price = p.price - sgrTax;
      const vatRate = 1 + (p.tva / 100);
      const priceNoVat = round(price / vatRate);
      let product = {
        name: p.name,
        quantity: p.quantity,
        unitCode: 'H87',
        price: priceNoVat,
        vatPrecent: p.tva,
        total: round(+p.total-p.discount - (sgrTax * p.quantity)), 
        totalNoVat: round(priceNoVat * p.quantity),
        productId: p._id,
        subProductId: p.subProductId,
        ings: p.ings,
      };
      if(p.discount > 0){
        const discount = p.discount;
        const discountNoVat = round(discount / vatRate);
        product.discount = {};
        product.discount.value = discountNoVat;
        product.discount.reason = 'Discount Client';
        product.discount.reasonCode = 95;
        product.discount.precent = round((discount / +p.total) * 100)
        product.totalNoVat = round(product.totalNoVat - discountNoVat)
      }
      return product
    }),
 
    vatAmount: 0,
    vatGroups: [],
    taxExclusiveAmount: 0,
    taxInclusiveAmount: order.total,
    payableAmount: order.total,
    eFacturaId: '',
    eFacturaStatus: 'NEÎNCĂRCATĂ',
    eFacturaError: '',
    customer: customer._id,
    locatie: order.locatie,
    salePoint: order.salePoint
  }


  order.products
  .filter(p => p.sgrTax)
  .forEach(p => {
    invoice.products.push({
      name: 'SGR - garantie ambalaj',
      quantity: p.quantity,
      unitCode: 'H87',
      price: 0.5,
      vatPrecent: 0,          // ✅ zero VAT
      total: round(0.5 * p.quantity),
      totalNoVat: round(0.5 * p.quantity),
      ings: []
    })
  })

  

  if(order.tips > 0){
    const tipsProduct = {
      name: 'Bacsis',
      quantity: 1,
      unitCode: 'H87',
      price: round(order.tips),
      vatPrecent: 0,
      total: round(order.tips), 
      totalNoVat: round(order.tips),
      ings: []
    }
    invoice.products.push(tipsProduct)
  }


  
  invoice.taxExclusiveAmount = invoice.products.reduce((sum, p) => {

    const existingRate = invoice.vatGroups.find(r => r.rate === p.vatPrecent)
  
    const taxable = p.totalNoVat
    const tax = round(p.total - p.totalNoVat)
  
    if (existingRate) {
      existingRate.taxable += taxable
      existingRate.tax += tax
    } else {
      invoice.vatGroups.push({
        rate: p.vatPrecent,
        taxable,
        tax
      })
    }

  
    return sum + taxable
  }, 0)

  invoice.taxExclusiveAmount = round(invoice.taxExclusiveAmount)


  invoice.vatGroups.forEach(v => {
    v.taxable = round(v.taxable)
    v.tax = round(v.tax)
  })




  invoice.vatAmount = round(
    invoice.vatGroups.reduce((sum, v) => sum + v.tax, 0)
  )

  return invoice
}


function createSheetInvoice(sheet, indexes){

  let total = 0
  const invoice = {
    serie: 'T',
    unload: true,
    invoiceCode: '380',
    note: `Factură fiscală după fisele de comandă ${indexes}` ,
    issueDate: formatDateEFactura(sheet.createdAt),
    dueDate: formatDateEFactura(sheet.createdAt),
    currencyId: 'RON',
    supplier: {
      name: sheet.suplier.locatie.bussinessName,
      vatNumber: sheet.suplier.locatie.vatNumber,
      vat: supplier.VAT,
      registration: sheet.suplier.locatie.register,
      legalForm: 'Capital social 200 lei',
      contact: {
        name: sheet.suplier.locatier.contactName,
        email: sheet.suplier.locatie.email,
        telephone: sheet.suplier.locatie.telephone,
      },
      address: {
        street: sheet.suplier.locatie.invoiceAddress.street,
        city: sheet.suplier.locatie.invoiceAddress.city,
        postalCode: sheet.suplier.locatie.invoiceAddress.postalCode,
        coutrySubentity: sheet.suplier.locatie.invoiceAddress.coutrySubentity,
        country: 'RO'
      }
    },
    client: {
      name: sheet.customer.locatie.bussinessName,
      vatNumber: sheet.customer.locatie.vatNumber,
      vat: sheet.customer.locatie.VAT,
      registration: sheet.customer.locatie.register,
      legalForm: 'Capital social',
      contact: {
        name: sheet.customer.locatie.contactName,
        email: sheet.customer.locatie.email
      },
      address: {
        street: sheet.customer.locatie.invoiceAddress.street,
        city: sheet.customer.locatie.invoiceAddress.city,
        postalCode: sheet.customer.locatie.invoiceAddress.postalCode,
        coutrySubentity: sheet.customer.locatie.invoiceAddress.coutrySubentity,
        country: 'RO'
      },
    },
    paymentMeans: {
      code: 42,
      name: `CONT BANCA ${sheet.suplier.locatie.bank} IN LEI`,
      iban: sheet.suplier.locatie.account,
      swift: sheet.suplier.locatie.switf
    },
  
    products: sheet.products.map(p => {
      const vatRate = 1 + (p.tva / 100);
      let product = {
        name: p.pName,
        quantity: p.pQty,
        unitCode: 'H87',
        price: p.pPrice,
        vatPrecent: p.tva,
        total: round((p.pPrice * p.quantity) * vatRate), 
        totalNoVat: round(p.pPrice * p.quantity),
        productId: p.pId,
        subProductId: p.subId,
        ings: p.productIngs,
      };
      total += product.total
      return product
    }),

    vatAmount: 0,
    vatGroups: [],
    taxExclusiveAmount: 0,
    taxInclusiveAmount: round(total),
    payableAmount: round(total),
    eFacturaId: '',
    eFacturaStatus: 'NEÎNCĂRCATĂ',
    eFacturaError: '',
    customer: sheet.customer.locatie._id,
    locatie: sheet.suplier.locatie._id,
    salePoint:sheet.suplier.salePoint
  }

  invoice.taxExclusiveAmount = invoice.products.reduce((sum, p) => {

    const existingRate = invoice.vatGroups.find(r => r.rate === p.vatPrecent)
  
    const taxable = p.totalNoVat
    const tax = round(p.total - p.totalNoVat)
  
    if (existingRate) {
      existingRate.taxable += taxable
      existingRate.tax += tax
    } else {
      invoice.vatGroups.push({
        rate: p.vatPrecent,
        taxable,
        tax
      })
    }

  
    return sum + taxable
  }, 0)

  invoice.taxExclusiveAmount = round(invoice.taxExclusiveAmount)


  invoice.vatGroups.forEach(v => {
    v.taxable = round(v.taxable)
    v.tax = round(v.tax)
  })




  invoice.vatAmount = round(
    invoice.vatGroups.reduce((sum, v) => sum + v.tax, 0)
  )

  return invoice
}


module.exports = {createOrderInvoice, createSheetInvoice}