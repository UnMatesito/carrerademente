const newGame = document.getElementById('newGame')
const joinGame = document.getElementById('joinGame')
const inputSpace = document.getElementById('inputSpace')

newGameEvent()

newGame.addEventListener("change", function() {
    inputSpace.innerHTML = ''
    inputSpace.innerHTML = `
    <div class="col-8"> 
        <div class="input-group mb-3">
            <span class="input-group-text bg-dark text-white" id="basic-addon1">
                <i class="bi bi-person-circle"></i>
            </span>
            <div class="form-floating">
                <input type="text" name="user" id="userName" class="form-control">
                <label for="userName" class="text-primary">Nombre de Usuario</label>
            </div>
        </div>
    </div>
    <div class="col-4 mb-3" id="colorSelection">
        <label for="color" class="fs-1">Color</label>
        <input type="color" name="color" id="color" class="p-0" value="#ffffff">
    </div>
    <div class="row" id="buttonDiv">
        <button type="button" id="newGameButton" class="btn btn-success fs-1 p-3 shadow-sm">Crear Partida</button>
    </div>
    `
    newGameEvent()
})

joinGame.addEventListener("change", function() {
    const buttonDiv = document.getElementById('buttonDiv')
    buttonDiv.innerHTML = ''
    inputSpace.innerHTML = `
    <div class="col-8"> 
        <div class="input-group mb-3">
            <span class="input-group-text bg-dark text-white" id="basic-addon1">
                <i class="bi bi-person-circle"></i>
            </span>
            <div class="form-floating">
                <input type="text" name="user" id="userName" class="form-control">
                <label for="userName" class="text-primary">Nombre de Usuario</label>
            </div>
        </div>
    </div>
    <div class="col-4 mb-3" id="colorSelection">
        <label for="color" class="fs-1">Color</label>
        <input type="color" name="color" id="color" class="p-0" value="#ffffff">
    </div>
    <div class="row">
        <div class="input-group mb-3">
            <span class="input-group-text bg-dark text-white" id="basic-addon2">
                <i class="bi bi-envelope"></i>
            </span>
            <div class="form-floating">
                <input type="text" name="code" id="joinCode" class="form-control">
                <label for="code" class="text-primary">Ingrese un codigo de Invitacion</label>
            </div>
        </div>
    </div>
    `
    joinGameEvent()
})

function newGameEvent(){
    const newGameButton = document.getElementById('newGameButton')

    newGameButton.addEventListener("click", function() {
        const url = `${window.location.origin}/rooms/new`
    
        const data = {
            name: document.getElementById('userName').value,
            color: document.getElementById('color').value,
        }
        if(data.name === ''){
            alert('Ingrese un nombre de Jugador')
        } else {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => {
                return res.json();
            })
            .then(data => {
                window.location.href = `${window.location.origin}/room?gameID=${data.gameID}`;
            })
            .catch(error => {
                console.error(error)
            })
        }
    })
}

function joinGameEvent(){
    const joinGameButton = document.createElement('button')
    const div = document.createElement('div')
    div.className = 'row'
    joinGameButton.className = 'btn btn-success fs-1 p-3 shadow-sm'
    joinGameButton.innerHTML = 'Unirse a la Partida'
    div.appendChild(joinGameButton)
    inputSpace.appendChild(div.lastChild)

    joinGameButton.addEventListener("click", function() {
        const url = `${window.location.origin}/rooms/join`
    
        const data = {
            name: document.getElementById('userName').value,
            color: document.getElementById('color').value,
            gameID: document.getElementById('joinCode').value,
        }
    
        if(data.name === ''){
            alert('Ingrese un nombre de Jugador')
        } else {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(res => {
                if (res.status === 404){
                    alert('Juego No Encontrado');
                    return;
                }
                else {
                    return res.json();
                }
            })
            .then(data => {
                if (data !== undefined){
                    window.location.href = `${window.location.origin}/room?gameID=${data.gameID}`;
                }
            })
            .catch(error => {
                console.error(error);
            });
        }
    })
}

