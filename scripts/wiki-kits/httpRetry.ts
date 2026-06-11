import { HTTP_429_RETRY_DELAYS_MS } from './config';

export async function fetchWithHttp429Retry(input: URL | string, init: RequestInit): Promise<Response> {
  let response = await fetch(input, init);

  for (const retryDelay of HTTP_429_RETRY_DELAYS_MS) {
    if (response.status !== 429) {
      return response;
    }

    await delay(getRetryDelayMs(response, retryDelay));
    response = await fetch(input, init);
  }

  return response;
}

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getRetryDelayMs(response: Response, fallbackMs: number): number {
  const retryAfter = response.headers.get('Retry-After');

  if (retryAfter === null) {
    return fallbackMs;
  }

  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1_000;
  }

  const retryAfterDate = Date.parse(retryAfter);

  if (Number.isFinite(retryAfterDate)) {
    return Math.max(0, retryAfterDate - Date.now());
  }

  return fallbackMs;
}
