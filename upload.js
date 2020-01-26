const distDir = './dist/';
const bootScript = './firmware/dist/app.js';
const assets = [
  {name: 'index', path: './portal/dist/index.html'}
];

// ----

var esp = require('espruino');
var fs = require('fs');
//var sreplace = require('stream-replace');

function ensureDistDir() {
  if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
  }
}

/*async function pipeScript(ws, file) {
  await new Promise((resolve, reject) => {
    var stream = fs.createReadStream(file);
    stream
      .pipe(sreplace(/\n/g, '\\n'))
      .pipe(sreplace(/"/g, '\\"'))
      .pipe(ws, {end: false});
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve());
  });
}

async function pipeBootCode(ws, file) {
  ws.write('E.setBootCode("');
  await pipeScript(ws, file);
  ws.write('");\n');
}*/

async function pasteFile(ws, file) {
  await new Promise((resolve, reject) => {
    var offset = 0;
    var length = fs.statSync(file.path)['size'];
    ws.write('s.write("' + file.name + '", "", 0, ' + length + ');\n');
    var stream = fs.createReadStream(file.path, {highWaterMark: 32});
    stream.on('data', (chunk) => {
      ws.write('s.write("' + file.name + '", [');
      ws.write(chunk.join(', '));
      ws.write('], ' + offset + ');\n');
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
  ws.write('s.eraseAll();\n');
  await pasteFile(ws, {path: bootScript, name: '.boot1'});
  await pasteFiles(ws, assets);
  ws.end();
}

createFirmwareBundle().then(() => {
  console.log("Firmware written.");
  /*esp.init(() => {
    Espruino.Config.BAUD_RATE = 115200;
    Espruino.Config.BLUETOOTH_LOW_ENERGY = false;
  });*/
});
