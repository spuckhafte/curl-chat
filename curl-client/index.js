const { io } = require('socket.io-client')
const enc = require('encdenc');
const rl = require('serverline');
rl.init();
const Machine = new enc();

const internals = [
    "/name",
    "/expose",
    '/whois',
    '/online',
    "/help"
]

const Console = require('./helper/Console.js');
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
                            socket.emit('setName', Machine.encrypt(cmdResponse_RAW));
                            run();
                        }
                        if (cmdName == '/expose') {
                            if (cmdResponse == '0' || cmdResponse == '1') {
                                socket.emit('setExpose', Machine.encrypt(cmdResponse));
                                run();
                            } else socket.emit('msg-from-client', Machine.encrypt(msg), socket.id);
                        };
                        if (cmdName == '/whois') socket.emit('whois', cmdResponse_RAW);
                        if (cmdName == '/online') {
                            if (cmdResponse == 'id' || cmdResponse == 'name') socket.emit('online', Machine.encrypt(cmdResponse));
                            else socket.emit('msg-from-client', Machine.encrypt(msg), socket.id);
                        };
                        if (cmdName == '/help') {
                            let help = "Commands:\n/name=user_name (set name)\n/expose=0|1 (hide/show name)\n/whois=user_id (find by id)\n/online=id|name"
                            console.log(help);
                            run();
                        }
                    } else socket.emit('msg-from-client', Machine.encrypt(msg), socket.id);
                } else socket.emit('msg-from-client', Machine.encrypt(msg), socket.id);
            } else socket.emit('msg-from-client', Machine.encrypt(msg), socket.id);
        } else socket.emit('msg-from-client', Machine.encrypt(msg), socket.id);
    });
}

socket.on('verify', () => {
    rl.getRL().question("Welcome to Curl Chat!\n/help => see inbuilt commands\npress enter to continue...", _ => {
        socket.emit('verified')
    });
})

socket.on('connected', (id, password) => {
    console.log(`[${id}${socket.id == id ? '-you connectced]' : ' connected]'}`);
    password = JSON.parse(password);
    Machine.config = password;
    run();
});

socket.on('msg-from-server', (msg, from) => {
    msg = Machine.decrypt(msg);
    if (from != socket.id) console.log(`[${from}]: ${msg}`);
    run();
});

socket.on('user-found', (username, id) => {
    username = Machine.decrypt(username);
    console.log(`[${id}: ${username}]`);
    run();
})

socket.on('online-found', (list, total) => {
    list = Machine.decrypt(list);
    total = Machine.decrypt(total);
    console.log(`(${total})[${list}]`);
    run();
})
socket.on('user-left', id => {
    console.log(`[${id} left]`);
    run();
})