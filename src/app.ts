import { cc1101, StatusRegister } from './cc1101';

const spi = SPI1;
const csPin = NodeMCU.D8;

let cc: cc1101;

function main() {
  spi.setup({sck: NodeMCU.D5, miso: NodeMCU.D6, mosi: NodeMCU.D7});
  csPin.mode('output');

  cc = new cc1101(spi, csPin);
  cc.reset(()=> {
    console.log(cc.readStatusRegister(StatusRegister.VERSION).toString(16));
  });
}

E.on('init', main);
