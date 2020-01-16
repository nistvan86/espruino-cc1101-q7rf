export class cc1101 {
  spi: SPI;
  cs: Pin;

  constructor(spi: SPI, cs: Pin) {
    this.spi = spi;
    this.cs = cs;

    spi.setup({});
    this.cs.mode('output');
  }

  private sendCmd(cmd: number, cb: CallableFunction) {
    this.cs.write(false);
    this.spi.write(cmd);
    this.cs.write(true);

    setTimeout(cb, 0.3, []);
  }

  readReg(reg: number): any {
    return this.spi.send(reg, this.cs);
  }

  reset(cb: CallableFunction) {
    // CS wiggling to initiate manual reset (manual page 45)
    digitalPulse(this.cs, true, [0.03, 0.03, 0.045]);
    digitalPulse(this.cs, true, 0); // Wait for completion

    this.sendCmd(0x30, cb);
  }
}
