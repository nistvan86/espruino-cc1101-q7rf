export class StatusLED {
  private ledPin: Pin;
  private ledOffState: boolean;
  private blinkTimer: any = undefined;
  private freq: number;
  private ledState: boolean;

  constructor(ledPin: Pin, ledOffState: boolean) {
    this.ledPin = ledPin;
    this.ledOffState = ledOffState;
    this.ledPin.mode('output');
    this.ledPin.write(this.ledState = this.ledOffState);
  }

  startBlinking(freq: number) {
    this.stopBlinking();

    this.freq = freq;
    this.ledPin.write(this.ledState = !this.ledOffState);

    this.startTimer();
  }

  private startTimer() {
    const self = this;
    this.blinkTimer = setTimeout(() => { self.toggle(); }, this.freq);
  }

  private toggle() {
    this.ledPin.write(this.ledState = !this.ledState);
    this.startTimer();
  }

  stopBlinking() {
    if (this.blinkTimer != undefined) clearTimeout(this.blinkTimer);
    this.ledPin.write(this.ledState = this.ledOffState);
  }

}
