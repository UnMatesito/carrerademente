import ejs from 'ejs'
import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import cors from 'cors'
import questionsRouter from './routes/questions.js'
import gamesRouter from './routes/games.js'
import playersRouter from './routes/players.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import Game from './database/models/game.js'
import fs from 'fs'
import dotenv from 'dotenv';

dotenv.config(); 

const app = express()

app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.options('*', cors());

//Conexion con socket.io al Middleware
app.use((req, res, next) => {
    req.io = io;
    req.players = players;
    next();
});

const port = 3000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const server = createServer(app)
const io = new Server(server)
const uri = process.env.URI;

const players = []

// Configuración de vistas: lee los archivos .ejs de la carpeta views
app.set('views', path.join(__dirname, '..', 'views'))
app.engine('html', ejs.renderFile)
app.set('view engine', 'html')
// Ruta para acceder al index
app.get('/', (req, res) => {
    const viewName = 'index.html'
    res.render(viewName, { title: viewName }, (err, html) => {
        if (err) {
            console.log(err)
            res.status(404).send('Página no encontrada')
        } else {
            res.send(html)
        }
    })
})

// Ruta para acceder a la sala de espera
app.get('/room', (req, res) => {
    const viewName = 'room.html'
    res.render(viewName, { title: viewName }, (err, html) => {
        if (err) {
            console.log(err)
            res.status(404).send('Página no encontrada')
        } else {
            res.send(html)
        }
    })
})

// Ruta para acceder al tablero
app.get('/game', (req, res) => {
    const viewName = 'game.html'
    res.render(viewName, { title: viewName }, (err, html) => {
        if (err) {
            console.log(err)
            res.status(404).send('Página no encontrada')
        } else {
            res.send(html)
        }
    })
})

