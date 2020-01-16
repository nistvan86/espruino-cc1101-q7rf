import * as Wifi from 'Wifi';

function main() {
  console.log(Wifi.getIP());
}

E.on('init', main);
