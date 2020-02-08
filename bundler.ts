const distDir = './dist/';

const storageAssets = [
  {name: '.boot0', path: './config.js'},
  {name: '.bootcde', path: './firmware/dist/app.js'},
  {name: 'tinyMQTT', path: './firmware/modules/tinyMQTT.min.js'}
];

// ----
import * as fs from 'fs';

function ensureDistDir() {
  if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
  }
}

interface AssetFile {
  name: string
  path: string
}

async function pasteFile(ws: fs.WriteStream, file: AssetFile) {
  await new Promise((resolve, reject) => {
    var name = file.name;
    var path = file.path;

    var offset = 0;
    var length = fs.statSync(path)['size'];

    ws.write('console.log("Sending ' + name + '..");\n');
    var stream = fs.createReadStream(path, {highWaterMark: 256});
    stream.on('data', (chunk) => {
      ws.write('s.write("' + name + '", ');
      ws.write(JSON.stringify(chunk.toString('utf-8')));
      ws.write(', ' + offset);
      ws.write(offset == 0 ? ', ' + length : '');
      ws.write(');\n');
      offset += chunk.length;
    });
    stream.on('end', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}

async function pasteFiles(ws: fs.WriteStream, files: AssetFile[]) {
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
  await pasteFiles(ws, storageAssets);
  ws.write('E.reboot();\n');
  ws.end();
}

createFirmwareBundle().then(() => {
  console.log("Firmware file written.");
});
