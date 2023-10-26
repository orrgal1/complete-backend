import * as detect from 'detect-port';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

export function isE2E() {
  return process.env.E2E;
}

export async function login(ports: {
  http: number;
}): Promise<{ accessToken: string; userId: string }> {
  const input = {
    username: uuid(),
    password: uuid(),
  };
  const response = await axios.post(
    `http://localhost:${ports.http}/auth/local/login`,
    input,
  );
  return response.data;
}

const getPorts = async (): Promise<string[]> => {
  for (let i = 0; i < 50; i++) {
    const base = [
      await detect(Math.floor(2000 + Math.random() * 50000)),
      await detect(Math.floor(2000 + Math.random() * 50000)),
      await detect(Math.floor(2000 + Math.random() * 50000)),
      await detect(Math.floor(2000 + Math.random() * 50000)),
      await detect(Math.floor(2000 + Math.random() * 50000)),
    ];
    const set = new Set(base);
    if (base.length === set.size) return base;
  }
  throw new Error('could not get free ports');
};

export async function usePorts() {
  const [a, b, c, d, e] = await getPorts();
  if (!isE2E()) {
    process.env.PROTO_PORT = a;
    process.env.PROTO_INTERNAL_PORT = b;
    process.env.HTTP_PORT = c;
    process.env.WORKERS_PORT = d;
    process.env.WS_PORT = e;
  }
  const ports = {
    proto: Number(process.env.PROTO_PORT || 0),
    protoInternal: Number(process.env.PROTO_INTERNAL_PORT || 0),
    http: Number(process.env.HTTP_PORT || 0),
    workers: Number(process.env.WORKERS_PORT || 0),
    ws: Number(process.env.WS_PORT || 0),
  };
  return ports;
}

export function useHost() {
  return isE2E() ? process.env.SERVICE_HOST : 'localhost';
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function retry(
  fn: () => Promise<void>,
  times: number,
  wait: number,
  cleanup?: () => Promise<void>,
) {
  return async () => {
    let error: Error;
    for (let i = 0; i < times; i++) {
      try {
        await fn();
        return;
      } catch (e) {
        error = e;
        if (cleanup) await cleanup();
        await sleep(wait);
      }
    }
    throw error;
  };
}
