const http = require('http').createServer()
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

const users = {};

io.on('connection', socket => {
    console.log(socket.id, 'connected');
    socket.emit('verify');

    socket.on('verified', () => {
        users[socket.id] = ['default_name', true] // username, exposed?
        io.emit('connected', socket.id);
    })

    socket.on('msg-from-client', msg => {
        io.emit('msg-from-server', msg, socket.id)
    });
    socket.on('setName', name => {
        users[socket.id][0] = name;
    });
    socket.on('setExpose', expose => {
        users[socket.id][1] = expose == 0 ? false : true;
    });
    socket.on('whois', id => {
        socket.emit('user-found',
            users[id] ?
                users[id][1] ? socket.id == id ? `"${users[id][0]}"` : users[id][0]
                    : `HIDDEN`
                : `DNE`, id
        );
    });
    socket.on('online', type => {
        if (type == 'id') {
            const list = Object.keys(users).map(id => id == socket.id ? `"${id}"` : id).toString();
            socket.emit('online-found', list, Object.keys(users).length);
        } else {
            const list = Object.keys(users).filter(id => users[id][1]).map(id => id == socket.id ? `"${users[id][0]}"` : users[id][0]).toString();
            socket.emit('online-found', list, Object.keys(users).length);
        };
    })

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user-left', socket.id);
    })
})

const PORT = process.env.PORT || 3000
http.listen(PORT, () => console.log(PORT + '*'));

