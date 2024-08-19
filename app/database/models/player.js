import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: String,
    color: String,
    points: {type: Number, default : 0},
})

const Player = mongoose.model('Player', playerSchema)

export { Player, playerSchema }
export default Player
