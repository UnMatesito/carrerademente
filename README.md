<p>
<img src="https://github.com/UnMatesito/carrerademente.github.io/blob/main/public/img/logo.png" alt="gameLogo"></img>
</p>

---

Bienvenidos al repositorio de **Carrera de Mente** un juego de mesa diseñado en JavaScript con Node.js. El juego se basa en un tablero con 20 posiciones donde 2 o mas jugadores deberan competir contestando preguntas determinadas por un dado para decidir quien es el ganador de la *Carrera de Mente*.

## Requerimientos
Para poder jugar este juego, necesitarás:
- Node.js (Versión LTS)
- NPM (Viene instalado con Node.js)
- Visual Studio Code, para iniciar el servidor (opcional, se puede utilizar la terminal)

### Instalación de Node.js
Node.js es un entorno de ejecución para JavaScript este te permitirá iniciar el servidor para empezar a jugar.

#### Windows, Linux y macOS

Para instalar la versión LTS de Node.js, visita https://nodejs.org/ y descarga el instalador para tu sistema operativo. 
Sigue las instrucciones del instalador para completar la instalación.

Para verificar la instalación, abre una terminal y ejecuta:
```bash
node -v
npm -v
```
Estos comandos deberían mostrar las versiones de Node.js y NPM instaladas.

## Instalación de Dependencias
Las dependencias son librerías o paquetes de terceros que necesita el proyecto para ser completamente funcional

Abre una terminal en el directorio del juego y ejecuta:
```bash
npm install
```
Este comando leerá el archivo package.json del proyecto, descargará e instalará todas las dependencias listadas en él.

## Iniciar el servidor
Para iniciar el servidor para poder jugar, ejecuta este comando en la carpeta del juego desde la terminal:

```bash
npm start
```

Esto iniciará el servidor Express y nos habilitara a empezar a crear la partida y jugar con otras personas

>[!NOTE]
>Una vez el servidor esté corriendo, puedes acceder a la aplicación mediante http://localhost:3000 en tu navegador.

## Bugs Conocidos

- Al iniciar la partida por primera vez ocurre un error el array Players
- El sistema del primer turno funciona a veces incorrectamente (el GET request se ejecuta 2 veces, teniendo que ejecutarse una unica vez **siempre**)
- El boton de copiar codigo de invitacion solo funciona el localhost

## Comandos Disponibles
- `npm start`: Corre el juego en modo producción.
- `npm run dev`: Inicia el juego en modo desarrollo con live-reload, lo que significa que el servidor se reiniciará automáticamente cada vez que realices un cambio en el código.
- `npm run prettier`: Ejecuta Prettier para formatear el código según las convenciones establecidas, mejorando la legibilidad y consistencia.
