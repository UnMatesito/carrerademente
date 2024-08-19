// Conexion con socket.io en el cliente
const socket = io()

// Obtener el gameID del query del URL
const urlQuery = new URLSearchParams(window.location.search);
const gameID = urlQuery.get('gameID')

const page = window.location.pathname.split("/").pop()

// Si no hay gameID, redirigir al inicio
if (gameID === null){
    window.location.href = `${window.location.origin}/`
}

let currentPlayerFront;
let interval

// Conectar al servidor de socket.io
socket.on('connect', () => { 
    // Unirse a un juego
    socket.emit('joinGame', { id: socket.id, gameID: gameID, page: page });

    // Escuchar los roles de los jugadores
    socket.on('role', (data) => {
        if (data.host === socket.id){
            //Determina a quien le toca primero
            fetch(`http://localhost:3000/players/turn?idG=${gameID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(res => res.json())
            .then(data => {
                currentPlayerFront = { name: data.name, id: data.id }
                localStorage.setItem('currentPlayer', currentPlayerFront.name)
                socket.emit('sendCurrentPlayer', { gameID: gameID, player: currentPlayerFront});
            })
            .catch(error => {
                console.error(error)
            })
        }
    })
})

// Elementos del DOM
const diceButton = document.getElementById('buttonDice')

const questionsZone = document.getElementById('questionsZone')

const playerDiv = document.getElementById('player')

const timeDiv = document.getElementById('time')

const question1 = document.getElementById('question1')
const question2 = document.getElementById('question2')
const question3 = document.getElementById('question3')

const progress = document.createElement('div')
progress.setAttribute('class', 'progress')
progress.innerHTML = `<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>`

const timeLeft = document.createElement('p')
timeLeft.setAttribute('class', 'timeLeft')

const answerDiv = document.getElementById('answer')

// Tipos de preguntas
const questionType = {
    1: 'Matematicas',
    2: 'Ciencia',
    3: 'Historia',
    4: 'Arte',
    5: 'Deportes',
    6: 'Entretenimiento',
}

// Colores de los tipos de preguntas
const questionTypeColor = {
    1: '#f05b29',
    2: '#f79e35',
    3: '#4a7dff',
    4: '#80220e',
    5: '#448839',
    6: '#ed1e79',
}

// Deshabilitar el boton de tirar el dado y las preguntas
diceButton.disabled = true;
questionsZone.style.pointerEvents = 'none'

// Event listener del boton de tirar el dado que invoca a obtener una pregunta
diceButton.addEventListener('click', () => {
    currentPlayerFront = getCurrentPlayer()
    if (currentPlayerFront === getCurrentPlayer()) {
        timeDiv.innerHTML = ''
        diceButton.disabled = true;
        getQuestion(currentPlayerFront, gameID);
    }
})

// Event listener de las opciones de la pregunta
question1.addEventListener('click', () => {
    handleAnswer('option1')
})

question2.addEventListener('click', () => {
    handleAnswer('option2')
})

question3.addEventListener('click', () => {
    handleAnswer('option3')
})

// Manejar la respuesta del jugador
function handleAnswer(option){
    const player = getCurrentPlayer()
    if (player === getCurrentPlayer()){
        questionsZone.style.pointerEvents = 'none'
        socket.emit('clearTimer', {gameID: gameID})
        answerQuestion(player, gameID, option)
    }
}

// Asigna al sistema de turnos el jugador que le toca
function playerTurn(name){
    const turns = document.getElementById('turns')
    turns.textContent = `Turno de Jugador ${name}`
}

//Colorear a cada jugador en la primera casilla
firstCell(gameID)

// Obtener los jugadores de la partida
function getPlayers(gameID){
    return fetch(`http://localhost:3000/players/?idG=${gameID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            throw error;
        });
}

// Renderizar a los jugadores en la primera casilla
function firstCell(gameID){
    getPlayers(gameID)
        .then(players => {
            const start = document.getElementById('0');
            players.forEach(player => {
                const playerCell = document.createElement('div');
                renderPlayer(playerCell, player);
                start.appendChild(playerCell);
            });
        })
        .catch(error => {
            console.error('Error in firstCell:', error);
        });
}

// Obtener el jugador actual de la cache
function getCurrentPlayer(){
    return localStorage.getItem('currentPlayer')
}

// Iniciar el timer
function startTimer(maxtime) {
    let time = 0;
    interval = setInterval(() => {
        if (time >= maxtime) {
            clearInterval(interval);
            answerQuestion(currentPlayerFront, gameID, 'wrong');
        } else {
            time += 1;
            timeLeft.textContent = `Tiempo restante: ${maxtime - time} seg.`;
            progress.innerHTML = `<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${(time / maxtime) * 100}%;" aria-valuenow="${(time / maxtime) * 100}" aria-valuemin="0" aria-valuemax="100"></div>`;
        }
    }, 1000);
}

// Renderizar al jugador en la casilla
function renderPlayer(cell, player){
    cell.style.backgroundColor = player.color
    cell.setAttribute('class', `${player.name} player`)
    cell.style.width = '100px'
    cell.style.height = '100px'
    cell.style.display = 'flex'
    cell.style.justifyContent = 'center'
    cell.style.alignItems = 'center'
    cell.textContent = player.name;
    if (player.color === '#000000'){
        cell.style.color = 'white'
        cell.style.border = '2px solid #ffffff'
    } else {
        cell.style.color = 'black'
        cell.style.border = '2px solid black'
    }
    cell.style.fontSize = '20px'
    cell.style.textAlign = 'center'
    cell.style.padding = '10px'
}

// Renderizar la pregunta en la interfaz de usuario
function renderQuestion(data){
    answerDiv.innerHTML = ''
    timeDiv.innerHTML = ''

    // Renderizar el tipo y color del dado
    const type = document.getElementById('type')
    type.textContent = questionType[data.type]
    const dice = document.getElementById('dice')
    dice.style.backgroundColor = questionTypeColor[data.type]

    // Renderizar la pregunta
    const question = document.getElementById('textQuestion')
    question.textContent = data.question
    
    // Renderizar las opciones de la pregunta
    question1.textContent = data.option1
    question2.textContent = data.option2
    question3.textContent = data.option3

    // Renderizar el tiempo
    timeDiv.appendChild(progress)
    timeDiv.appendChild(timeLeft)

    const response = document.createElement('p')
    response.setAttribute('class', 'fs-3 text-black')
    response.textContent = 'Respuesta'
    response.style.fontWeight = 'bold'
    answerDiv.appendChild(response)

    const spinner = document.createElement('div')
    spinner.setAttribute('class', 'spinner-border text-primary')
    spinner.setAttribute('role', 'status')
    spinner.innerHTML = `<span class="visually-hidden">Loading...</span>`
    spinner.style.margin = 'auto'
    answerDiv.appendChild(spinner)

    // Iniciar el timer
    startTimer(30)
}

// Obtener una pregunta del servidor
function getQuestion(player, gameID){
    questionsZone.style.pointerEvents = 'auto'
    fetch(`http://localhost:3000/questions/throwQuestion?name=${player}&idG=${gameID}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then(data => {
        socket.emit('newQuestion', {question: data, player: player, gameID: gameID})
    })
    .catch(error => {
        console.error(error)
    })
}

// Determina si la respuesta es correcta o incorrecta y actualiza el tablero
function answerQuestion(player, gameID, answer){
    fetch(`http://localhost:3000/questions/responseQuestion?idG=${gameID}&name=${player}&answer=${answer}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then(data => {
        if (data.response === 'correct'){
            //Correcto
            
            socket.emit('answer', {gameID: gameID, response: 'correct'})

            socket.emit('blockButtons', {gameID: gameID})

            if (data.points === 20){
                //Ganó
                alert('Gano el jugador: ' + data.player.name)
                localStorage.removeItem('currentPlayer')
                socket.emit('endGame', {gameID: gameID , player: data.player})
            } else {
                //Avanzar de casilla
                socket.emit('updatePlayerPosition', {
                    player: data.player,
                    points: data.points,
                    gameID: gameID,
                });
            }
        } else if (data.response === 'incorrect') {
            //Incorrecto
            socket.emit('answer', {gameID: gameID, response: 'incorrect'})

            socket.emit('nextTurn', {gameID: gameID})
        }
    })
    .catch(error => {
        console.error(error)
    })
}

// Escuchar eventos del servidor

// Actualizar la pregunta en la interfaz de usuario
socket.on('updateQuestion', (data) => {
    // Actualizar la interfaz de usuario con la pregunta
    renderQuestion(data.question);
});

// Actualizar la interfaz de usuario con la nueva posicion del jugador
socket.on('updatePlayerPosition', (data) => {
    //Crear un div con el nombre del jugador y su color
    const playerCell = document.createElement('div')
    renderPlayer(playerCell, data.player)

    //Eliminar el div del jugador en la casilla anterior
    const previousCell = document.getElementById(`${data.points - 1}`)
    const playerToRemove = previousCell.querySelector(`.${data.player.name}`);
    if (playerToRemove) {
        previousCell.removeChild(playerToRemove);
    }

    //Agregar el div del jugador en la nueva casilla
    const cell = document.getElementById(`${data.points}`)
    cell.appendChild(playerCell)

    socket.emit('blockButtons', {gameID: gameID})

})

// Actualizar el jugador actual en la interfaz de usuario
socket.on('sendCurrentPlayer', (data) => {
    if (data.id === socket.id){
        diceButton.disabled = false
    } else {
        diceButton.disabled = true
    }
    playerTurn(data.player)
})

//Limpiar el timer para todos los jugadores
socket.on('clearTimer', () => {
    clearInterval(interval)
    timeDiv.innerHTML = ''
})

// Actualizar el tablero con el nuevo jugador actual
socket.on('getCurrentPlayer', (data) => {
    currentPlayerFront = { name: data.name, id: data.id }
    localStorage.setItem('currentPlayer', currentPlayerFront.name)
    socket.emit('sendCurrentPlayer', { gameID: gameID, player: currentPlayerFront});
})

//Bloquear el boton para tirar el dado
socket.on('blockedButtons', () => {
    if (currentPlayerFront === getCurrentPlayer()){
        diceButton.disabled = false;
    } else {
        diceButton.disabled = true;
    }
})

// Actualizar el tablero con la respuesta correcta
socket.on('correctAnswer', () => {
    answerDiv.innerHTML = ''
    answerDiv.setAttribute('class', 'text-success')

    answerDiv.innerHTML =   `<p style="font-weight: bold" class="fs-3">Respuesta</p> 
                            <p class="fs-2">Correcta</p>`

})

// Actualizar el tablero con la respuesta incorrecta
socket.on('incorrectAnswer', () => {
    answerDiv.innerHTML = ''
    answerDiv.setAttribute('class', 'text-danger')

    answerDiv.innerHTML = `<p style="font-weight: bold" class="fs-3">Respuesta</p> 
                            <p class="fs-2">Incorrecta</p>`
})

// Actualizar el tablero con el ganador
socket.on('cleanBoard', (data) => {
    const gameDiv = document.getElementById('game')
    gameDiv.innerHTML = ''
    gameDiv.setAttribute('class', 'container confetti')
    const confetti1 = document.createElement('img')
    confetti1.setAttribute('src', '/img/confetti1.gif')
    gameDiv.appendChild(confetti1)
    const container = document.createElement('div')
    container.setAttribute('class', 'container text-center trophy center')
    const trophy = document.createElement('img')
    trophy.setAttribute('src', '/img/trophy.png')
    container.appendChild(trophy)
    const h1 = document.createElement('h1')
    h1.textContent = `${data.winner}`
    h1.setAttribute('class', 'fs-1 text-light winner')
    container.appendChild(h1)
    const h2 = document.createElement('h2')
    h2.textContent = '¡Ganó la partida!'
    h2.setAttribute('class', 'fs-2 text-light')
    container.appendChild(h2)
    const thanks = document.createElement('p')
    thanks.textContent = 'Gracias por jugar!'
    thanks.setAttribute('class', 'fs-4 text-light')
    container.appendChild(thanks)
    const back = document.createElement('button')
    back.textContent = 'Volver al inicio'
    back.setAttribute('class', 'btn btn-primary')
    back.addEventListener('click', () => {
        window.location.href = `${window.location.origin}/`
    })
    container.appendChild(back)
    gameDiv.appendChild(container)
    const confetti2 = document.createElement('img')
    confetti2.setAttribute('src', '/img/confetti2.gif')
    confetti2.setAttribute('class', 'flip')
    gameDiv.appendChild(confetti2)
})

window.addEventListener("beforeunload", function (e) {
    // Mensaje que se mostrará en el cuadro de diálogo de confirmación.
    var message = "¿Seguro que quieres salir de esta página? Se perderán todos los cambios no guardados.";

    window.location.href = `${window.location.origin}/`
    
    // Esto es necesario para que algunos navegadores muestren el mensaje.
    e.preventDefault();
    e.returnValue = message;

    // Para navegadores más antiguos
    return message;
});