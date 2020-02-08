import { Q7RF } from './q7rf';
import { StatusLED } from './statusLED';

import * as wifi from 'Wifi';
import * as mqtt from 'tinyMQTT';

// BOARD SPECIFIC SETTINGS
// You probably need to change these if you use an other ESP8266 board then NodeMCU
const spi = SPI1;
const spiOpts = {sck: NodeMCU.D5, miso: NodeMCU.D6, mosi: NodeMCU.D7}
const csPin = NodeMCU.D8;
const ledPin = NodeMCU.D0;
const ledOffState = true;
const pairingButtonBin = NodeMCU.D3;
const pairingButtonPinMode = 'input_pullup';
const pairingButtonPinPressedEdge = 'falling'
// END OF BOARD SPECIFIC SETTINGS

const initBlinking = 1000;
const errorBlinking = 500;
const queueDisconnectBlinking = 100;

let q7rf: Q7RF;
let led: StatusLED;
let queue: mqtt.MQTT;

function setupStatusLed() {
  led = new StatusLED(ledPin, ledOffState);
  led.startBlinking(initBlinking);
}

function configCheck(): boolean {
  if (config == undefined) {
    console.log('No configuration saved in .boot0, probably bad flashing.');
    return false;
  }
  console.log('Found config.');
  return true;
}

function setupRadio(): boolean {
  // Setup radio interface
  spi.setup(spiOpts);
  csPin.mode('output');

  q7rf = new Q7RF(spi, csPin, parseInt(config.q7rf.deviceId, 16), config.q7rf.resendDelay);
  if (!q7rf.setup()) {
    console.log('Failed to initialize CC1101');
    return false;
  }

  console.log('Q7RF radio interface ready.');

  // Setup pairing button PIN
  pairingButtonBin.mode(pairingButtonPinMode);
  setWatch(() => {
    q7rf.doPairing();
    console.log('Sent pairing code.');
  }, pairingButtonBin, { repeat: true, edge: pairingButtonPinPressedEdge, debounce: 50 });

  return true;
}

function setupWifi(connected: CallableFunction) {
  wifi.setHostname('Q7RF_MQTT');
  wifi.on('connected', () => {console.log('Connected to WiFi.'); connected();});
  wifi.connect(config.wifi.ssid, {password: config.wifi.password, dnsServers: []}, (err) => {
    if (err) {
      console.log('Failed to connect to WiFi: ' + err);
      led.startBlinking(errorBlinking);
    }
  });
}

function setupMQTT() {
  queue = mqtt.create(config.mqtt.host, {username: config.mqtt.username, password: config.mqtt.password, port: config.mqtt.port});

  queue.on('connected', () => {
    console.log('Connected to MQTT.');
    led.stopBlinking();

    queue.subscribe(config.mqtt.topic);
  });

  queue.on('disconnected', () => {
    console.log('MQTT disconnected, reconnecting in 10 second.');
    led.startBlinking(queueDisconnectBlinking);
    setTimeout(() => { queue.connect(); }, 10000);
  });

  queue.on('message', (msg: mqtt.Message) => {
    if (msg.topic == config.mqtt.topic) {
      console.log('MQTT message received: ' + msg.message);
      if (msg.message == 'ON') {
        q7rf.turnOnHeating();
      } else if (msg.message == 'OFF') {
        q7rf.turnOffHeating();
      }
    }
  });

  queue.connect();
}

function main() {
  setupStatusLed();

  if (!configCheck() || !setupRadio()) {
    led.startBlinking(errorBlinking);
    return;
  }

  setupWifi(() => {
    setupMQTT();
  });
}

E.on('init', main);
