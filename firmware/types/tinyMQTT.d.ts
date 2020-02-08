declare module "tinyMQTT" {

  interface Options {
    username?: string
    password?: string
    port?: number
  }

  interface Message {
    message?: string,
    topic?: string
  }

  interface MQTT {
    connect(): void;
    subscribe(topic: string): void;

    on(event: 'connected', callback: () => void): void;
    on(event: 'disconnected', callback: () => void): void;
    on(event: 'published', callback: () => void): void;
    on(event: 'message', callback: (message: Message) => void): void;
  }

  function create(server: string, options?: Options): MQTT;

}
