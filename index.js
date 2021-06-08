
const dgram = require('dgram');
const crypto = require('crypto');
const os = require('os');

const controller = new AbortController;

const interfaces = os.networkInterfaces();

const macAddresses = new Set;
for (const interface in interfaces) {
    if (!interface.startsWith('e')) continue;
    for (const info of interfaces[interface]) {
        if (info.internal) continue;
        //console.log(info);
        macAddresses.add(info.mac);
    }
}

const mac = String([... macAddresses][0].split(':').join(''));

const socket = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true,
    signal: controller.signal,
});

socket.on('message', (msg, rinfo) => {
    console.log('received message:', msg);
});

socket.bind({
    address: '0.0.0.0',
    port: 68,
}, () => {
    // bound
    const discoverId = Buffer.alloc(4);
    crypto.randomFillSync(discoverId);
    const secs = Buffer.alloc(2);
    const flags = Buffer.alloc(2);
    flags[0] = 0x80; // broadcast
    const clientMac = Buffer.from(mac, 'hex');
    console.log(clientMac);
    const macPad = Buffer.alloc(10);
    const pad = Buffer.alloc(192);
    const discover = Buffer.from([1, 1, 6, 0, ... discoverId, ... secs, ... flags, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ... clientMac, ... macPad, ... pad, 99, 130, 83, 99, 53, 1, 1, 255]);
    socket.setBroadcast(true);
    console.log(discover);
    socket.send(discover, 67, '255.255.255.255', (err) => {
        console.log(err);
    });
});

socket.on('error', (err) => {
    console.error(err);
});
