const User = require('../models/user-true')
const Employee = require('../models/employee')

module.exports.sendUsers = async (req, res, next) => {
    try{
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
        const user = await User.find(filterTo).populate({path: 'employee'});
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
        const user = await User.findById(userId).select('-password')
        res.status(200).json(user)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }

}


module.exports.editUser = async (req, res, next) => {

}