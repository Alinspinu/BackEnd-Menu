const { default: mongoose } = require('mongoose')
const { Gossip, Comment, Like } = require('../models/users/gossip')
const User = require('../models/users/user')
const { ObjectId } = require('mongodb')
const { cloudinary } = require('../cloudinary/gossip');

module.exports.new = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.user)
        const newGossip = new Gossip(req.body)
        if (req.file) {
            const { filename, path } = req.file
            newGossip.image.path = path
            newGossip.image.filename = filename
        }
        newGossip.user = user._id
        user.gossips.push(newGossip)
        const savedGossip = await newGossip.save()
        console.log(req.body)
        console.log(savedGossip)
        await user.save()
        const gossip = await Gossip.findById(savedGossip._id)
                .populate({ path: 'user', select: '-password' })
                .populate({ path: 'comments', populate: { path: 'user', select: '-password' } })
                .populate('likes');
        const gossipToSend = {
            _id: gossip._id,
            userId: gossip.user._id,
            userName: gossip.user.name,
            userImage: gossip.user.profilePic,
            title: gossip.title,
            description: gossip.description,
            imgPath: gossip.image,
            comments: gossip.comments,
            likes: gossip.likes.length
        }
        res.status(200).json({ message: 'Bârfa a fost salvată cu succes!', gossip: gossipToSend });
    } catch (err) {
        res.status(500).json({ error: `Error saving document: ${err.message}` })
    }
}


