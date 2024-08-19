import express, { response } from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import questionModel from '../database/models/questions.js'
import gameModel from '../database/models/game.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

router.get('/throwQuestion', async (req, res) => {
    const game = await gameModel.findOne({gameID: req.query.idG})
    if (game.start == true){
        // Comprobar que es el turno del jugador que pidio tirar el dado
        const indexPlayer = game.players.findIndex(player => player.name === req.query.name);
        if (game.turn == indexPlayer){
            // Es el turno
            
            // Restringir que pueda tirar el dado de nuevo
            if (game.diced) {
                console.log('Ya se tiro el dado')
            } else {
                game.diced = true;
                await game.save()
                // comprobar que no se haya hecho la pregunta en el juego
                let question;
                let QuestionNumber;
                // Cada numero es una categoria de pregunta
                let typeNumber = Math.floor(Math.random() * 6)+1; // Numero random del 1 al 6
                do {
                
                // Se tiran 2 dados para seleccionar la pregunta
                let value1 = Math.floor(Math.random() * 6)+1; // Numero random del 1 al 6
                let value2 = Math.floor(Math.random() * 6)+1; // Numero random del 1 al 6
                let concatenatedString = `${value1}${value2}`;
                QuestionNumber = parseInt(concatenatedString, 10);

                // Buscar la pregunta en el array de preguntas
                question = game.answeredQuestions.find(question => ((question.id == QuestionNumber) && (question.type == typeNumber)))
                } while (question)
                
                // Buscar la pregunta con ese numero
                // Entregar solo la pregunta y las opciones, la respuesta no se debe entregar
                questionModel.find({type: typeNumber, id: QuestionNumber}).lean().then( async (pregunta) => {
                    if (pregunta.length > 0) {
                        
                        // cambiar la pregunta actual en el juego y guardar la pregunta en el array
                        game.question = pregunta[0]
                        game.answeredQuestions.push(pregunta[0])
                        await game.save()

                        // elimino la respuesta y la id de la pregunta
                        delete pregunta[0].correct;
                        delete pregunta[0]._id;
                        res.json(pregunta[0]);
                    } else {
                        console.error('No se encontró ninguna pregunta con esos criterios.');
                        res.status(404).json({message: 'No se encontró ninguna pregunta con esos criterios.'});
                    }
                }).catch((err) => {
                    console.error('Error al buscar la pregunta:', err);
                    res.status(500).json({error: 'Error al buscar la pregunta.'});
                });
            }     
        } else { // no es el turno de él
            res.status(400).json({message : 'No es tu turno'})
        }
    } else { // no empezo el juego
        res.status(400).json({message : 'No empezo el juego'})
    }

})

router.get('/responseQuestion', async (req, res) => { // gameID,playerID,response(optionX)
    const game = await gameModel.findOne({ gameID: req.query.idG })
    if (game.start){
        // Comprobar que es el turno del jugador que responde
        const indexPlayer = game.players.findIndex(player => player.name === req.query.name);
        if (game.turn == indexPlayer){
            // Es el turno
            if (req.query.answer === game.question.correct){
                
                console.log('Correcto')

                game.players[indexPlayer].points++
                game.diced = false
                await game.save()


                res.send({response: 'correct' , points: game.players[indexPlayer].points, player : game.players[game.turn]})

            } else { // respondio mal
                console.log('Incorrecto')
                
                game.diced = false

                //suma uno al turno o vuelve a empezar
                game.turn++
                if (game.turn >= game.players.length){
                    game.turn = 0
                }
                await game.save()

                res.send({response: 'incorrect' , player: game.players[game.turn]})
            }
        } else { // no es el turno de él
            res.status(404).json({message : 'No es tu turno'})
        }
    } else { // no empezo el juego
        res.status(404).json({message : 'No empezo el juego'})
    }
})

export default router