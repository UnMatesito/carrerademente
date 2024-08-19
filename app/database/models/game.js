import mongoose from 'mongoose';
import { questionsSchema } from './questions.js'
import { playerSchema } from './player.js'

// Configuracion del schema
const gameSchema = new mongoose.Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    gameID: String,
    turn: Number,
    start: {type: Boolean, default: false},
    players: [playerSchema],
    diced: {type : Boolean, default: false},
    host: String,
    question: questionsSchema,
    answeredQuestions: [questionsSchema],
    winner: String
});

//configuracion model del juego
const Game = mongoose.model('Games', gameSchema);

export { Game, gameSchema }
export default Game
