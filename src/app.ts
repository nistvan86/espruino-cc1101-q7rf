import { cc1101 } from './cc1101';

function main() {
  let cc = new cc1101(SPI1, NodeMCU.D8);
  cc.reset(function() {
    console.log(cc.readReg(0xf1));
  });
}

E.on('init', main);
