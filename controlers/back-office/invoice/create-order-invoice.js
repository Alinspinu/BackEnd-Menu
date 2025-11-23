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
        total: +p.total-p.discount - (sgrTax * p.quantity), 
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
    eFacturaStatus: '',
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
      price: order.tips,
      vatPrecent: 0,
      total: order.tips, 
      totalNoVat: order.tips,
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


module.exports = {createOrderInvoice}