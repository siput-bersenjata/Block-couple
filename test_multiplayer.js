const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function runTest() {
  console.log('--- STARTING MULTIPLAYER TEST ---');

  const socket1 = io(SERVER_URL);
  const socket2 = io(SERVER_URL);

  await new Promise((resolve) => socket1.on('connect', resolve));
  await new Promise((resolve) => socket2.on('connect', resolve));
  console.log('✓ Both sockets connected successfully.');

  // Test 1: Ping
  const pingStart = Date.now();
  await new Promise((resolve) => {
    socket1.emit('client-ping', pingStart, (clientTime, serverTime) => {
      const ping = Date.now() - clientTime;
      console.log(`✓ Ping test passed: ${ping} ms`);
      resolve();
    });
  });

  // Test 2: Create room with 6-digit numeric code
  let roomCode = null;
  await new Promise((resolve) => {
    socket1.emit('create-room', { isPublic: false, username: 'Bram' }, (res) => {
      if (!res || !res.success) throw new Error('Create room failed');
      roomCode = res.code;
      console.log(`✓ Room created with code: ${roomCode} (Slot ${res.slot})`);
      if (!/^\d{6}$/.test(roomCode)) {
        throw new Error(`Room code ${roomCode} is NOT a 6-digit numeric code!`);
      }
      console.log('✓ Room code verified as exact 6-digit numeric string.');
      resolve();
    });
  });

  // Test 3: Join room with 6-digit code
  await new Promise((resolve) => {
    socket2.emit('join-room', { code: roomCode, username: 'Partner' }, (res) => {
      if (!res || !res.success) throw new Error('Join room failed: ' + res.error);
      console.log(`✓ Partner joined room ${roomCode} as Slot ${res.slot}`);
      resolve();
    });
  });

  // Test 4: Block creation sync
  await new Promise((resolve) => {
    socket2.on('block-created', (block) => {
      console.log(`✓ Block sync received by partner: id=${block.id}, color=${block.color}`);
      resolve();
    });
    socket1.emit('create-block', { x: 100, y: 300, width: 36, height: 36 });
  });

  // Test 5: Defeat enemy sync
  await new Promise((resolve) => {
    socket2.on('enemy-defeated', (data) => {
      console.log(`✓ Enemy defeat sync received by partner: id=${data.enemyId}`);
      resolve();
    });
    socket1.emit('defeat-enemy', { enemyId: 'en1_1' });
  });

  socket1.disconnect();
  socket2.disconnect();
  console.log('🎉 ALL MULTIPLAYER TESTS PASSED 100%!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

