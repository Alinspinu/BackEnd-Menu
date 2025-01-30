


const Ingredient = require('../../models/office/inv-ingredient.js')


module.exports.updateGest = async (req, res) => {
    try{
        const ingsBu = await  Ingredient.updateMany({gestiune: 'bucatarie'}, {$set: {gestiune: new mongoose.Types.ObjectId('679a634e1feadad813f5f86c') }})
        const ingsB = await  Ingredient.updateMany({gestiune: 'bar'}, {$set: {gestiune: new mongoose.Types.ObjectId('679a635e1feadad813f5f86e') }})
        const ingsM = await  Ingredient.updateMany({gestiune: 'magazie'}, {$set: {gestiune: new mongoose.Types.ObjectId('6679a63681feadad813f609dd') }})

        const ingsMate = await  Ingredient.updateMany({dep: 'materie'}, {$set: {dep: new mongoose.Types.ObjectId('679a63811feadad813f609df') }})
        const ingsMarf = await  Ingredient.updateMany({dep: 'marfa'}, {$set: {dep: new mongoose.Types.ObjectId('679a63901feadad813f609e1') }})
        const ingsCons = await  Ingredient.updateMany({dep: 'consumabil'}, {$set: {dep: new mongoose.Types.ObjectId('679a639e1feadad813f609e3') }})
        const ingsSer = await  Ingredient.updateMany({dep: 'servicii'}, {$set: {dep: new mongoose.Types.ObjectId('679a63a71feadad813f609e5') }})
        const ingsMark = await  Ingredient.updateMany({dep: 'marketing'}, {$set: {dep: new mongoose.Types.ObjectId('679a63b71feadad813f609e7') }})
        const ingsInv = await  Ingredient.updateMany({dep: 'ob-inventar'}, {$set: {dep: new mongoose.Types.ObjectId('679a63c61feadad813f609e9') }})
        const ingsAmen = await  Ingredient.updateMany({dep: 'amenajari'}, {$set: {dep: new mongoose.Types.ObjectId('679a63d91feadad813f6b107') }})
        const ingsComb = await  Ingredient.updateMany({dep: 'combustibil'}, {$set: {dep: new mongoose.Types.ObjectId('679a63e31feadad813f6cc7e') }})
        const ingsUti = await  Ingredient.updateMany({dep: 'utilitati'}, {$set: {dep: new mongoose.Types.ObjectId('679a63f61feadad813f6e8a7') }})
        const ingsChi = await  Ingredient.updateMany({dep: 'chirie'}, {$set: {dep: new mongoose.Types.ObjectId('679a640f1feadad813f6fa16') }})




        console.log('GESTIUNE BUCATARIE', ingsBu)
        console.log('GESTIUNE BAR', ingsB)
        console.log('GESTIUNE MAGAZIE', ingsM)
        console.log('DEPARTAMENT MATERIE', ingsMate)
        console.log('DEPARTAMENT MARFA', ingsMarf)
        console.log('DEPARTAMENT CONSUMABIL', ingsCons)
        console.log('DEPARTAMENT SERVICII', ingsSer)
        console.log('DEPARTAMENT MARKETING', ingsMark)
        console.log('DEPARTAMENT OB-INVENTAR', ingsInv)
        console.log('DEPARTAMENT AMENAJARI', ingsAmen)
        console.log('DEPARTAMENT COMBUSTIBIL', ingsComb)
        console.log('DEPARTAMENT UTILITATI', ingsUti)
        console.log('DEPARTAMENT CHIRIE', ingsChi)


        res.status(200).json({message: 'sssswewwessds'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}