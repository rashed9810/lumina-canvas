import { BroadcastEvent, BroadcastEventType } from '../types';
import { CHANNEL_NAME } from '../constants';

class BroadcastService {
  private channel: BroadcastChannel;
  private listeners: ((event: BroadcastEvent) => void)[] = [];

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (msg: MessageEvent) => {
      this.listeners.forEach(listener => listener(msg.data as BroadcastEvent));
    };
  }

  public subscribe(callback: (event: BroadcastEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public broadcast(event: BroadcastEvent) {
    this.channel.postMessage(event);
  }

  public close() {
    this.channel.close();
  }
}

export const broadcastService = new BroadcastService();

