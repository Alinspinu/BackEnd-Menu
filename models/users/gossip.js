const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gossipSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        filename: String,
        path: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now()
    },
    liked: {
        type: Boolean,
        default: false
    },
    comments:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ],
    likes:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Like'
            },
        ],

},{timestamps: true})

const commentSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now()
    },
    gossip: {
        type: Schema.Types.ObjectId,
        ref: 'Gossip'
    },
    comments:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ],
    likes:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Like'
            },
        ],

}, {timestamps: true})

const likeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now()
    },
    comment:
    {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    gossip:
    {
        type: Schema.Types.ObjectId,
        ref: 'Gossip'
    }

})



module.exports.Like = mongoose.model('Like', likeSchema)
module.exports.Comment = mongoose.model('Comment', commentSchema)
module.exports.Gossip = mongoose.model("Gossip", gossipSchema)