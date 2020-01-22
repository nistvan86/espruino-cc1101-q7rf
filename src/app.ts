import { Q7RF } from './q7rf';

const spi = SPI1;
const spiOpts = {sck: NodeMCU.D5, miso: NodeMCU.D6, mosi: NodeMCU.D7}
const csPin = NodeMCU.D8;

const thermostatAddr: number = parseInt('0x6ed5', 16);

let q7rf: Q7RF;
let heating: boolean = false;

function toggler() {
  heating = !heating;
  if (heating) {
    q7rf.turnOnHeating();
  } else {
    q7rf.turnOffHeating();
  }
  setTimeout(toggler, 5000);
}

function main() {
  spi.setup(spiOpts);
  csPin.mode('output');

  q7rf = new Q7RF(spi, csPin, thermostatAddr);

  q7rf.doPairing();
  console.log("Sent pairing code.");

  setTimeout(()=> {
    console.log("Starting toggler.");
    toggler();
  }, 1000);
}

E.on('init', main);
