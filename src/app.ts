import { cc1101 } from './cc1101';

const spi = SPI1;
const csPin = NodeMCU.D8;

let cc: cc1101;

function main() {
  spi.setup({sck: NodeMCU.D5, miso: NodeMCU.D6, mosi: NodeMCU.D7});
  csPin.mode('output');

  cc = new cc1101(spi, csPin);
  cc.reset(()=> {
    console.log(cc.getVersion());

    cc.writeConfigRegister('IOCFG2', 0x02);
    console.log(cc.readConfigRegister('IOCFG2'));
  });
}

E.on('init', main);
