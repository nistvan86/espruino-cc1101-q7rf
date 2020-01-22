import { cc1101, ConfigRegisterAssignment } from './cc1101';

const spi = SPI1;
const csPin = NodeMCU.D8;

let cc: cc1101;

const Q7RF_REGISTER_SETTINGS: ConfigRegisterAssignment = {
  FIFOTHR: 0x00, // TX FIFO length on max (61) others defaults
  PKTLEN: 0x3d, // Max 61 byte packets
  PKTCTRL1: 0x00, // Disable RSSI/LQ payload sending no address check
  PKTCTRL0: 0x01, // Variable packet length no CRC calculation
  FREQ2: 0x21, // FREQ2+FREQ1+FREQ0 = 0x216544 = 2.188.612 -> 26.000.000 Hz OSC / 2^16 * 2.188.650 ~= 868.285 MHz freq
  FREQ1: 0x65,
  FREQ0: 0x44,
  MDMCFG4: 0xF7,
  MDMCFG3: 0x6B, // 4.5kBaud, mantissa = 107 (MDMCFG3), exponent = 7 (MDMCFG4 lower 4 bits) baud = (((256+107) * 2^7)/2^28) * 26.000.000 ~= 4500 baud
  MDMCFG2: 0x30, // DC filter on, ASK/OOK modulation, no manchester coding no preamble/sync
  MDMCFG1: 0x00, // no FEC
  MDMCFG0: 0xF8, // channel spacing mantissa = 248 (MDMCFG0), exponent = 0 (MDMCFG1 last two bit) spacing = 26.000.000 / 2^18 * (256 + 248) * 2^0 = 49987 ~= 50kHz
  MCSM0: 0x10, // autocalibrate synthesizer when switching from IDLE to RX/TX state
  FOCCFG: 0x00, // ASK/OOK has no frequency offset compensation
  FREND0: 0x11 // ASK/OOK PATABLE (power level) settings = up to index 1, index[0] = transmitting 0 bit, index[1] = transmitting 1 bit
};

const THERMOSTAT_ON: Uint8Array = new Uint8Array([0xe3, 0xb6, 0xcb, 0x24, 0xb6, 0x4b, 0x64, 0x96, 0xd9, 0x24, 0x92, 0x4b, 0x6c, 0xb2, 0x4b, 0x64, 0xb6, 0x49, 0x6d, 0x92, 0x49, 0x24, 0x80,
  0xe3, 0xb6, 0xcb, 0x24, 0xb6, 0x4b, 0x64, 0x96, 0xd9, 0x24, 0x92, 0x4b, 0x6c, 0xb2, 0x4b, 0x64, 0xb6, 0x49, 0x6d, 0x92, 0x49, 0x24, 0x80]);

const THERMOSTAT_OFF: Uint8Array = new Uint8Array([0xe3, 0xb6, 0xcb, 0x24, 0xb6, 0x4b, 0x64, 0x96, 0xdb, 0x6d, 0x92, 0x4b, 0x6c, 0xb2, 0x4b, 0x64, 0xb6, 0x49, 0x6d, 0xb6, 0xd9, 0x24, 0x80,
  0xe3, 0xb6, 0xcb, 0x24, 0xb6, 0x4b, 0x64, 0x96, 0xdb, 0x6d, 0x92, 0x4b, 0x6c, 0xb2, 0x4b, 0x64, 0xb6, 0x49, 0x6d, 0xb6, 0xd9, 0x24, 0x80]);

const PA_TABLE = [0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] // +12dB max power setting

let heating: boolean = false;

function timed() {
  heating = !heating;
  if (heating) {
    cc.sendData(THERMOSTAT_ON);
  } else {
    cc.sendData(THERMOSTAT_OFF);
  }
  setTimeout(timed, 5000);
}

function main() {
  spi.setup({sck: NodeMCU.D5, miso: NodeMCU.D6, mosi: NodeMCU.D7});
  csPin.mode('output');

  cc = new cc1101(spi, csPin);
  cc.reset();
  cc.writeConfigRegisters(Q7RF_REGISTER_SETTINGS);
  cc.writePATable(PA_TABLE);

  console.log(cc.getVersion());
  timed();
}

E.on('init', main);
