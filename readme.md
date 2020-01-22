# espruino-cc1101-q7rf

Use an ESP8266 and a TI CC1101 modem to control your Computherm/Delta Q7RF/Q8RF receiver equiped boiler.

Work in progress to make this usable (MQTT, setup UI, etc.)

The thermostat ID sent in messages can be configured inside `app.ts` for now. The device sends a pairing code after boot, so if you place your receiver into learning mode (hold down M/A button for 10 seconds), it will updates it's configuration with it, and other commands will work. (You can send your original wireless thermostat's ID by holding the Set + Day buttons on it for 10 seconds, if you wish to reset the original setup)

The code now toggles the heating on/off every 5 seconds. So it's best to turn of your boiler manually before trying this out. This way you only see and hear the receiver switching states.

## Dependencies

You need Espruino version 2v04.76 or later. Get it from www.espruino.com and flash accordingly. A 4MB Flash equiped ESP8266 like the NodeMCU is required. If you use other boards, you might need to change the SPI and chip select (csPin) settings in `app.ts`.

CC1101 chip needs to be connected to the standard SPI pins of ESP8266 (hardware SPI).

You need a CC1101 chip which is tuned to 868 MHz. The chip on it's own can be configured for many targets, but the antenna design on the board needs to be tuned for the specific frequency in mind. I've used an extremely cheap $2 module from AliExpress which needed some cables and the antenna to be soldered.

## CC1101 library

Initially I was writing this library as an Arduino project, but got enough of the slow reflashing of the project, and switched to Espruino.

Because there's no CC1101 library for Espruino, I've written my own. I had to do it anyway, because most libraries use CC1101 with the factory presets to transmit data between two nodes with the same radio. I had to turn off many features to emulate the ASK/OOK signal that I needed.

The library was written with reusability in mind, but beware that I haven't written any receiving capabilities.

I'm not using the modem's GPO0 pin to catch when the transmission ended as most CC1101 libraries do. In fact I'm not even using anything at all to detect if the package was sent out, just adding sensible delays. This simplifies code a lot, also Espruino doesn't support busy wait.

## Flash

This project uses EspruinoTools for flashing the device. Use `npm install` to get dependencies for this repository and then issue `npm run upload`. Probably you need to change the serial port used on the top of `gulpfile.js`.

## Research sources

* The cc1101-ook library which functioned as a template for the communication best practices with the modem (https://github.com/martyrs/cc1101-ook)
* denx's awesome article series about reverse engineering the Q8RF's protocol. Unfortunatelly it's only
  available in Hungarian. (https://ardu.blog.hu/2019/04/17/computherm_q8rf_uj_kihivas_part)
* CC1101 product manual from Ti: http://www.ti.com/lit/ds/symlink/cc1101.pdf
* The Espruino Typescript definitions from Matias Gea's repository (https://github.com/mfgea/espruino-ts-boilerplate/tree/master/types/espruino). Also I've learned a lot about the Typescript compilation needed for this project from his repository. Unfortunatelly I don't know where he got the type definition from. It's more complete than the definition found inside DefinitelyTyped. 
