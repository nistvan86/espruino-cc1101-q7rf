export type PATable = [number, number, number, number, number, number, number, number];

export const CONFIG_REGISTERS = {
  IOCFG2: 0x00,
  IOCFG1: 0x01,
  IOCFG0: 0x02,
  FIFOTHR: 0x03,
  SYNC1: 0x04,
  SYNC0: 0x05,
  PKTLEN: 0x06,
  PKTCTRL1: 0x07,
  PKTCTRL0: 0x08,
  ADDR: 0x09,
  CHANNR: 0x0a,
  FSCTRL1: 0x0b,
  FSCTRL0: 0x0c,
  FREQ2: 0x0d,
  FREQ1: 0x0e,
  FREQ0: 0x0f,
  MDMCFG4: 0x10,
  MDMCFG3: 0x11,
  MDMCFG2: 0x12,
  MDMCFG1: 0x13,
  MDMCFG0: 0x14,
  DEVIATN: 0x15,
  MCSM2: 0x16,
  MCSM1: 0x17,
  MCSM0: 0x18,
  FOCCFG: 0x19,
  BSCFG: 0x1a,
  AGCCTRL2: 0x1b,
  AGCCTRL1: 0x1c,
  AGCCTRL0: 0x1d,
  WOREVT1: 0x1e,
  WOREVT0: 0x1f,
  WORCTRL: 0x20,
  FREND1: 0x21,
  FREND0: 0x22,
  FSCAL3: 0x23,
  FSCAL2: 0x24,
  FSCAL1: 0x25,
  FSCAL0: 0x26,
  RCCTRL1: 0x27,
  RCCTRL0: 0x28,
  FSTEST: 0x29,
  PTEST: 0x2a,
  AGCTEST: 0x2b,
  TEST2: 0x2c,
  TEST1: 0x2d,
  TEST0: 0x2e
};

export type ConfigRegister = keyof typeof CONFIG_REGISTERS;
export type ConfigRegisterAssignment = { [reg in ConfigRegister]?: number};

export const STATUS_REGISTERS = {
  PARTNUM: 0xf0,
  VERSION: 0xf1,
  FREQEST: 0xf2,
  LQI: 0xf3,
  RSSI: 0xf4,
  MARCSTATE: 0xf5,
  WORTIME1: 0xf6,
  WORTIME0: 0xf7,
  PKTSTATUS: 0xf8,
  VCO_VC_DAC: 0xf9,
  TXBYTES: 0xfa,
  RXBYTES: 0xfb,
  RCCTRL1_STATUS: 0xfc,
  RCCTRL0_STATUS: 0xfd
};

export type StatusRegister = keyof typeof STATUS_REGISTERS;

export const DEFAULT_CONFIG_868MHZ: ConfigRegisterAssignment = {
  IOCFG2: 0x29,
  IOCFG1: 0x2e,
  IOCFG0: 0x06,
  FIFOTHR: 0x47,
  SYNC1: 0xd3,
  SYNC0: 0x91,
  PKTLEN: 0x12,
  PKTCTRL1: 0x04,
  PKTCTRL0: 0x00,
  ADDR: 0x11,
  CHANNR: 0x00,
  FSCTRL1: 0x06,
  FSCTRL0: 0x00,
  FREQ2: 0x21,
  FREQ1: 0x62,
  FREQ0: 0x76,
  MDMCFG4: 0xe5,
  MDMCFG3: 0xc3,
  MDMCFG2: 0x30,
  MDMCFG1: 0x22,
  MDMCFG0: 0xf8,
  DEVIATN: 0x15,
  MCSM2: 0x07,
  MCSM1: 0x30,
  MCSM0: 0x18,
  FOCCFG: 0x16,
  BSCFG: 0x6c,
  AGCCTRL2: 0x03,
  AGCCTRL1: 0x00,
  AGCCTRL0: 0x91,
  WOREVT1: 0x87,
  WOREVT0: 0x6b,
  WORCTRL: 0xfb,
  FREND1: 0x56,
  FREND0: 0x11,
  FSCAL3: 0xe9,
  FSCAL2: 0x2a,
  FSCAL1: 0x00,
  FSCAL0: 0x1f,
  RCCTRL1: 0x41,
  RCCTRL0: 0x00,
  FSTEST: 0x59,
  PTEST: 0x7f,
  AGCTEST: 0x3f
};

export class CC1101 {
  spi: SPI;
  cs: Pin;

  constructor(spi: SPI, cs: Pin) {
    this.spi = spi;
    this.cs = cs;
  }

  private sendCmd(cmd: number) {
    this.cs.write(false);
    this.spi.write(cmd);
    this.cs.write(true);
  }

  private readRegister(reg: number): number {
    let result: Uint8Array = this.spi.send([reg, 0x00], this.cs);
    if (result != undefined && result.length == 2) return result[1];
  }

  private writeRegister(reg: number, value: Uint8Array) {
    this.spi.send([reg, value], this.cs);
  }

  readStatusRegister(reg: StatusRegister): number {
    return this.readRegister(STATUS_REGISTERS[reg]);
  }

  readConfigRegister(reg: ConfigRegister): number {
    return this.readRegister(CONFIG_REGISTERS[reg] + 0x80);
  }

  writeConfigRegister(reg: ConfigRegister, value: number) {
    this.writeRegister(CONFIG_REGISTERS[reg], new Uint8Array([value]));
  }

  writeConfigRegisters(regs: ConfigRegisterAssignment) {
    for (const reg of Object.keys(regs) as ConfigRegister[]) {
      const value = regs[reg];
      this.writeConfigRegister(reg, value);
    }
  }

  writePATable(table: PATable) {
    this.writeRegister(0x7e, new Uint8Array(table));
  }

  reset() {
    // CS wiggling to initiate manual reset (manual page 45)
    // Note: the 1ms-1ms prepending is a "hack" to get around an issue with the ESP8266's
    // RTC timing limtation with the Espruino firmware, see https://github.com/espruino/Espruino/issues/1749
    digitalPulse(this.cs, true, [1, 1, 0.03, 0.03, 0.045]);
    digitalPulse(this.cs, true, 0);

    this.sendCmd(0x30);
    this.writeConfigRegisters(DEFAULT_CONFIG_868MHZ);
  }

  private setStateTx() {
    this.sendCmd(0x35) // STX
  }

  private setStateIdle() {
    this.sendCmd(0x36) // SIDLE
  }

  private flushRxFifo() {
    this.sendCmd(0x3a) // SFRX
  }

  private flushTxFifo() {
    this.sendCmd(0x3b) // SFTX
  }

  private getMarcState(): number {
    return this.readStatusRegister('MARCSTATE') & 0x1f;
  }

  getVersion(): string {
    return this.readStatusRegister('VERSION').toString(16);
  }

  getPartnum(): string {
    return this.readStatusRegister('PARTNUM').toString(16);
  }

  sendData(data: Uint8Array) {
    this.setStateIdle();
    this.flushRxFifo();
    this.flushTxFifo();

    this.writeRegister(0x7f, data);

    this.setStateTx();

    const state = this.getMarcState();
    if (state != 0x13 && state != 0x14 && state != 0x15) { // not one of TX / TX_END / RXTX_SWITCH states
      this.setStateIdle();
      return;
    }
  }

}