module.exports.edit = async (req, res, next) => {
    try{
        const gossip = await Gossip.findById(req.body.gossipId)
                .populate({ path: 'user', select: '-password' })
                .populate({ path: 'comments', populate: { path: 'user', select: '-password' } })
                .populate('likes');
        if (req.file) {
            if(gossip.image.filename && gossip.image.filename.length){
                await cloudinary.uploader.destroy(gossip.image.filename)
            }
            const { filename, path } = req.file
            gossip.image.path = path
            gossip.image.filename = filename
        }
        gossip.title = req.body.title
        gossip.description = req.body.description
        await gossip.save()
        const gossipToSend = {
            _id: gossip._id,
            userId: gossip.user._id,
            userName: gossip.user.name,
            userImage: gossip.user.profilePic,
            title: gossip.title,
            description: gossip.description,
            imgPath: gossip.image,
            comments: gossip.comments,
            likes: gossip.likes.length
        }
        res.status(200).json({ message: 'Bârfa a fost editată cu succes!', gossip: gossipToSend });
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.delete = async (req, res, next) => {
    try{
        const {id} = req.query
        const gossip = await Gossip.findById(id)
        if(gossip.image.filename && gossip.image.filename.length){
            await cloudinary.uploader.destroy(gossip.image.filename)
        }
        await Gossip.findByIdAndDelete(id)
        res.status(200).json({message: 'Bârfa a fost ștearsă cu sucess!'})
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.fetchOne = async (req, res, next) => {
    try{
        const {id} = req.query
        const gossip = await Gossip.findById(id)
            .populate({path: 'comments', populate: {path: 'user', select: 'name profilePic'}})
            .populate({path: 'user', select: 'name profilePic'})
        res.status(200).json(gossip)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.fetchGossips = async (req, res, next) => {
    console.log('hit the function')
    const perPage = 3;
    const page = parseInt(req.params.page) || 1;

    try {
        // Find the gossips with pagination
        const gossips = await Gossip.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate({ path: 'user', select: '-password' })
            .populate({ path: 'comments', populate: { path: 'user', select: '-password' } })
            .populate({path: 'likes', populate: {path: 'user', select: 'name profilePic'}});

        // Find the total count of gossips
        const count = await Gossip.countDocuments();

        // Check if there are more gossips
        if ((perPage * page) < count) {
            const gossipsArr = gossips.map((obj) => ({
                _id: obj._id,
                userId: obj.user._id,
                userName: obj.user.name,
                userImage: obj.user.profilePic,
                title: obj.title,
                description: obj.description,
                imgPath: obj.image,
                comments: obj.comments,
                likes: obj.likes,
                createdAt: obj.createdAt
            }));

            const data = {
                count: count,
                gossips: gossipsArr
            };

            res.status(200).json(data);
        } else {
            // Calculate the number of remaining documents
            const remaining = count % perPage;

            if (remaining === 0) {
                res.json([]);
            } else {
                // Fetch the last gossips
                const lastGossips = await Gossip.find()
                    .limit(remaining)
                    .populate({ path: 'user', select: '-password' })
                    .populate({ path: 'comments', populate: { path: 'user', select: '-password' } })
                    .populate('likes');

                const gossipsArr = lastGossips.map((obj) => ({
                    _id: obj._id,
                    userId: obj.user._id,
                    userName: obj.user.name,
                    userImage: obj.user.profilePic,
                    title: obj.title,
                    description: obj.description,
                    imgPath: obj.image,
                    comments: obj.comments,
                    likes: obj.likes,
                    createdAt: obj.createdAt
                }));

                const data = {
                    count: count,
                    gossips: gossipsArr
                };

                res.status(200).json(data);
            }
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ error: `Fetching failed: ${err.message}` });
    }
};





module.exports.fetchGossipsByUser = async (req, res, next) => {
    const perPage = 3;
    const page = parseInt(req.query.page) || 1;
    try {
        const userId = req.query.userId
        const id = new ObjectId(userId)
        const gossips = await Gossip.find({ user: id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate({ path: 'user', select: '-password' })
            .populate({ path: 'comments', populate: { path: 'user', select: '-password' } })
            .populate('likes');

            const count = await Gossip.countDocuments().exec();
            if ((perPage * page) < count) {
                const gossipsArr = gossips.map((obj) => ({
                    _id: obj._id,
                    userId: obj.user._id,
                    userName: obj.user.username,
                    userImage: obj.user.profilePic,
                    title: obj.title,
                    description: obj.description,
                    imgPath: obj.image,
                    comments: obj.comments,
                    likes: obj.likes,
                    createdAt: obj.createdAt
                }))
                const data = {
                    count: count,
                    gossips: gossipsArr,
                }
                res.status(200).json(data)
            } else {
                            // Calculate the number of remaining documents
            const remaining = count % perPage;

            if (remaining === 0) {
                res.json([]);
            } else {
                // Fetch the last gossips
                const lastGossips = await Gossip.find({ user: id })
                    .limit(remaining)
                    .populate({ path: 'user', select: '-password' })
                    .populate({ path: 'comments', populate: { path: 'user', select: '-password' } })
                    .populate('likes');

                const gossipsArr = lastGossips.map((obj) => ({
                    _id: obj._id,
                    userId: obj.user._id,
                    userName: obj.user.name,
                    userImage: obj.user.profilePic,
                    title: obj.title,
                    description: obj.description,
                    imgPath: obj.image,
                    comments: obj.comments,
                    likes: obj.likes.length,
                    createdAt: obj.createdAt
                }));

                const data = {
                    count: count,
                    gossips: gossipsArr
                };

                res.status(200).json(data);
            }
            }

    } catch (err) {
        console.log(err)
        res.status(404).json({ error: `Fetching faild.. : ${err.message}` })
    }
}


module.exports.fetchGossipsAndLikes = async (req, res, next) => {
    const userID = req.query.userId
    try {
        const id = new ObjectId(userID)
        const gossips = await Gossip.find({ user: id })
        const gossipsArr = gossips.map((obj) => ({
            likes: obj.likes.length
        }))
        const likes = gossipsArr.reduce((acc, obj) => acc + obj.likes, 0)
        const data = {
            gossips: gossips.length,
            likes: likes
        }
        res.status(200).json(data)
    } catch (err) {
        console.log(err)
        res.status(404).json({ error: `Fetching faild.. : ${err.message}` })
    }
}

module.exports.newComment = async (req, res, next) => {
    const { user, gossip } = req.body
    const dbGossip = await Gossip.findById(gossip)
    const dbUser = await User.findById(user)

    const newComment = new Comment(req.body)

    dbGossip.comments.push(newComment)
    dbUser.comments.push(newComment)

    await dbGossip.save()
    await dbUser.save()
    await newComment.save()
    const savedComment = await Comment.findById({ _id: newComment._id }).populate({
        path: 'user'
    })
    res.status(200).json({ message: 'The comment is saved with success!', comment: savedComment })
}


module.exports.newLike = async (req, res, next) => {
    if (req.body) {
        try {
            const { user, gossip } = req.body
            console.log(req.body)
            const userId = new mongoose.Types.ObjectId(user)
            const gossipId = new mongoose.Types.ObjectId(gossip)
            const dbGossip = await Gossip.findById(gossip).populate({path: 'likes'})
            if (req.body.comment) {
                const commentId = new mongoose.Types.ObjectId(req.body.comment)
                const dbComment = await Comment.findById(req.body.comment)
                const newLike = new Like({
                    user: userId,
                    gossip: gossipId,
                    comment: commentId
                })
                dbGossip.likes.push(newLike)
                dbComment.likes.push(newLike)
                await dbGossip.save()
                await dbComment.save()
                await newLike.save()
            } else {
                const existingLike = dbGossip.likes.find(p => p.user.equals(userId))
                if(!existingLike){
                    const newLike = new Like({
                        user: userId,
                        gossip: gossipId
                    })
    
                    dbGossip.likes.push(newLike)
                    await dbGossip.save()
                    const savedLike = await newLike.save()
                    res.status(200).json({ message: `Like!`, like: savedLike })
                } else {
                    await Gossip.updateOne({_id: dbGossip._id}, {$pull: {likes: existingLike._id}})
                    await existingLike.deleteOne()
                    res.status(200).json({message: 'Unlike!', like: existingLike})
                }
            }
        } catch (err) {
            console.log(err)
            res.status(500).json(err)
        }
    } else
        return res.status(400).json({ message: 'Bad Request, no req.body!' })

}

