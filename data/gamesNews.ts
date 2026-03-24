export type GameNewsItem = {
  id: string;
  title: string;
  subreddit: string;
  url: string;
  summary: string;
  tag: string;
};

type RedditChild = {
  data: {
    id: string;
    title: string;
    subreddit: string;
    permalink: string;
    selftext?: string;
  };
};

type RedditResponse = {
  data?: {
    children?: RedditChild[];
  };
};

export async function fetchRedditNews(query: string, tag: string): Promise<GameNewsItem[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=day&limit=5`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'johnny-app/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit request failed: ${response.status}`);
  }

  const json = (await response.json()) as RedditResponse;
  const children = json.data?.children ?? [];

  return children
    .map((child) => {
      const item = child.data;
      const summarySource = item.selftext?.trim();

      return {
        id: `${tag}-${item.id}`,
        title: item.title,
        subreddit: item.subreddit,
        url: `https://www.reddit.com${item.permalink}`,
        summary:
          summarySource && summarySource.length > 0
            ? `${summarySource.slice(0, 140)}${summarySource.length > 140 ? '...' : ''}`
            : `Latest Reddit discussion surfaced for ${tag}.`,
        tag,
      };
    })
    .filter((item) => item.title);
}

export function buildFallbackNewsItems(tag: string, subreddit: string, query: string): GameNewsItem[] {
  const encodedQuery = encodeURIComponent(query);

  return [
    {
      id: `${tag.toLowerCase()}-search`,
      title: `Open the latest ${tag} Reddit results`,
      subreddit,
      url: `https://www.reddit.com/search/?q=${encodedQuery}&sort=new&t=day`,
      summary: `The live feed did not load, so this opens the freshest Reddit search results for ${tag}.`,
      tag,
    },
  ];
}
