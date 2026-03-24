export type GameNewsItem = {
  id: string;
  title: string;
  subreddit: string;
  url: string;
  summary: string;
  tag: string;
};

export const fallbackPokopiaNews: GameNewsItem[] = [
  {
    id: 'pokopia-1',
    title: 'Pokopia players are comparing early loop optimizations',
    subreddit: 'IndieGaming',
    url: 'https://www.reddit.com/search/?q=Pokopia',
    summary: 'Discussion is centering on faster progression routes and quality-of-life wishlist items.',
    tag: 'Pokopia',
  },
  {
    id: 'pokopia-2',
    title: 'Reddit chatter is focusing on builds, pacing, and first impressions',
    subreddit: 'Gaming',
    url: 'https://www.reddit.com/search/?q=Pokopia',
    summary: 'Most of the conversation is around what systems feel sticky enough to keep grinding daily.',
    tag: 'Pokopia',
  },
];

export const fallbackSwitchNews: GameNewsItem[] = [
  {
    id: 'switch-1',
    title: 'Nintendo Switch 2 rumors and launch-readiness threads are still dominating discussion',
    subreddit: 'NintendoSwitch',
    url: 'https://www.reddit.com/search/?q=Nintendo%20Switch%202',
    summary: 'The strongest themes are backwards compatibility, performance targets, and launch lineup expectations.',
    tag: 'Switch 2',
  },
  {
    id: 'switch-2',
    title: 'Players are weighing whether Switch 2 becomes their daily-driver handheld',
    subreddit: 'Games',
    url: 'https://www.reddit.com/search/?q=Nintendo%20Switch%202',
    summary: 'Battery life, portability, and first-party support are the big pressure points in recent posts.',
    tag: 'Switch 2',
  },
];

export const fallbackSteamNews: GameNewsItem[] = [
  {
    id: 'steam-1',
    title: 'Steam and PC gaming threads are leaning toward performance and backlog management',
    subreddit: 'pcgaming',
    url: 'https://www.reddit.com/search/?q=Steam%20PC%20gaming',
    summary: 'Conversation is clustered around sales strategy, optimization, and what is worth installing next.',
    tag: 'Steam',
  },
  {
    id: 'steam-2',
    title: 'PC players are still trading recommendations for current Steam standouts',
    subreddit: 'Steam',
    url: 'https://www.reddit.com/search/?q=Steam%20PC%20gaming',
    summary: 'The recurring topics are deck compatibility, value picks, and which releases are worth the time sink.',
    tag: 'Steam',
  },
];
