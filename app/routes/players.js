import express from 'express'
import Game from '../database/models/game.js'

const router = express.Router()

// Obtener los jugadores de un juego
router.get('/', async (req, res) => {
    const game = await Game.findOne({ gameID: req.query.idG })
    if (game) {
      const players = []
      game.players.forEach(player => {
        players.push({
          name: player.name,
          color: player.color,
          points: player.points,
        })
      })
      res.send(players)
    } else {
      res.status(404).send('Juego no encontrado')
    }
})

// Determinar el primer turno de la partida de forma aleatoria
router.get('/turn', async (req, res) => {
    const game = await Game.findOne({ gameID: req.query.idG })
    if (game && game.start) {
      if (game.players.length != 0) {
          game.turn = Math.floor(Math.random() * game.players.length)
          await game.save()
          res.status(200).json({ id: req.players[game.turn].id , name: game.players[game.turn].name })
      } else {
          res.status(404).send('No hay jugadores')
      }
    } else {
      res.status(404).send('Juego no encontrado y no empezado')
    }
})


export default router