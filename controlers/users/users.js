const User = require('../../models/users/user')
const Employee = require('../../models/users/employee')
const QRCode = require('qrcode');

const { sendCompleteRegistrationEmail } = require('../../utils/mail')

// const loc = '655e2e7c5a3d53943c6b7c53'

module.exports.sendUsers = async (req, res, next) => {
    try{
        const {loc} = req.query
        let filterTo = {}
        const {filter} = req.body;
        if(filter === 'employees'){
           filterTo = { employee: { 
                $exists: true,                                     
              },
            }
        } else if(filter === 'users'){
            filterTo = { employee: { 
                $exists: false,                                     
              },
            }
        } else if (filter.length > 10) {
            filterTo = {
                _id: filter
            }
        }
        filterTo.locatie = loc
        const user = await User.find(filterTo);
        const sortedUsers = user.sort((a, b) => a.name.localeCompare(b.name));
        let filterProducts = [];
        if(req.query.search.length){
          filterProducts = sortedUsers.filter((object) =>
          object.name.toLocaleLowerCase().includes(req.query.search.toLocaleLowerCase())
          );
        } else {
          filterProducts = sortedUsers;
        }
        res.status(200).json(filterProducts);
      } catch(error) {
        console.log(error);
        res.status(500).json({message: error});
      }
}


module.exports.sendUser = async (req, res, next) => {
    try{
        const {userId} = req.body
        const user = await User.findById(userId)
            .select('-password')
            .populate({
                path: 'orders', 
                select: [
                    'createdAt',
                    'tips', 
                    'total',
                    'discount', 
                    'cashBack', 
                    'index',
                    'productCount',
                    'products.name', 
                    'products.quantity', 
                    'products.price', 
                    'products.imgUrl',
                    'products.toppings.name', 
                    'products.toppings.price'
                ]
            })
        res.status(200).json(user)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}


module.exports.editUser = async (req, res, next) => {
    const {update} = req.body;
    const {id} = req.query;
    try{
        console.log(update)
        const user = await User.findByIdAndUpdate(id, update, {new: true})
        console.log(user)
        res.status(200).json({message: 'Utilizatorul a fost actualizat!'})
    } catch (err) {
        console.log(err)
        res.status(200).json({message: err.message})
    }
}

module.exports.deleteUser = async (req, res, next) => {
    try{
        const {id} = req.query;
        const user = await User.findByIdAndDelete(id);
        res.status(200).json({message: `Utilizatorul ${user.name} a fost șters cu succes!`})   
    }catch(err){
        console.log(err)
        res.status(500).json(err.message)
    }
}


module.exports.sendCustomer = async (req, res, next) => {
  try{
      const {id} = req.query;
      if(id.length < 16 || id.length === 4 ){
        const customer = await User.findOne({cardIndex: id}).select('name email telphone cashBack, discount');
        if(customer){
            res.status(200).json({message: 'All good', customer})
        } else {
            res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
        }
      } else {
          const customer = await User.findById(id).select('name email telphone cashBack, discount');
          if(customer){
              res.status(200).json({message: 'All good', customer})
          } else {
              res.status(404).json({message: 'Clientul nu a fost găsit în baza de date'})
          }
      }
  } catch (err){
      console.log(err)
      res.status(500).json({message: 'Ceva nu a mers bine Eroare la cautare 500'})
  }
}


module.exports.generateUserQrCode = async (req, res, next) => {
    try{
        const {id} = req.query
        const qrCode = await QRCode.toDataURL(id);
        res.send(qrCode);
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.newCustomer = async (req, res, next) => {
  try{
      const {name, email, cardIndex, loc} = req.body;
      const check = await User.findOne({ email: email, locatie: loc }).select('name telephone email cashBack discount');
      if (check && cardIndex === 0) {
        return res.status(256).json({ message: 'Acest email există deja în baza de date!', customer: check });
      } else if(check && cardIndex !== 0){
        const updatedUser =  await User.findByIdAndUpdate(check._id, {cardIndex: cardIndex}, {new: true})
        return res.status(200).json({ message: 'Utilizatorului i s-a adaugat cadrul la cont', customer: updatedUser });
      } else {
          const user = new User({
              name: name,
              email: email,
              locatie: loc,
              cardIndex: cardIndex
          });
          const savedUser = await user.save();
          const customer = await User.findById(savedUser._id).select('name telephone email cashBack');
          await sendCompleteRegistrationEmail(customer);
          res.status(200).json({message: 'All good', customer});
      }
  }catch(err){
      console.log(err);
      res.status(500).json(err);
  }
}