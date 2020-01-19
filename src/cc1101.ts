export class cc1101 {
  spi: SPI;
  cs: Pin;

  constructor(spi: SPI, cs: Pin) {
    this.spi = spi;
    this.cs = cs;
  }

  private sendCmd(cmd: number, cb: CallableFunction) {
    this.cs.write(false);
    this.spi.write(cmd);
    this.cs.write(true);

    setTimeout(cb, 0.3, []);
  }

  readReg(reg: number): any {
    let result: Uint8Array = this.spi.send([reg, 0x00], this.cs);
    if (result != undefined && result.length == 2) return result[1];
  }

  reset(cb: CallableFunction) {
    // CS wiggling to initiate manual reset (manual page 45)
    digitalPulse(this.cs, true, [1, 1, 0.03, 0.03, 0.045]);
    digitalPulse(this.cs, true, 0);

    this.sendCmd(0x30, cb);
  }
}
