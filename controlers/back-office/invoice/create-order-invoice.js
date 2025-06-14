const {round, formatDateEFactura} = require('../../../utils/functions')


function createOrderInvoice(order, customer, supplier) {
  const invoice = {
    serie: 'CAMPUS',
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
      const price = p.price;
      const vatRate = 1 + (p.tva / 100);
      const priceNoVat = round(price / vatRate);
      let product = {
        name: p.name,
        quantity: p.quantity,
        unitCode: 'H87',
        price: priceNoVat,
        vatPrecent: p.tva,
        total: +p.total-p.discount, 
        totalNoVat: round(priceNoVat * p.quantity)
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
  invoice.taxExclusiveAmount = invoice.products.reduce((sum, p) => {
    const existingRate = invoice.vatGroups.find(r => r.rate === p.vatPrecent)
    if(existingRate){
      existingRate.taxable += p.totalNoVat
      existingRate.tax += p.total
    } else {
      invoice.vatGroups.push({rate: p.vatPrecent, tax: p.total, taxable: p.totalNoVat})
    }
    return sum + (p.totalNoVat || 0)
  }, 0)

  invoice.taxExclusiveAmount = round(invoice.taxExclusiveAmount)

  invoice.vatGroups.forEach(v => {
    v.tax = round(v.tax - v.taxable)
    v.taxable = round(v.taxable)
  })
  
  invoice.vatAmount = round(invoice.taxInclusiveAmount - invoice.taxExclusiveAmount)
  return invoice
}


module.exports = {createOrderInvoice}