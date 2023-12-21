
// const Table = require('./models/utils/table')

// app.get('/create-tables', async (req, res) => {

//     const tables = await Table.find({})

//     for(let i=0; i< tables.length; i++){
//        tables[i].index = i+1
//        await tables[i].save()
//     }
//     res.send('mesele au fost modificate')
// }) 



// module.exports.register = async (req, res, next) => {
//     const hashedPassword = hashPassword('VefcemltfC');
//     const newUser = new User({
//         password: hashedPassword,
//         name: 'allisone',
//     });
//     await newUser.save()
//     res.status(200).json({ message: `allisone and allisdone ${newUser.password}` });

// }


    // module.exports.renderMailTemplate = async (req, res, next) => {
    //     const order = await Order.findOne({}, {}, { sort: { 'createdAt': -1 }})
    //     let cakeProducts = order.products.filter(product => product.name.startsWith('Cozonac'));
    //     let cakeTotal = 0
    //     cakeProducts.forEach(el => {
    //         cakeTotal += el.total
    //     })
    //     const startDate = formatedDateToShow(order.createdAt)
    //     const endDate = formatedDateToShow(order.preOrderPickUpDate)
    //     const cakeOrder = {
    //         clientName: order.userName,
    //         clientEmail: "eeeeee@eee.com",
    //         clientTelephone: order.userTel,
    //         products: cakeProducts,
    //         createdAt: startDate,
    //         deliveryTime: endDate,
    //         avans: cakeTotal,
    //     }
    //     res.render('layouts/info-order', {data: cakeOrder})
    // }



    // app.set('trust proxy', true);
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'https://true-meniu.web.app');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next()
// });