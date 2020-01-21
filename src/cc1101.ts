export enum ConfigRegister {
  IOCFG2 = 0x00,
  IOCFG1 = 0x01,
  IOCFG0 = 0x02,
  FIFOTHR = 0x03,
  SYNC1 = 0x04,
  SYNC0 = 0x05,
  PKTLEN = 0x06,
  PKTCTRL1 = 0x07,
  PKTCTRL0 = 0x08,
  ADDR = 0x09,
  CHANNR = 0x0a,
  FSCTRL1 = 0x0b,
  FSCTRL0 = 0x0c,
  FREQ2 = 0x0d,
  FREQ1 = 0x0e,
  FREQ0 = 0x0f,
  MDMCFG4 = 0x10,
  MDMCFG3 = 0x11,
  MDMCFG2 = 0x12,
  MDMCFG1 = 0x13,
  MDMCFG0 = 0x14,
  DEVIATN = 0x15,
  MCSM2 = 0x16,
  MCSM1 = 0x17,
  MCSM0 = 0x18,
  FOCCFG = 0x19,
  BSCFG = 0x1a,
  AGCCTRL2 = 0x1b,
  AGCCTRL1 = 0x1c,
  AGCCTRL0 = 0x1d,
  WOREVT1 = 0x1e,
  WOREVT0 = 0x1f,
  WORCTRL = 0x20,
  FREND1 = 0x21,
  FREND0 = 0x22,
  FSCAL3 = 0x23,
  FSCAL2 = 0x24,
  FSCAL1 = 0x25,
  FSCAL0 = 0x26,
  RCCTRL1 = 0x27,
  RCCTRL0 = 0x28,
  FSTEST = 0x29,
  PTEST = 0x2a,
  AGCTEST = 0x2b,
  TEST2 = 0x2c,
  TEST1 = 0x2d,
  TEST0 = 0x2e
};

export enum StatusRegister {
  PARTNUM = 0xf0,
  VERSION = 0xf1,
  FREQEST = 0xf2,
  LQI = 0xf3,
  RSSI = 0xf4,
  MARCSTATE = 0xf5,
  WORTIME1 = 0xf6,
  WORTIME0 = 0xf7,
  PKTSTATUS = 0xf8,
  VCO_VC_DAC = 0xf9,
  TXBYTES = 0xfa,
  RXBYTES = 0xfb,
  RCCTRL1_STATUS = 0xfc,
  RCCTRL0_STATUS = 0xfd
};

export type ConfigRegisterAssignment = Partial<Record<ConfigRegister, number>>;

export const DEFAULT_CONFIG_868MHZ: ConfigRegisterAssignment = {
  [ConfigRegister.IOCFG2]: 0x29,
  [ConfigRegister.IOCFG1]: 0x2e,
  [ConfigRegister.IOCFG0]: 0x06,
  [ConfigRegister.FIFOTHR]: 0x47,
  [ConfigRegister.SYNC1]: 0xd3,
  [ConfigRegister.SYNC0]: 0x91,
  [ConfigRegister.PKTLEN]: 0x12,
  [ConfigRegister.PKTCTRL1]: 0x04,
  [ConfigRegister.PKTCTRL0]: 0x00,
  [ConfigRegister.ADDR]: 0x11,
  [ConfigRegister.CHANNR]: 0x00,
  [ConfigRegister.FSCTRL1]: 0x06,
  [ConfigRegister.FSCTRL0]: 0x00,
  [ConfigRegister.FREQ2]: 0x21,
  [ConfigRegister.FREQ1]: 0x62,
  [ConfigRegister.FREQ0]: 0x76,
  [ConfigRegister.MDMCFG4]: 0xe5,
  [ConfigRegister.MDMCFG3]: 0xc3,
  [ConfigRegister.MDMCFG2]: 0x30,
  [ConfigRegister.MDMCFG1]: 0x22,
  [ConfigRegister.MDMCFG0]: 0xf8,
  [ConfigRegister.DEVIATN]: 0x15,
  [ConfigRegister.MCSM2]: 0x07,
  [ConfigRegister.MCSM1]: 0x30,
  [ConfigRegister.MCSM0]: 0x18,
  [ConfigRegister.FOCCFG]: 0x16,
  [ConfigRegister.BSCFG]: 0x6c,
  [ConfigRegister.AGCCTRL2]: 0x03,
  [ConfigRegister.AGCCTRL1]: 0x00,
  [ConfigRegister.AGCCTRL0]: 0x91,
  [ConfigRegister.WOREVT1]: 0x87,
  [ConfigRegister.WOREVT0]: 0x6b,
  [ConfigRegister.WORCTRL]: 0xfb,
  [ConfigRegister.FREND1]: 0x56,
  [ConfigRegister.FREND0]: 0x11,
  [ConfigRegister.FSCAL3]: 0xe9,
  [ConfigRegister.FSCAL2]: 0x2a,
  [ConfigRegister.FSCAL1]: 0x00,
  [ConfigRegister.FSCAL0]: 0x1f,
  [ConfigRegister.RCCTRL1]: 0x41,
  [ConfigRegister.RCCTRL0]: 0x00,
  [ConfigRegister.FSTEST]: 0x59,
  [ConfigRegister.PTEST]: 0x7f,
  [ConfigRegister.AGCTEST]: 0x3f
};

export class cc1101 {
  spi: SPI;
  cs: Pin;

  constructor(spi: SPI, cs: Pin) {
    this.spi = spi;
    this.cs = cs;
  }

  private sendCmd(cmd: number, callback: CallableFunction) {
    this.cs.write(false);
    this.spi.write(cmd);
    this.cs.write(true);

    setTimeout(callback, 0.3, []);
  }

  private readRegister(reg: number): number {
    let result: Uint8Array = this.spi.send([reg, 0x00], this.cs);
    if (result != undefined && result.length == 2) return result[1];
  }

  private writeRegister(reg: number, value: Uint8Array) {
    this.spi.send([reg, value], this.cs);
  }

  readStatusRegister(reg: StatusRegister): number {
    return this.readRegister(reg);
  }

  readConfigRegister(reg: ConfigRegister): number {
    return this.readRegister(reg + 0x80);
  }

  writeConfigRegister(reg: ConfigRegister, value: number) {
    this.writeRegister(reg, new Uint8Array([value]));
  }

  reset(callback: CallableFunction) {
    // CS wiggling to initiate manual reset (manual page 45)
    // Note: the 1ms-1ms prepending is a "hack" to get around an issue with the ESP8266's
    // RTC timing limtation with the Espruino firmware, see https://github.com/espruino/Espruino/issues/1749
    digitalPulse(this.cs, true, [1, 1, 0.03, 0.03, 0.045]);
    digitalPulse(this.cs, true, 0);

    this.sendCmd(0x30, () => {
      // TODO: set default config register values
      callback();
    });
  }
}
