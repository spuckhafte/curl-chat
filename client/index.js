const { io } = require('socket.io-client')
const rl = require('serverline');
rl.init();

const internals = [
    "/name",
    "/expose",
    '/whois',
    '/online',
    "/help"
]

const Console = require('./Console.js');
new Console()

const socket = io('http://localhost:3000');

function run() {
    rl.getRL().question("> ", msg => {
        if (msg.startsWith('/')) {
            if (msg.includes('=')) {
                const cmd = msg.split('=');
                if (cmd.length == 2) {
                    const cmdName = cmd[0].trim().toLowerCase();
                    const cmdResponse_RAW = cmd[1].trim();
                    const cmdResponse = cmd[1].trim().toLowerCase();
                    if (internals.includes(cmdName)) {
                        if (cmdName == '/name') {
                            socket.emit('setName', cmdResponse_RAW);
                            run();
                        }
                        if (cmdName == '/expose') {
                            if (cmdResponse == '0' || cmdResponse == '1') {
                                socket.emit('setExpose', cmdResponse);
                                run();
                            } else socket.emit('msg-from-client', msg, socket.id);
                        };
                        if (cmdName == '/whois') socket.emit('whois', cmdResponse_RAW);
                        if (cmdName == '/online') {
                            if (cmdResponse == 'id' || cmdResponse == 'name') socket.emit('online', cmdResponse);
                            else socket.emit('msg-from-client', msg, socket.id);
                        };
                        if (cmdName == '/help') {
                            let help = "/name=andrew (set name)\n/expose=0/1 (hide/show name)\n/whois=3c924923 (find by id)"
                        }
                    } else socket.emit('msg-from-client', msg, socket.id);
                } else socket.emit('msg-from-client', msg, socket.id);
            } else socket.emit('msg-from-client', msg, socket.id);
        } else socket.emit('msg-from-client', msg, socket.id);
    });
}

socket.on('connected', id => {
    run();
    console.log(`[${id}${socket.id == id ? '-you connectced]' : ' connected]'}`);
});

socket.on('msg-from-server', (msg, from) => {
    if (from != socket.id) console.log(`[${from}]: ${msg}`);
    run();
});

socket.on('user-found', (username, id) => {
    console.log(`[${id}: ${username}]`);
    run()
})

socket.on('online-found', (list, total) => {
    console.log(`(${total})[${list}]`);
    run();
})
socket.on('user-left', id => {
    console.log(`[${id} left]`);
    run();
})

async function input(t) {
    try {
        const answer = await rl.question(t);
        return answer;
    } catch (e) { null };
}