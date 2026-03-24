export type IntelItem = {
  title: string;
  source: string;
  summary: string;
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
};

export type VulnerabilityItem = {
  cve: string;
  severity: string;
  product: string;
  note: string;
  dueDate?: string;
};

export type ActionItem = {
  title: string;
  owner: string;
  due: string;
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

type CisaKevVulnerability = {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
};

type CisaKevResponse = {
  vulnerabilities?: CisaKevVulnerability[];
};

const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

export const cyberDefaults = {
  regionFocus: 'Identity + external edge',
  headlineSummary:
    'Financially motivated intrusion activity still leans on phishing, credential theft, and exposed internet-facing systems. Keep identity pressure, patch urgency, and external exposure in the same briefing lane.',
  keyTakeaways: [
    'Identity remains the fastest path to impact, so phishing-resistant controls still matter more than surface-level noise.',
    'Internet-facing appliances stay relevant because exploited edge exposure can turn into credential and privilege abuse quickly.',
    'Operationally, the best response is to cut through volume and keep patching, auth hardening, and exposure review on a short cycle.',
  ],
  actions: [
    {
      title: 'Validate external edge exposure and patch status for internet-facing systems',
      owner: 'You',
      due: 'Today',
    },
    {
      title: 'Review the newest high-priority intel for identity abuse and phishing patterns',
      owner: 'You',
      due: 'Today',
    },
    {
      title: 'Tighten the short list of banking-relevant threats into an exec-ready summary',
      owner: 'You',
      due: 'This Week',
    },
  ] as ActionItem[],
};

export async function fetchCyberIntel(): Promise<IntelItem[]> {
  const queries = ['cybersecurity phishing banking CVE', '"German banking" cybersecurity'];
  const results = await Promise.allSettled(
    queries.map(async (query) => {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=day&limit=4`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'johnny-app/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Cyber intel request failed: ${response.status}`);
      }

      const json = (await response.json()) as RedditResponse;
      return json.data?.children ?? [];
    })
  );

  const children = results
    .filter(
      (result): result is PromiseFulfilledResult<RedditChild[]> => result.status === 'fulfilled'
    )
    .flatMap((result) => result.value);

  if (children.length === 0) {
    throw new Error('Cyber intel request failed for all query sources.');
  }

  const seen = new Set<string>();

  return children
    .map((child) => {
      const item = child.data;
      const body = item.selftext?.trim() ?? '';
      const lower = `${item.title} ${body}`.toLowerCase();

      let priority: IntelItem['priority'] = 'Low';

      if (/(critical|ransomware|phishing|breach|zero[- ]day|actively exploited|bank)/.test(lower)) {
        priority = 'High';
      } else if (/(cve|malware|credential|fraud|vulnerability|exploit)/.test(lower)) {
        priority = 'Medium';
      }

      const tags = [
        lower.includes('phishing') ? 'Phishing' : null,
        lower.includes('bank') ? 'Banking' : null,
        lower.includes('credential') ? 'Credentials' : null,
        lower.includes('cve') || lower.includes('vulnerability') ? 'Vulnerability' : null,
        lower.includes('ransomware') ? 'Ransomware' : null,
      ].filter((tag): tag is string => Boolean(tag));

      return {
        id: item.id,
        title: item.title,
        source: `r/${item.subreddit}`,
        summary:
          body.length > 0
            ? `${body.slice(0, 160)}${body.length > 160 ? '...' : ''}`
            : 'Fresh cyber discussion surfaced from the latest feed.',
        priority,
        tags: tags.length > 0 ? tags : ['Cyber'],
      };
    })
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    })
    .slice(0, 5)
    .map(({ id: _id, ...item }) => item);
}

export async function fetchKnownExploitedVulnerabilities(): Promise<VulnerabilityItem[]> {
  const response = await fetch(CISA_KEV_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CISA KEV request failed: ${response.status}`);
  }

  const json = (await response.json()) as CisaKevResponse;
  const vulnerabilities = json.vulnerabilities ?? [];

  return vulnerabilities
    .slice(-5)
    .reverse()
    .map((item) => ({
      cve: item.cveID,
      severity: 'Known Exploited',
      product: `${item.vendorProject} ${item.product}`.trim(),
      note: item.shortDescription || item.requiredAction || item.vulnerabilityName,
      dueDate: item.dueDate,
    }));
}

export function getFallbackIntel(): IntelItem[] {
  return [
    {
      title: 'Use the live intel feed to watch phishing and credential pressure',
      source: 'Operational fallback',
      summary:
        'If the live pull fails, keep the focus on identity abuse, phishing workflow changes, and exposed edge systems until the feed comes back.',
      priority: 'High',
      tags: ['Identity', 'Phishing'],
    },
    {
      title: 'Keep the edge review lane active',
      source: 'Operational fallback',
      summary:
        'Internet-facing systems and appliances are still the cleanest first place to validate patch posture and exposure.',
      priority: 'Medium',
      tags: ['Edge', 'Exposure'],
    },
  ];
}

export function getFallbackVulnerabilities(): VulnerabilityItem[] {
  return [
    {
      cve: 'Live KEV feed unavailable',
      severity: 'Review focus',
      product: 'External edge + identity stack',
      note: 'Prioritize internet-facing appliances, email security layers, and identity providers until the live feed returns.',
    },
    {
      cve: 'Patch lane',
      severity: 'Review focus',
      product: 'Browser, VPN, SSO, email gateway',
      note: 'Focus on the newest urgent fixes across remote access, authentication, and phishing-facing infrastructure.',
    },
  ];
}

export function formatThreatLevel(items: IntelItem[]) {
  const highCount = items.filter((item) => item.priority === 'High').length;

  if (highCount >= 3) {
    return 'High';
  }

  if (highCount >= 1) {
    return 'Elevated';
  }

  return 'Guarded';
}
