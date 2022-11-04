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

const Console = require('./helper/Console.js');
new Console()

const socket = io('https://curl-chat-production.up.railway.app/');

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
                            let help = "Commands:\n/name=user_name (set name)\n/expose=0|1 (hide/show name)\n/whois=user_id (find by id)\n/online=id|name"
                            console.log(help);
                            run();
                        }
                    } else socket.emit('msg-from-client', msg, socket.id);
                } else socket.emit('msg-from-client', msg, socket.id);
            } else socket.emit('msg-from-client', msg, socket.id);
        } else socket.emit('msg-from-client', msg, socket.id);
    });
}

socket.on('verify', () => {
    rl.getRL().question("Welcome to Curl Chat!\n/help => see inbuilt commands\npress enter to continue...", msg => {
        socket.emit('verified')
    });
})

socket.on('connected', id => {
    console.log(`[${id}${socket.id == id ? '-you connectced]' : ' connected]'}`);
    run();
});

socket.on('msg-from-server', (msg, from) => {
    if (from != socket.id) console.log(`[${from}]: ${msg}`);
    run();
});

socket.on('user-found', (username, id) => {
    console.log(`[${id}: ${username}]`);
    run();
})

socket.on('online-found', (list, total) => {
    console.log(`(${total})[${list}]`);
    run();
})
socket.on('user-left', id => {
    console.log(`[${id} left]`);
    run();
})