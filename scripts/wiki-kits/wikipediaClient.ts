import { REQUEST_DELAY_MS, USER_AGENT, WIKIPEDIA_API_URL } from './config';
import { delay, fetchWithHttp429Retry } from './httpRetry';

export type WikipediaPageWikitext = {
  title: string;
  revisionId: number;
  revisionTimestamp: string;
  content: string;
};

type WikipediaApiResponse = {
  query?: {
    pages?: WikipediaApiPage[];
  };
};

type WikipediaApiPage = {
  title?: string;
  missing?: boolean;
  revisions?: WikipediaApiRevision[];
};

type WikipediaApiRevision = {
  revid?: number;
  timestamp?: string;
  slots?: {
    main?: {
      content?: string;
      '*'?: string;
    };
  };
};

let requestQueue: Promise<void> = Promise.resolve();

export async function fetchWikipediaPageWikitext(title: string): Promise<WikipediaPageWikitext> {
  const result = requestQueue.then(() => fetchWikipediaPageWikitextNow(title));
  requestQueue = result.then(
    () => delay(REQUEST_DELAY_MS),
    () => delay(REQUEST_DELAY_MS)
  );

  return result;
}

function buildWikipediaWikitextUrl(title: string): URL {
  const url = new URL(WIKIPEDIA_API_URL);
  url.search = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    titles: title,
    rvprop: 'ids|timestamp|content',
    rvslots: 'main',
    format: 'json',
    formatversion: '2'
  }).toString();

  return url;
}

async function fetchWikipediaPageWikitextNow(title: string): Promise<WikipediaPageWikitext> {
  try {
    const response = await fetchWithHttp429Retry(buildWikipediaWikitextUrl(title), {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as WikipediaApiResponse;
    const page = data.query?.pages?.[0];

    if (page === undefined) {
      throw new Error('Response does not contain query.pages');
    }

    if (page.missing === true) {
      throw new Error('Page is missing');
    }

    const revision = page.revisions?.[0];

    if (revision === undefined) {
      throw new Error('Response does not contain revisions');
    }

    const content = revision.slots?.main?.content ?? revision.slots?.main?.['*'];

    if (content === undefined) {
      throw new Error('Response does not contain slots.main.content');
    }

    if (content.trim().length === 0) {
      throw new Error('Response contains empty wikitext');
    }

    if (revision.revid === undefined || revision.timestamp === undefined) {
      throw new Error('Response revision metadata is incomplete');
    }

    return {
      title: page.title ?? title,
      revisionId: revision.revid,
      revisionTimestamp: revision.timestamp,
      content
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to load Wikipedia wikitext for "${title}": ${reason}`);
  }
}
