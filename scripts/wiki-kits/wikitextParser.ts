export type ParsedWikitextTemplate = {
  name: string;
  params: Record<string, string>;
};

const FOOTBALL_TEAM_TEMPLATE_NAME = 'Сборная страны по футболу';

export function parseFootballTeamTemplateParams(wikitext: string): ParsedWikitextTemplate {
  const templateContent = extractTopLevelTemplateContent(wikitext, FOOTBALL_TEAM_TEMPLATE_NAME);
  const parts = splitTopLevel(templateContent, '|');
  const [rawName, ...rawParams] = parts;

  if (rawName === undefined) {
    throw new Error(`Template "${FOOTBALL_TEAM_TEMPLATE_NAME}" is empty.`);
  }

  const params: Record<string, string> = {};

  rawParams.forEach((rawParam) => {
    const separatorIndex = findTopLevelChar(rawParam, '=');

    if (separatorIndex === -1) {
      return;
    }

    const key = rawParam.slice(0, separatorIndex).trim();

    if (key.length === 0) {
      return;
    }

    params[key] = rawParam.slice(separatorIndex + 1).trim();
  });

  return {
    name: rawName.trim(),
    params
  };
}

function extractTopLevelTemplateContent(wikitext: string, templateName: string): string {
  const start = findTopLevelTemplateStart(wikitext, templateName);

  if (start === -1) {
    throw new Error(`Template "${templateName}" was not found.`);
  }

  let depth = 0;

  for (let index = start; index < wikitext.length; index += 1) {
    if (wikitext.startsWith('{{', index)) {
      depth += 1;
      index += 1;
      continue;
    }

    if (wikitext.startsWith('}}', index)) {
      depth -= 1;

      if (depth === 0) {
        return wikitext.slice(start + 2, index);
      }

      index += 1;
    }
  }

  throw new Error(`Template "${templateName}" is not closed.`);
}

function findTopLevelTemplateStart(wikitext: string, templateName: string): number {
  let depth = 0;

  for (let index = 0; index < wikitext.length; index += 1) {
    if (wikitext.startsWith('{{', index)) {
      if (depth === 0 && readTemplateName(wikitext, index + 2) === templateName) {
        return index;
      }

      depth += 1;
      index += 1;
      continue;
    }

    if (wikitext.startsWith('}}', index)) {
      depth = Math.max(0, depth - 1);
      index += 1;
    }
  }

  return -1;
}

function readTemplateName(wikitext: string, start: number): string {
  let end = start;

  while (end < wikitext.length && !wikitext.startsWith('|', end) && !wikitext.startsWith('}}', end)) {
    end += 1;
  }

  return wikitext.slice(start, end).trim();
}

function splitTopLevel(value: string, separator: string): string[] {
  const parts: string[] = [];
  let partStart = 0;
  let templateDepth = 0;
  let linkDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value.startsWith('{{', index)) {
      templateDepth += 1;
      index += 1;
      continue;
    }

    if (value.startsWith('}}', index)) {
      templateDepth = Math.max(0, templateDepth - 1);
      index += 1;
      continue;
    }

    if (value.startsWith('[[', index)) {
      linkDepth += 1;
      index += 1;
      continue;
    }

    if (value.startsWith(']]', index)) {
      linkDepth = Math.max(0, linkDepth - 1);
      index += 1;
      continue;
    }

    if (value[index] === separator && templateDepth === 0 && linkDepth === 0) {
      parts.push(value.slice(partStart, index));
      partStart = index + 1;
    }
  }

  parts.push(value.slice(partStart));
  return parts;
}

function findTopLevelChar(value: string, target: string): number {
  let templateDepth = 0;
  let linkDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value.startsWith('{{', index)) {
      templateDepth += 1;
      index += 1;
      continue;
    }

    if (value.startsWith('}}', index)) {
      templateDepth = Math.max(0, templateDepth - 1);
      index += 1;
      continue;
    }

    if (value.startsWith('[[', index)) {
      linkDepth += 1;
      index += 1;
      continue;
    }

    if (value.startsWith(']]', index)) {
      linkDepth = Math.max(0, linkDepth - 1);
      index += 1;
      continue;
    }

    if (value[index] === target && templateDepth === 0 && linkDepth === 0) {
      return index;
    }
  }

  return -1;
}
