const Dep = require('../../models/office/product/dep')
const Gest = require('../../models/office/product/gestiune')
const mongoose = require('mongoose')






module.exports.getDep = async (req, res) => {
    const {salePoint, loc} = req.query
    try{
        const deps = Dep.find({salePoint: salePoint, locatie: loc})
        res.status(200).json(deps)
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }   
}


module.exports.addDep = async (req, res) => {
    const {dep} = req.body
    try{
        const newDep = new Dep(dep)
        const savedDep = await newDep.save()
        console.log(savedDep)
        res.status(200).json({message: 'Departamentul a fost adaugat', dep: savedDep})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.editDep = async (req, res) => {
    const {dep} = req.body
    try{
        const editedDep = await Dep.findByIdAndUpdate(dep._id, dep, {new: true})
        res.status(200).json({message: 'Departametul a fost editat cu success!', dep: editedDep})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.deleteDep = async (req, res) => {
    const {id} = req.query
    try{
        await Dep.findByIdAndDelete(id)
        res.status(200).json({message: 'Departamentul a fost șters cu success!'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}



module.exports.getGest = async (req, res) => {
    const  {salePoint, loc} = req.query;
    try{
        const gests = Gest.find({salePoint: salePoint, locatie: loc})
        res.status(200).json(gests)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.addGest = async (req, res) => {
    const {gest} = req.body
    try{ 
        const newGest = new Gest(gest)
        const savedGest = await newGest.save()
        console.log(savedGest)
        res.status(200).json({message: 'Gesiunea a fost adăugată cu succes!', gest: savedGest})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }

}


module.exports.editGest = async (req, res) => {
    const {gest} = req.body
    try{
        const editedGest = await Gest.findByIdAndUpdate(gest._id, gest, {new: true})
        res.status(200).json({message: 'Gestiunea a fost editată cu success!', gest: editedGest})
    } catch(error){
        console.log(error)
        res.status(500).json(eroor)
    }

}


module.exports.deleteGest = async (req, res) => {
    const {id} = req.query;
    try{
        await Gest.findByIdAndDelete(id)
        res.status(200).json({message: 'Gestiunea a fost ștearsă cu sucess!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}




