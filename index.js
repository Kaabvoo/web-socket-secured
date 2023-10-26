const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const authUsers = require("./deviceId.json");

function onSocketError(err) {
    console.error(err);
}

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, request) => {
    ws.on('error', console.error);

    ws.send(`¡Conexión exitosa! Bienvenido ${ws.name}.`);

    ws.on('message', function message(data) {
        wss.clients.forEach(x => {
            if (x.id !== ws.id) {
                x.send(data.toString());
            }
        })
        console.log(`Mensaje de ${ws.name}: ${data}`);
    });

    ws.on('close', (code, error) => {
        console.log(`Desconeccion de ${ws.name}\nCodigo: ${code}\nRazon de salida: ${error}`);
    });
});

server.on('upgrade', (request, socket, head) => {
    socket.on('error', onSocketError);

    // This function is not defined on purpose. Implement it with your own logic.
    const searchParam = new URLSearchParams(request.url.slice(2))

    var wasIdFound = false;
    wss.clients.forEach(x => {
        if (x.id === searchParam.get('id') && !wasIdFound) {
            wasIdFound = true;
        }
    });

    if (!searchParam.get('id') && !authUsers["registeredDevices"].find(x => x.id === searchParam.get('id')) || wasIdFound) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    socket.removeListener('error', onSocketError);

    wss.handleUpgrade(request, socket, head, (ws) => {
        ws.name = authUsers["registeredDevices"].find(x => x.id.includes(searchParam.get('id'))).name;
        ws.id = authUsers["registeredDevices"].find(x => x.id.includes(searchParam.get('id'))).id;
        console.log(`${ws.name} autenticado`);
        wss.emit('connection', ws, request);
    });
});

server.listen(6162);