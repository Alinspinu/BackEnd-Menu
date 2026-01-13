 
const {Table, Area} = require('../../models/utils/table')

module.exports.sendTables = async (req, res, next) => {
    const {loc, point} = req.query
    try{
         const tables = await Table.find({locatie: loc, salePoint: point}).populate({
            path: 'bills', 
            model: "Order", 
            match: {status: "open", locatie: loc, salePoint: point}, 
            populate: {path: 'masaRest', select: 'index'}
        }).lean()
        const sortedTables = tables.sort((a,b) => a.index - b.index)
    //    const area = await createAreaForTables(sortedTables, point, loc)
    //    if(area){
    //     console.log('Zona creată cu succes! locatie ', loc, ' point ', point)
    //    }
        res.status(200).json(sortedTables)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}


async function createAreaForTables(tables = [], point, loc) {
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('Tables array is required');
    }

    const check = await Area.findOne({locatie: loc, salePoint: point})
    if(check){
        console.log('Zona deja creata')
        return null
    }
  
    // Create & save area first
    const area = await Area.create({
      locatie: loc,
      salePoint: point,
      name: 'Principal',
      tables: tables.map(t => t._id)
    });
  
    // Update all tables in ONE query
    await Table.updateMany(
      { _id: { $in: tables.map(t => t._id) } },
      { $set: { area: area._id } }
    );
  
    return area;
  }

module.exports.addTable = async (req, res, next) => {
    const {loc, point} = req.query
    const { name, area } = req.body;
    try{
        const table = new Table()
        table.locatie = loc
        table.salePoint = point
        if(area) {
            table.area = area
            await Area.findByIdAndUpdate(area, {$push: {tables: table._id}})
        }
        if(name){
            table.name = name
        }
        const newTable =  await table.save()
        res.status(200).json({message: 'Masa a fost creată!', table: newTable})
    } catch(error) {
        console.log(error)
        res.status(500).json({message: error})
    }
}

module.exports.editTable = async (req, res, next) => {
    try{
        const {name, tableId} = req.body;
        if(tableId){
            const newTable =  await Table.findOneAndUpdate({_id: tableId}, {name: name}, {new: true})
            res.status(200).json({message: `Masa numarul ${newTable.index} a fost modificată cu success!`, table: newTable})
        }
    }catch(err) {
        console.log(err);
        res.status(500).json({message: err})
    }
}


module.exports.deleteTable = async (req, res, next) => {
    try{
        const {tableId} = req.query;
        const table = await Table.findOne({_id: tableId})
        await Area.findByIdAndUpdate(table.area, {$pull: {tables: table._id}})
        const message = table.name ? table.name : table.index
        await table.deleteOne()
        res.status(200).json({message: `Masa ${message} a fost ștearsă cu succes!`})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err})
    }
}


module.exports.getArea = async (req, res) => {
    const {loc, point} =  req.query
    try{
        const areas = await Area.find({locatie: loc, salePoint: point})
                    .populate({path: 'tables', 
                        populate: {
                            path: 'bills', 
                            model: "Order", 
                            match: {status: "open", locatie: loc, salePoint: point}, 
                            populate: {path: 'masaRest', select: 'index'}
                        }
                    })
     res.status(200).json(areas)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.createArea = async (req, res) => {
    try {
      const {
        loc,
        point,
        name,
        tablesNumber = 0
      } = req.body;
  
      // Basic validation
      if (!loc || !point || !name) {
        return res.status(400).json({
          message: 'Loacatia, Punctul de lucru și Numele sunt obligatorii'
        });
      }
  
      // Create area first
      const newArea = await Area.create({
        name,
        locatie: loc,
        salePoint: point,
        tables: []
      });
  
      // Create tables if needed
      if (tablesNumber > 0) {
        const tables = Array.from({ length: tablesNumber }).map(() => ({
          locatie: loc,
          salePoint: point,
          area: newArea._id
        }));
  
        const createdTables = await Table.insertMany(tables);
  
        newArea.tables = createdTables.map(t => t._id);
        await newArea.save();
      }
  
      // Populate tables
      const populatedArea = await Area.findById(newArea._id)
        .populate('tables');
  
      return res.status(201).json({
        message: 'Zona a fost creată cu succes!',
        area: populatedArea
      });
  
    } catch (error) {
      console.error('createArea error:', error);
      res.status(500).json({
        message: 'Eroare la crearea zonei',
        error: error.message
      });
    }
  };


  module.exports.editArea = async (req, res) => {
    const {area} = req.body
    try{
        const editedArea = await Area.findByIdAndUpdate(area._id, area, {new: true})
                    .populate({path: 'tables', 
                        populate: {
                            path: 'bills', 
                            model: "Order", 
                            match: {status: "open", locatie: loc, salePoint: point}, 
                            populate: {path: 'masaRest', select: 'index'}
                        }
                    })
         res.status(200).json(editedArea)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deleteArea = async (req, res) => {
    const {id} = req.body
    try{

        const area = await Area.findById(id)
        if(area.tables.length){
            return res.status(401).json({message: 'Trebuie să ștergi totate mese din zona înainte de a sterge zona.'})
        }

        await area.deleteOne()
        res.status(200).json({message: 'Zona a fost ștearsă cu succes!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}