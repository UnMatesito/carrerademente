import express from 'express'
import Game from '../database/models/game.js'
import crypto from 'crypto'
import Player from '../database/models/player.js'

const router = express.Router()

function generateInvitationCode(length = 6){
    return crypto.randomBytes(length)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, length);
}


router.post('/new',  async (req, res) => {
    
    // Crear un nuevo Jugador
    const player = new Player({ name: req.body.name, color: req.body.color })
   
    // Crear una nueva Partida
    const game = new Game({ gameID: generateInvitationCode()})

    // Guardar los cambios en la base de datos
    game.players.push(player)
    await game.save();

    // Enviar los jugadores al cliente
    req.io.to(game.gameID).emit('updatePlayers', {
        gameID: game.gameID,
        players: game.players,
        playerCount: game.players.length,
    });

    res.status(201).json({ gameID: game.gameID })
})

router.post('/join', async (req, res) => {
    const player = new Player({ name: req.body.name , color: req.body.color })
    const game = await Game.findOne({gameID: req.body.gameID})
    if (game) {
        // Verificar si la partida no esta comenzada
        if (!game.start){
            // Verificar si el jugador ya está en el juego
            const searchPlayer = game.players.find(p => p.name === player.name);

            if (!searchPlayer) {
                // Añadir el jugador al juego
                game.players.push(player);
                    
                // Guardar los cambios en la base de datos
                await game.save();
                
                // Enviar los jugadores al cliente
                req.io.to(game.gameID).emit('updatePlayers', {
                    gameID: game.gameID,
                    players: game.players,
                    playerCount: game.players.length,
                });
                    
                res.status(200).json({ gameID: game.gameID });
            } else {
                res.status(400).send('El jugador ya se encuentra en la partida')
            }
        } else {
            res.status(401).send('Partida Ya empezada')
        }
    } else {
        res.status(404).send('Juego No encontrado')
    }
})

export default router