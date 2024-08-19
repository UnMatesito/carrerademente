const socket = io(['http://localhost:3000', '0.0.0.0']);

const container = document.getElementById('container')
const invitation = document.getElementById('invitation')
const playerList = document.getElementById('players')
const beginButton = document.createElement("button")
const copyButton = document.getElementById("copyBtn")

const divButtons = document.getElementById("buttons")

const urlQuery = new URLSearchParams(window.location.search);
const code = urlQuery.get('gameID')

const page = window.location.pathname.split("/").pop()

if (code === null){
    window.location.href = `${window.location.origin}/`
}

beginButton.setAttribute('class', 'btn btn-primary');

window.addEventListener("DOMContentLoaded", () => {
    // Mostrar el codigo de invitacion
    invitation.innerHTML = `Codigo de Invitacion <br><span class="fs-1 bold">${code}</span>`
   
    //Guardarse el codigo de invitacion en la cache
    localStorage.setItem("invitationCode", code)
    
    // Emit para unirse al juego desde el lado del cliente
    socket.emit('joinRoom', { gameID: code, page: page });

    socket.emit('determineHost', { gameID: code })

    // Boton para copiar el codigo de invitacion
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(code);
            alert('Código de invitación copiado: ' + code);
        } catch (err) {
            console.error('Error al copiar el texto: ', err);
        }
    })

    socket.on('role', (data) => {
        if (data.host === socket.id){
            beginButton.textContent = "Empezar Juego!"
            beginButton.disabled = false
        } else {
            beginButton.textContent = "Esperando al host..."
            beginButton.disabled = true
        }
    })

    // Escuchar cuando actualizar a los jugadores del lado del cliente
    socket.on('updatePlayers', (data) => {
        if (data.gameID === code) {
            playerList.innerHTML = '' // Limpiar la lista antes de actualizar
            
            // Para cada jugador lo agrega a la ul
            Object.values(data.players).forEach(player => {
                const playerItem = document.createElement('li');
                const icon = document.createElement('i');
                icon.className = 'bi bi-person-fill';
                if (player.color === '#ffffff'){
                    icon.style.border = '#000000'
                } else {
                    icon.style.color = player.color; // Cambia el color del ícono
                }
                
                playerItem.innerHTML = `&nbsp;${player.name} `;
                playerItem.appendChild(icon);
                playerItem.setAttribute('class', 'fs-4')
                playerList.appendChild(playerItem);
            });

            // Si la cantidad de jugadores es mayor o igual determinado por la cantidad de jugadores agrega un boton de iniciar juego
            if (data.playerCount >= 2 && !document.body.contains(beginButton)){
                const div = document.createElement("div")
                div.setAttribute('class', 'col')
                divButtons.appendChild(div)
                div.appendChild(beginButton)
                beginButton.addEventListener("click", () => {
                    socket.emit('startGame', { gameID: code })
                })
            } else if (data.playerCount < 2 && document.body.contains(beginButton)){
                divButtons.removeChild(divButtons.lastChild)
            }
        }
    });

    // Escuchar cuando se inicia el juego
    socket.on('startGame', (data) => {
        //localStorage.setItem("gameID", data.gameID)
        window.location.href = data.site
    })
})
