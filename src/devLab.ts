export const DEV_LAB_SCENE_KEY = 'DevLabScene';
export const DEV_LAB_LABEL = 'Dev Lab';

export type DevLabEnv = {
  readonly DEV?: boolean;
};

export function isDevLabEnabled(env: DevLabEnv = import.meta.env): boolean {
  return env.DEV === true;
}

export function appendDevLabScene<T, U>(
  scenes: readonly T[],
  devLabScene: U,
  env: DevLabEnv = import.meta.env
): Array<T | U> {
  if (!isDevLabEnabled(env)) {
    return [...scenes];
  }

  return [...scenes, devLabScene];
}
