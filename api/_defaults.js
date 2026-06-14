const defaultConfig = {
  campaign: {
    currencySymbol: "$",
    presetAmounts: [10, 25, 50, 100],
    fundraisingGoal: 5000,
    receiptGoal: "24h",
    eyebrow: "RMbtsdonations.com / Independent ARMY campaign",
    heroCopy:
      "A fan donation hub for Kim Namjoon supporters funding Arirang tour marketing, poster runs, flyers, external PR, fan visibility, and transparent campaign logistics.",
    dockCopy: "Support with USDT, Bitcoin, USDC, or bank transfer once admin details are live.",
    budgetTitle: "Every donation gets a job.",
    stats: [
      { value: "AR", label: "Arirang tour marketing" },
      { value: "$5,000", label: "funding target" },
      { value: "24h", label: "receipt update goal" },
      { value: "RM", label: "RMbtsdonations" },
    ],
    budget: [
      {
        title: "Posters and flyers",
        description: "Design prep, print runs, delivery, placement, and local visibility.",
        percent: 40,
      },
      {
        title: "External PR",
        description: "Outreach, fan campaign amplification, creator support, and placements.",
        percent: 30,
      },
      {
        title: "On-ground support",
        description: "Volunteer materials, banners, venue-area support, and quick logistics.",
        percent: 20,
      },
      {
        title: "Reserve",
        description: "Contingency for vendor changes, urgent printing, and last-mile needs.",
        percent: 10,
      },
    ],
  },
  proofSubmissionEndpoint: "/api/proofs",
  paymentMethods: {
    usdt: { network: "TRC20/ERC20", address: "" },
    bitcoin: { network: "BTC", address: "" },
    usdc: { network: "ERC20/Solana", address: "" },
    bank: { network: "Bank", url: "", details: "" },
  },
  chat: {
    mode: "guide",
    provider: "",
    providerType: "guide",
    providerId: "",
    embedUrl: "",
    adminContact: "",
    sla: "Within 24 hours",
    intro:
      "Hi. Choose USDT, Bitcoin, USDC, or Bank, then upload proof after sending. I can guide you through the steps.",
  },
};

function normalizeConfig(config = {}) {
  const storedPaymentMethods = config.paymentMethods || {};
  const storedCampaign = config.campaign || {};
  const storedChat = config.chat || {};
  const campaign = {
    ...defaultConfig.campaign,
    ...storedCampaign,
    stats: storedCampaign.stats || defaultConfig.campaign.stats,
    budget: defaultConfig.campaign.budget.map((item, index) => ({
      ...item,
      ...((storedCampaign.budget || [])[index] || {}),
    })),
  };

  return {
    ...defaultConfig,
    ...config,
    campaign,
    paymentMethods: {
      usdt: { ...defaultConfig.paymentMethods.usdt, ...(storedPaymentMethods.usdt || {}) },
      bitcoin: { ...defaultConfig.paymentMethods.bitcoin, ...(storedPaymentMethods.bitcoin || {}) },
      usdc: { ...defaultConfig.paymentMethods.usdc, ...(storedPaymentMethods.usdc || {}) },
      bank: { ...defaultConfig.paymentMethods.bank, ...(storedPaymentMethods.bank || {}) },
    },
    chat: {
      ...defaultConfig.chat,
      ...storedChat,
    },
    proofSubmissionEndpoint: config.proofSubmissionEndpoint || defaultConfig.proofSubmissionEndpoint,
  };
}

module.exports = {
  defaultConfig,
  normalizeConfig,
};
