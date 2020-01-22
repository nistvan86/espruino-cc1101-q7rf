import { CC1101, ConfigRegisterAssignment, PATable } from './cc1101';

/* Each symbol takes 220us. Computherm/Delta Q7RF uses PWM modulation.
   Each data bit is encoded as 3 bit inside the buffer.
   001 = 1, 011 = 0, 111000111 = preamble (need to add manually, CC1101's sync word memory is only 8 bit long) */
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

const Q7RF_PA_TABLE: PATable = [0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; // +12dB max power setting

function encodeBits(data: number, padToBits: number): string {
  var result = [];
  var binary = data.toString(2);

  if (binary.length < padToBits) {
    for (let p=0; p < padToBits - binary.length; p++) result.push('011');
  }

  for (let b=0; b<binary.length; b++) {
    var digit = binary.charAt(b);
    result.push(digit == '1' ? '001' : '011');
  }
  return result.join('');
}

const Q7RFCommands = {
  heatingOn: 255,
  heatingOff: 15,
  pairing: 0
}

function getMessage(thermostatAddr: number, command: keyof typeof Q7RFCommands): number[] {
  var result = ['111000111']; // preamble, 9 bits
  var messagePart = [encodeBits(thermostatAddr, 16), encodeBits(8, 4), encodeBits(Q7RFCommands[command], 8)]; // 84 bits payload
  result = result.concat(messagePart).concat(messagePart); // 9 + 168 = 177 bits
  result.push('000'); // Total 180 bits

  result = result.concat(result) // Send whole message twice, total 360 bits = 45 bytes
  messagePart = undefined;

  var binaryMessage = result.join('');
  result = undefined;

  var byteArray: number[] = [];
  for (let b=0; b < 45; b++) {
    const offset = b * 8;
    const slice = binaryMessage.slice(offset, offset + 8);
    byteArray.push(parseInt(slice, 2));
  }
  return byteArray;
}

export class Q7RF {

  private pairingCmd: Uint8Array;
  private resendDelay: number;

  private cc: CC1101;

  private turnOnHeatingCmd: Uint8Array;
  private turnOffHeatingCmd: Uint8Array;

  private heating: boolean = undefined;
  private resendTimer: any = undefined;

  constructor(spi: SPI, cs: Pin, thermostatAddr: number, resendDelay: number = 30000) {
    this.pairingCmd = new Uint8Array(getMessage(thermostatAddr, 'pairing'));
    this.turnOnHeatingCmd = new Uint8Array(getMessage(thermostatAddr, 'heatingOn'));
    this.turnOffHeatingCmd = new Uint8Array(getMessage(thermostatAddr, 'heatingOff'));

    this.resendDelay = resendDelay;

    this.cc = new CC1101(spi, cs);
    this.cc.reset();

    console.log("Initialised CC1101 modem with version: " + this.cc.getVersion() + " partnum: " + this.cc.getPartnum());

    this.cc.writeConfigRegisters(Q7RF_REGISTER_SETTINGS);
    this.cc.writePATable(Q7RF_PA_TABLE);
  }

  private stopResendTimer() {
    if (this.resendTimer != undefined) clearTimeout(this.resendTimer);
  }

  private setupResendTimer() {
    this.resendTimer = setTimeout(this.tick, this.resendDelay);
  }

  private tick() {
    this.stopResendTimer();

    if (this.heating != undefined) {
      if (this.heating) this.cc.sendData(this.turnOnHeatingCmd)
      else this.cc.sendData(this.turnOffHeatingCmd);

      this.setupResendTimer();
    }
  }

  doPairing() {
    this.stopResendTimer();
    this.cc.sendData(this.pairingCmd);
    this.setupResendTimer();
  }

  turnOnHeating() {
    this.heating = true;
    this.tick();
  }

  turnOffHeating() {
    this.heating = false;
    this.tick();
  }

}
