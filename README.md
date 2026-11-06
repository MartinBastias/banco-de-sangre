# banco-de-sangre

## requisitos previos

como requisitos previos para ejecutar el proyecto necesitan tener instalados: 

- **node.js**
- **git bash** (personalmente lo estoy usando como terminal en windows, en linux funciona exactamente igual)

## configuración inicial

en la terminal clonen el proyecto y entren en la carpeta.

- `git clone https://github.com/MartinBastias/banco-de-sangre.git`

- `cd banco-de-sangre`

ingresen a la carpeta del frontend e instalen las dependencias y vuelvan atrás.

- `cd frontend`
- `npm install`
- `cd ..`

entren al backend, instalen todo y vuelvan atrás.
- `cd backend`
- `npm install`
- `cd ..`

## para levantar el proyecto (cada vez que vayan a trabajar)

### para el frontend

- `cd frontend`
- `npm run dev` para encender el server (tienen que hacer clic en el link localhost que sale en la terminal para ver la app en el navegador).

### para el backend (abran una terminal nueva para no cerrar el frontend)

- `cd backend`
- `node index.js`