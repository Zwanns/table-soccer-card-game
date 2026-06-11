import { isTeamId } from './config';
import type { TeamId } from './types';

export type WikiKitsCliOptions = {
  teamId?: TeamId;
  force: boolean;
  clearCache: boolean;
  debug: boolean;
};

export function parseWikiKitsCliArgs(args: readonly string[]): WikiKitsCliOptions {
  const options: WikiKitsCliOptions = {
    force: false,
    clearCache: false,
    debug: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--clear-cache') {
      options.clearCache = true;
      continue;
    }

    if (arg === '--debug') {
      options.debug = true;
      continue;
    }

    if (arg === '--team') {
      const value = args[index + 1];

      if (value === undefined || value.startsWith('--')) {
        throw new Error('Missing value for --team. Expected one of: poland, ukraine, brazil.');
      }

      options.teamId = parseTeamId(value);
      index += 1;
      continue;
    }

    if (arg.startsWith('--team=')) {
      options.teamId = parseTeamId(arg.slice('--team='.length));
      continue;
    }

    throw new Error(`Unknown wiki-kits option "${arg}".`);
  }

  return options;
}

function parseTeamId(value: string): TeamId {
  if (!isTeamId(value)) {
    throw new Error(`Unsupported team "${value}". Expected one of: poland, ukraine, brazil.`);
  }

  return value;
}
