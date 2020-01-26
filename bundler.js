const distDir = './dist/';

const bootScript = './firmware/dist/app.js';
const assets = [
  {name: 'index', path: './portal/dist/index.html'}
];

// ----

var fs = require('fs');

function ensureDistDir() {
  if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
  }
}

async function pasteFile(ws, file) {
  await new Promise((resolve, reject) => {
    var name = file.name;
    var path = file.path;
    var binary = file.binary === true;

    var offset = 0;
    var length = fs.statSync(path)['size'];

    ws.write('console.log("Sending ' + name + '..");\n');
    var stream = fs.createReadStream(path, {highWaterMark: binary ? 64 : 256});
    stream.on('data', (chunk) => {
      ws.write('s.write("' + name + '", ');
      ws.write(binary ? '[' + chunk.join(',') + ']' : JSON.stringify(chunk.toString('utf-8')));
      ws.write(', ' + offset);
      ws.write(offset == 0 ? ', ' + length : '');
      ws.write(');\n');
      offset += chunk.length;
    });
    stream.on('end', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}

async function pasteFiles(ws, files) {
  for (const file of files) {
    await pasteFile(ws, file);
  }
}

async function createFirmwareBundle() {
  ensureDistDir();

  var ws = fs.createWriteStream(distDir + 'firmware.js');
  ws.write('var s = require("Storage");\n');
  ws.write('console.log("Erasing storage..");\n');
  ws.write('s.eraseAll();\n');
  await pasteFile(ws, {path: bootScript, name: '.boot1'});
  await pasteFiles(ws, assets);
  ws.write('E.reboot();\n');
  ws.end();
}

createFirmwareBundle().then(() => {
  console.log("Firmware file written.");
});