io.on('connection', (socket) => {

    // JoinRoom: un jugador se une a la partida, busca la patida por su gameID y genera un emit para actualizar a los juagadores en la lista de juagadores de la partida
    socket.on('joinRoom', async (data) => {
        socket.join(data.gameID);
        const game = await Game.findOne({ gameID: data.gameID });
        if (game) {
            io.to(data.gameID).emit('updatePlayers', {
                gameID: data.gameID,
                players: game.players,
                playerCount: game.players.length,
            });
            if (game.players.length > 0){
                players.push({ id: socket.id, name: game.players[game.players.length - 1].name, page: data.page, gameID: data.gameID });
            }
        }
    });

    // DetermineHost: determina cual jugador es el host de la partida segun su socket.id
    socket.on('determineHost', async (data) => {
        const game = await Game.findOne({ gameID: data.gameID })
        if (game) {
            if (!game.host){
              game.host = socket.id
              await game.save()
            }
            io.to(data.gameID).emit('role', { host: game.host })
        }
    })

    // StartGame: redirige a todos los jugadores a game.html y coloca a todos los jugadores en la primera casilla con su color correspondiente
    socket.on('startGame', async (data) => {
        const game = await Game.findOne({ gameID: data.gameID })
        if (game) {
            game.start = true
            game.host = null
            await game.save()
        }
        players.length = 0
        const html = fs.readFileSync(path.join(__dirname, '..', 'views', 'game.html'), 'utf8');
        io.to(data.gameID).emit('startGame', {site: `http://localhost:3000/game?gameID=${data.gameID}`, html: html });
    })

    // JoinGame: al Generarse una conexion en el front-end se une a uan partida con id
    socket.on('joinGame', async (data) => {
        socket.join(data.gameID)
        const game = await Game.findOne({ gameID: data.gameID })
        if (game){
            if (game.host == null){
                game.host = socket.id
                await game.save()
                io.to(data.gameID).emit('role', { host: game.host })
            }
        }
        players.push({ id: data.id, page: data.page, gameID: data.gameID })
    })

    // SendCurrentPlayer: emite el jugador actual a los jugadores
    socket.on('sendCurrentPlayer', (data) => {
        io.to(data.gameID).emit('sendCurrentPlayer', {id: data.player.id , player: data.player.name })
    })

    // NewQuestion: emite una nueva pregunta a los jugadores
    socket.on('newQuestion', (data) => {
        io.to(data.gameID).emit('updateQuestion', {question: data.question , player: data.player, gameID: data.gameID})
    })

    // UpdatePlayerPosition: actualiza la posicion de los jugadores en el tablero
    socket.on('updatePlayerPosition', (data) => {
        // Emitir el evento a todos los clientes conectados
        io.to(data.gameID).emit('updatePlayerPosition', { player: data.player, points: data.points});
    });

    // ClearTimer: limpia el temporizador de la partida de todos los jugadores
    socket.on('clearTimer', (data) => {
        io.to(data.gameID).emit('clearTimer');
    })

    // NextTurn: Accediendo a la base de datos le notifica a los jugadores quien es el siguiente en jugar
    socket.on('nextTurn', async (data) => {
        const game = await Game.findOne({ gameID: data.gameID })
        if (game && game.start) {
            let currentPlayer = {id: players[game.turn].id, name: game.players[game.turn].name}
            io.to(data.gameID).emit('getCurrentPlayer', currentPlayer)
        }
    })

    // Blockbuttons: bloquea los botones de respuesta para los jugadores que no tienen el turno
    socket.on('blockButtons', (data) => {
        io.to(data.gameID).emit('blockedButtons')
    })

    // Answer: verifica si la respuesta es correcta o incorrecta y emite el evento correspondiente
    socket.on('answer', (data) => {
        if (data.response === 'correct') {
            io.to(data.gameID).emit('correctAnswer')
        } else if (data.response === 'incorrect') {
            io.to(data.gameID).emit('incorrectAnswer')
        }
    })

    // Disconnect: al desconectarse un jugador de la partida se elimina de la base de datos y se actualiza la lista de jugadores 
    //             (dependiendo de donde se encuentren los jugadores)
    socket.on('disconnect', async () => {
        const backEndplayer = players.find(player => player.id === socket.id);
        const backEndplayerIndex = players.findIndex(player => player.id === socket.id);
        
        if (backEndplayer) {
            const game = await Game.findOne({ gameID: backEndplayer.gameID });
            if (game){
                if (backEndplayer.page === 'room') {
                    //Eliminar al jugador de la base de datos
                    game.players = game.players.filter(player => player.name !== backEndplayer.name)
                    await game.save()
                    // Actualizar la lista de jugadores
                    io.to(backEndplayer.gameID).emit('updatePlayers', {
                        gameID: backEndplayer.gameID,
                        players: game.players,
                        playerCount: game.players.length,
                    });
                    socket.leave(backEndplayer.gameID)
                    players.pop(backEndplayerIndex)
                } else if (backEndplayer.page === 'game') {
                    if (game.start) {
                        //Eliminar al jugador de la base de datos
                        const playerToEliminate = game.players[backEndplayerIndex]

                        // Buscar al jugador con el puntaje mas alto
                        if (game.players.length !== 0){
                            const maxPointsPlayer = game.players.reduce((maxPlayer, currentPlayer) => {
                                return currentPlayer.points > maxPlayer.points ? currentPlayer : maxPlayer;
                            });

                            //Si un jugador tiene la puntuacion mas alta se declara como ganador
                            if (maxPointsPlayer && maxPointsPlayer.points > 0) {
                                game.winner = maxPointsPlayer.name;
                                await game.save();
                                io.to(backEndplayer.gameID).emit('cleanBoard', {winner: game.winner});
                                socket.leave(backEndplayer.gameID);
                            } else {
                                // Si todos los jugadores tienen la misma cantidad de puntos se declara como ganador al host
                                const hostIndex = players.findIndex(player => player.id === game.host);
                                if (hostIndex !== -1) {
                                    game.winner = game.players[hostIndex].name;
                                    await game.save();
                                    io.to(backEndplayer.gameID).emit('cleanBoard', {winner: game.winner});
                                    socket.leave(backEndplayer.gameID);
                                }
                            }
                            game.players = game.players.filter(player => player.name !== playerToEliminate.name)
                            await game.save()
                            players.pop(backEndplayerIndex)
                        }
                    }
                }
            }
        }
    })

    // EndGame: al finalizar el juego determina quien es el ganador y redirige a los jugadores a la pagina de resultados
    socket.on('endGame', async (data) => {
        const game = await Game.findOne({ gameID: data.gameID })
        if (game) {
            game.winner = data.player.name
            await game.save()
            io.to(data.gameID).emit('cleanBoard', {winner: game.winner})
        }
    })
})


// Middleware para parsear el body de las peticiones: permite poder recibir datos en formato JSON
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Middleware para servir archivos estáticos: permite servir archivos estáticos como imágenes, CSS, JS, etc.
app.use(express.static(path.join(__dirname, '..', 'public')))

// Conexion con la base de datos con mongoose
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('Error connecting to MongoDB Atlas', error);
});

// Middleware para parsear el body de las peticiones: permite poder recibir datos en formato JSON
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Middleware para servir archivos estáticos: permite servir archivos estáticos como imágenes, CSS, JS, etc.
app.use(express.static(path.join(__dirname, '..', 'public')))

/*
 * Configuración de rutas: importa las rutas
 * Si querés agregar nuevas rutas, acá tenes que importarlas y configurarlas
 */

// Ruta del Juego
app.use('/rooms', gamesRouter)

// Ruta de Preguntas
app.use('/questions', questionsRouter)

//Ruta de logica de jugadores
app.use('/players', playersRouter)

// Inicialización del servidor
server.listen(port, '0.0.0.0',() => {
  console.log(`Server is running on ${port}`)
})
