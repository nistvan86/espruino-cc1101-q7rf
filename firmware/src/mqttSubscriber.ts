import * as mqtt from 'tinyMQTT';

class MQTTSubscriber {

  private client: mqtt.MQTT;

  constructor(server: string, port: number, username: string, password: string, topic: string) {
    this.client = mqtt.create(server, {username: username, password: password});
  }

}
