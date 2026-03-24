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
};

export type ActionItem = {
  title: string;
  owner: string;
  due: string;
};

export const cyberMockData = {
  today: 'March 17, 2026',
  regionFocus: 'German Banking',
  threatLevel: 'Elevated',

  headlineSummary:
    'Financially motivated intrusion activity remains the main concern, with identity abuse, phishing, and edge-device exploitation driving the most relevant risk for European banking environments.',

  topIntel: [
    {
      title: 'Phishing cluster targeting European financial institutions',
      source: 'Daily Intel Feed',
      summary:
        'A cluster of phishing infrastructure has been observed impersonating banking login portals and MFA workflows, with lures focused on account recovery and urgent customer verification.',
      priority: 'High',
      tags: ['Phishing', 'Identity', 'Banking'],
    },
    {
      title: 'Ransomware affiliates increasing focus on external edge devices',
      source: 'Threat Watch',
      summary:
        'Recent reporting suggests multiple affiliates are prioritizing vulnerable perimeter appliances to gain initial access before pivoting into corporate identity systems.',
      priority: 'High',
      tags: ['Ransomware', 'Initial Access', 'Edge Devices'],
    },
    {
      title: 'Payment-sector fraud activity rising around credential reuse',
      source: 'Fraud Monitor',
      summary:
        'Credential reuse and session hijacking continue to create fraud risk across financial login workflows, especially where legacy MFA patterns remain in place.',
      priority: 'Medium',
      tags: ['Fraud', 'Session Hijacking', 'Credentials'],
    },
  ] as IntelItem[],

  vulnerabilities: [
    {
      cve: 'CVE-2026-12345',
      severity: 'Critical',
      product: 'VPN Gateway',
      note: 'Actively discussed as a likely initial access vector for internet-facing environments.',
    },
    {
      cve: 'CVE-2026-23456',
      severity: 'High',
      product: 'Email Security Appliance',
      note: 'Relevant due to phishing defense bypass concerns and gateway exposure.',
    },
    {
      cve: 'CVE-2026-34567',
      severity: 'High',
      product: 'Identity Management Platform',
      note: 'Important because of direct potential impact on authentication and privileged workflows.',
    },
  ] as VulnerabilityItem[],

  keyTakeaways: [
    'Identity remains the center of gravity for likely attacker objectives.',
    'German and broader EU banks should prioritize phishing-resistant controls and hardening of customer-facing workflows.',
    'External edge systems and authentication layers deserve immediate validation and patch review.',
  ],

  actions: [
    {
      title: 'Review external edge exposure and patch status',
      owner: 'You',
      due: 'Today',
    },
    {
      title: 'Validate phishing-resistant MFA coverage for priority apps',
      owner: 'IAM Team',
      due: 'This Week',
    },
    {
      title: 'Prepare a short exec summary on banking-relevant threat activity',
      owner: 'You',
      due: 'Tomorrow',
    },
  ] as ActionItem[],

  coachingText:
    'The strongest near-term value is in separating signal from noise. Focus your attention on identity abuse, phishing trends, and internet-facing weakness relevant to financial institutions. If you were briefing leadership today, the message should be simple: attacker success still depends on getting in through people, credentials, or exposed edge infrastructure.',
};