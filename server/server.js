const http = require('http').createServer()
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const enc = require('encdenc');
const Machine = new enc();
const { v4 } = require('uuid')
require('dotenv').config();

Machine.config = JSON.parse(process.env.CONFIG);

const users = {}; // { "user_id": [username, exposed, room_id(null|id)] }
const rooms = {}; // { "room_id": { room_id, max, show(id|name), host, members[user_id] } }

io.on('connection', socket => {
    console.log(socket.id, 'connected');
    socket.emit('verify');

    socket.on('verified', () => {
        users[socket.id] = ['default_name', true, null]
        io.emit('connected', socket.id, `[${Machine.config.toString()}]`);
    })

    socket.on('msg-from-client', msg => { // msg -> already encerypted (client: enc(msg) => server => all_clients: dec(msg))
        let roomId = users[socket.id][2];
        let to = roomId ? 'room' : 'global';
        if (to == 'global') io.emit('msg-from-server', msg, socket.id, 'global');
        else io.to(roomId).emit('msg-from-server', msg, socket.id, 'room', rooms[roomId].show, Machine.encrypt(users[socket.id][0]));
    });
    socket.on('setName', name => {
        name = Machine.decrypt(name);
        if (users[socket.id][2] && rooms[users[socket.id][2]].show == 'name' && name == 'default_name') {
            socket.emit('set-name-fail', "[name can't be 'default_name' in 'name' type room]")
            return;
        }
        users[socket.id][0] = name;
    });
    socket.on('setExpose', expose => {
        expose = Machine.decrypt(expose);
        users[socket.id][1] = expose == 0 ? false : true;
    });
    socket.on('whois', id => {
        socket.emit('user-found',
            Machine.encrypt(users[id] ?
                users[id][1] ? socket.id == id ? `"${users[id][0]}"` : users[id][0]
                    : `HIDDEN`
                : `DNE`), id
        );
    });
    socket.on('online', (type, forRoom, id) => { // id -> roomId
        type = Machine.decrypt(type);
        if (forRoom) {
            id = Machine.decrypt(id);
            if (type == 'id') {
                const list = Machine.encrypt(rooms[id].members.map(userId => userId == socket.id ? `"${userId}"` : userId).toString()) // id
                socket.emit('online-found', list, Machine.encrypt(rooms[id].members.length.toString()));
            } else {
                let showType = rooms[id].show; //showtype of room
                let list;

                if (showType == 'id') list = Machine.encrypt(rooms[id].members.filter(userId => users[userId][1]).map(userId => userId == socket.id ? `"${users[userId][0]}"` : users[userId][0]).toString()); // name (hid)
                else list = Machine.encrypt(rooms[id].members.map(userId => userId == socket.id ? `"${users[userId][0]}"` : users[userId][0]).toString()); // name (unhid)
                socket.emit('online-found', list, Machine.encrypt(rooms[id].members.length.toString()));
            }
        } else {
            if (type == 'id') {
                const list = Machine.encrypt(Object.keys(users).map(userId => userId == socket.id ? `"${userId}"` : userId).toString());
                socket.emit('online-found', list, Machine.encrypt(Object.keys(users).length.toString()));
            } else {
                const list = Machine.encrypt(Object.keys(users).filter(userId => users[userId][1]).map(userId => userId == socket.id ? `"${users[userId][0]}"` : users[userId][0]).toString());
                socket.emit('online-found', list, Machine.encrypt(`${Object.keys(users).length}`));
            };
        }
    })

    socket.on('join-room', roomData => {
        roomData = JSON.parse(Machine.decrypt(roomData));
        let status = roomData.host ? 'create' : 'join';
        if (status == 'create') {
            rooms[roomData.id] = {
                ...roomData,
                count: 1,
                members: [roomData.joinee],
            };
            delete rooms[roomData.id].joinee;
            users[socket.id][2] = roomData.id;
            socket.join(roomData.id)
            io.to(roomData.id).emit('room-join', socket.id, roomData.show, Machine.encrypt(users[socket.id][0]));
        } else {
            if (!rooms[roomData.id]) {
                socket.emit('room-join-fail', 'ROOM DNE');
                return;
            }
            if (rooms[roomData.id].count == rooms[roomData.id].max) {
                socket.emit('room-join-fail', 'ROOM FULL');
                return;
            }
            if (rooms[roomData.id].show == 'name' && !roomData.nameSet) {
                socket.emit('room-join-fail', "for 'name' type room, /name should be defined");
                return;
            }
            rooms[roomData.id].count = rooms[roomData.id].count + 1;
            rooms[roomData.id].members.push(socket.id);
            users[socket.id][2] = roomData.id;
            socket.join(roomData.id);
            io.to(roomData.id).emit('room-join', socket.id, rooms[roomData.id].show, Machine.encrypt(users[socket.id][0]));
        };
    })

    socket.on('kick-user', async userId => {
        userId = Machine.decrypt(userId);
        const room = users[socket.id][2];
        if (!rooms[room].members.includes(userId)) {
            socket.emit('kick-fail', '[USER DNE]');
            return;
        };

        socket.to(room).emit('kick-from-client', userId);
    })

    socket.on('leave-room', (kick) => {
        const room = users[socket.id][2];
        if (room) {
            const wasHost = rooms[room].host == socket.id;
            if (wasHost) {
                socket.leave(room);
                socket.to(room).emit('host-left-room');
                io.in(room).socketsLeave(room);
                rooms[room].members.forEach(member => users[member][2] = null);
                delete rooms[room];
                socket.emit('you-left-room');
            } else {
                socket.leave(room);
                users[socket.id][2] = null;
                rooms[room].count = rooms[room].count - 1;
                rooms[room].members = rooms[room].members.filter(userId => userId != socket.id);
                socket.to(room).emit('member-left-room', socket.id, Machine.encrypt(rooms[room].show == 'name' ? users[socket.id][0] : 'default_name'));
                if (kick) socket.emit('you-left-room', 'kick');
                else socket.emit('you-left-room');
            };
        };
    });

    socket.on('disconnecting', () => {
        if (!users[socket.id]) return;
        const room = users[socket.id][2];
        if (room) {
            const wasHost = rooms[room].host == socket.id;
            if (wasHost) {
                socket.to(room).emit('host-left-room');
                io.in(room).socketsLeave(room);
                delete rooms[room];
            } else {
                socket.to(room).emit('member-left-room', socket.id, Machine.encrypt(rooms[room].show == 'name' ? users[socket.id][0] : 'default_name'));
                rooms[room].count = rooms[room].count - 1;
                rooms[room].members = rooms[room].members.filter(userId => userId != socket.id);
            };
        };
    })

    socket.on('disconnect', () => {
        if (!users[socket.id]) return;
        delete users[socket.id];
        io.emit('user-left', socket.id);
    });
})

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(PORT + '*'));

