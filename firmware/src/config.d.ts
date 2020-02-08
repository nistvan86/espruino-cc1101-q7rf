interface Config {
  wifi: {
    ssid: string,
    password: string
  },
  mqtt: {
    host: string,
    port: number,
    username: string,
    password: string,
    topic: string
  },
  q7rf: {
    deviceId: string,
    resendDelay: number
  }
}

declare var config: Config;
