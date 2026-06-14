import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, getIdToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_poy1-QLnctw0ubc8oLbt4UV4lg7otwM",
  authDomain: "rmbdon-69a35.firebaseapp.com",
  projectId: "rmbdon-69a35",
  storageBucket: "rmbdon-69a35.firebasestorage.app",
  messagingSenderId: "933862548256",
  appId: "1:933862548256:web:472180ce1d0107c5c76d45",
  measurementId: "G-TM8NEKYQ6N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const adminConfigKey = "rmbtsdonations.adminConfig";
const proofInboxKey = "rmbtsdonations.proofs";
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

const adminLoginForm = document.querySelector("#admin-login-form");
const adminEmailInput = document.querySelector("#admin-email");
const adminPasswordInput = document.querySelector("#admin-password");
const adminSignout = document.querySelector("#admin-signout");
const authStatus = document.querySelector("#auth-status");
const settingsForm = document.querySelector("#settings-form");
const campaignForm = document.querySelector("#campaign-form");
const campaignStatus = document.querySelector("#campaign-status");
const settingsStatus = document.querySelector("#settings-status");
const chatSettingsForm = document.querySelector("#chat-settings-form");
const chatStatus = document.querySelector("#chat-status");
const proofList = document.querySelector("#proof-list");
const proofFilter = document.querySelector("#proof-filter");
const clearProofs = document.querySelector("#clear-proofs");
const manualRecordForm = document.querySelector("#manual-record-form");
const launchChecklist = document.querySelector("#launch-checklist");
const configJSON = document.querySelector("#config-json");
const configStatus = document.querySelector("#config-status");
const adminNavLinks = document.querySelectorAll("[data-admin-nav]");
const topbarAuthStatus = document.querySelector("#topbar-auth-status");
const sidebarAuthStatus = document.querySelector("#sidebar-auth-status");

let cachedProofs = [];
let serverHealth = null;
let serverAuthReady = false;

function readStorageJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function getAdminToken() {
  if (!auth.currentUser) return "";
  try {
    return await getIdToken(auth.currentUser);
  } catch (error) {
    return "";
  }
}

async function apiRequest(path, options = {}) {
  const token = await getAdminToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    cache: "no-store",
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }

  return payload;
}

function normalizeConfig(config = {}) {
  const storedPaymentMethods = config.paymentMethods || {};
  const storedCampaign = config.campaign || {};
  const storedChat = config.chat || {};

  return {
    ...defaultConfig,
    ...config,
    campaign: {
      ...defaultConfig.campaign,
      ...storedCampaign,
      stats: storedCampaign.stats || defaultConfig.campaign.stats,
      budget: defaultConfig.campaign.budget.map((item, index) => ({
        ...item,
        ...((storedCampaign.budget || [])[index] || {}),
      })),
    },
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

function getConfig() {
  return normalizeConfig(readStorageJSON(adminConfigKey, {}));
}

async function saveConfig(config) {
  const normalized = normalizeConfig(config);
  writeStorageJSON(adminConfigKey, normalized);

  if (!(await getAdminToken())) {
    return "local";
  }

  const payload = await apiRequest("/api/config", {
    method: "PUT",
    body: { config: normalized },
  });
  writeStorageJSON(adminConfigKey, normalizeConfig(payload.config));
  return "server";
}

function getProofs() {
  return cachedProofs;
}

function saveProofs(proofs) {
  cachedProofs = Array.isArray(proofs) ? proofs : [];
  writeStorageJSON(proofInboxKey, cachedProofs);
}

function setValue(id, value) {
  const field = document.querySelector(`#${id}`);
  if (field) {
    field.value = value || "";
  }
}

function getValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hydrateForms() {
  const config = getConfig();
  setValue("currency-symbol", config.campaign.currencySymbol);
  setValue("preset-amounts", config.campaign.presetAmounts.join(","));
  setValue("fundraising-goal", config.campaign.fundraisingGoal);
  setValue("receipt-goal", config.campaign.receiptGoal);
  setValue("campaign-eyebrow", config.campaign.eyebrow);
  setValue("hero-copy", config.campaign.heroCopy);
  setValue("dock-copy", config.campaign.dockCopy);
  setValue("budget-title", config.campaign.budgetTitle);
  config.campaign.budget.forEach((item, index) => {
    setValue(`budget-${index}-title`, item.title);
    setValue(`budget-${index}-percent`, item.percent);
    setValue(`budget-${index}-description`, item.description);
  });
  setValue("usdt-network", config.paymentMethods.usdt.network);
  setValue("usdt-address", config.paymentMethods.usdt.address);
  setValue("bitcoin-network", config.paymentMethods.bitcoin.network);
  setValue("bitcoin-address", config.paymentMethods.bitcoin.address);
  setValue("usdc-network", config.paymentMethods.usdc.network);
  setValue("usdc-address", config.paymentMethods.usdc.address);
  setValue("bank-url", config.paymentMethods.bank.url);
  setValue("bank-details", config.paymentMethods.bank.details);
  setValue("proof-endpoint", config.proofSubmissionEndpoint);
  setValue("chat-mode", config.chat.mode);
  setValue("chat-provider", config.chat.provider);
  setValue("chat-provider-type", config.chat.providerType);
  setValue("chat-provider-id", config.chat.providerId);
  setValue("chat-embed-url", config.chat.embedUrl);
  setValue("admin-contact", config.chat.adminContact);
  setValue("chat-sla", config.chat.sla);
  setValue("chat-intro", config.chat.intro);
}

function parsePresetAmounts(value) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)
    .slice(0, 6);
}

function readCampaignForm() {
  const config = getConfig();
  const presetAmounts = parsePresetAmounts(getValue("preset-amounts"));
  const receiptGoal = getValue("receipt-goal") || defaultConfig.campaign.receiptGoal;
  const currencySymbol = getValue("currency-symbol") || "$";
  const fundraisingGoal = Number(getValue("fundraising-goal")) || 0;
  const targetValue = fundraisingGoal
    ? `${currencySymbol}${fundraisingGoal.toLocaleString()}`
    : defaultConfig.campaign.stats[1].value;

  return {
    ...config,
    campaign: {
      ...config.campaign,
      currencySymbol,
      presetAmounts: presetAmounts.length ? presetAmounts : defaultConfig.campaign.presetAmounts,
      fundraisingGoal,
      receiptGoal,
      eyebrow: getValue("campaign-eyebrow"),
      heroCopy: getValue("hero-copy"),
      dockCopy: getValue("dock-copy"),
      budgetTitle: getValue("budget-title"),
      stats: [
        { value: "AR", label: "Arirang tour marketing" },
        { value: targetValue, label: fundraisingGoal ? "funding target" : "campaign spend" },
        { value: receiptGoal, label: "receipt update goal" },
        { value: "RM", label: "RMbtsdonations" },
      ],
      budget: [0, 1, 2, 3].map((index) => ({
        title: getValue(`budget-${index}-title`),
        percent: Number(getValue(`budget-${index}-percent`)) || 0,
        description: getValue(`budget-${index}-description`),
      })),
    },
  };
}

function readSettingsForm() {
  const config = getConfig();
  return {
    ...config,
    proofSubmissionEndpoint: getValue("proof-endpoint") || defaultConfig.proofSubmissionEndpoint,
    paymentMethods: {
      ...config.paymentMethods,
      usdt: {
        ...config.paymentMethods.usdt,
        network: getValue("usdt-network"),
        address: getValue("usdt-address"),
      },
      bitcoin: {
        ...config.paymentMethods.bitcoin,
        network: getValue("bitcoin-network"),
        address: getValue("bitcoin-address"),
      },
      usdc: {
        ...config.paymentMethods.usdc,
        network: getValue("usdc-network"),
        address: getValue("usdc-address"),
      },
      bank: {
        ...config.paymentMethods.bank,
        url: getValue("bank-url"),
        details: getValue("bank-details"),
      },
    },
  };
}

function readChatForm() {
  const config = getConfig();
  return {
    ...config,
    chat: {
      mode: getValue("chat-mode"),
      provider: getValue("chat-provider"),
      providerType: getValue("chat-provider-type"),
      providerId: getValue("chat-provider-id"),
      embedUrl: getValue("chat-embed-url"),
      adminContact: getValue("admin-contact"),
      sla: getValue("chat-sla"),
      intro: getValue("chat-intro"),
    },
  };
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function renderAuthStatus(message) {
  const hasToken = Boolean(auth.currentUser);
  const statusText =
    message || (hasToken ? "Logged in. Server actions are unlocked." : "Server admin controls are locked.");
  authStatus.textContent = statusText;
  topbarAuthStatus.textContent = serverAuthReady ? "Server ready" : hasToken ? "Logged in" : "Locked";
  topbarAuthStatus.classList.toggle("is-ready", serverAuthReady);
  sidebarAuthStatus.textContent = serverAuthReady
    ? "Server controls online."
    : hasToken
      ? "Token saved. API check pending."
      : "Locked until token auth.";
}

function setActiveNav(hash = window.location.hash || "#overview") {
  const activeHash = hash === "#" ? "#overview" : hash;
  adminNavLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === activeHash);
  });
}

function renderMetrics() {
  const proofs = getProofs();
  const pendingCount = proofs.filter((proof) => ["new", "pending"].includes(proof.status)).length;
  const verifiedCount = proofs.filter((proof) => proof.status === "verified").length;
  const amount = proofs.reduce((total, proof) => total + Number(proof.amount || 0), 0);

  document.querySelector("#metric-total").textContent = String(proofs.length);
  document.querySelector("#metric-pending").textContent = String(pendingCount);
  document.querySelector("#metric-verified").textContent = String(verifiedCount);
  document.querySelector("#metric-amount").textContent = `$${amount.toLocaleString()}`;
}

function renderProofs() {
  const filter = proofFilter.value;
  const proofs = getProofs().filter((proof) => filter === "all" || proof.status === filter);

  if (!proofs.length) {
    proofList.innerHTML = '<p class="security-note">No proof records match this filter.</p>';
    renderMetrics();
    return;
  }

  proofList.replaceChildren(
    ...proofs.map((proof) => {
      const card = document.createElement("article");
      const fileName = proof.file?.name || "Manual record";
      const fileSize = proof.file?.size ? ` (${Math.round(proof.file.size / 1024)} KB)` : "";
      const fileCopy = proof.file?.url
        ? `<a href="${escapeHTML(proof.file.url)}" target="_blank" rel="noreferrer">${escapeHTML(fileName)}</a>${fileSize}`
        : `${escapeHTML(fileName)}${escapeHTML(fileSize)}`;

      card.className = "proof-card";
      card.innerHTML = `
        <div>
          <header>
            <span class="badge ${escapeHTML(proof.status)}">${escapeHTML(proof.status)}</span>
            <span class="badge">${escapeHTML(proof.method)}</span>
            <span class="badge">$${escapeHTML(proof.amount || 0)}</span>
          </header>
          <h3>${escapeHTML(proof.reference || "No reference")}</h3>
          <p>${escapeHTML(proof.donorName || "Anonymous")} ${
            proof.contact ? `- ${escapeHTML(proof.contact)}` : ""
          }</p>
          <p>${fileCopy}</p>
          <p>${escapeHTML(proof.note || "No admin note provided.")}</p>
          <p>${escapeHTML(formatDate(proof.createdAt))}</p>
        </div>
        <div class="proof-actions">
          <button class="button" type="button" data-proof-status="pending" data-proof-id="${escapeHTML(proof.id)}">Pending</button>
          <button class="button primary" type="button" data-proof-status="verified" data-proof-id="${escapeHTML(proof.id)}">Verify</button>
          <button class="button danger" type="button" data-proof-status="rejected" data-proof-id="${escapeHTML(proof.id)}">Reject</button>
        </div>
      `;
      return card;
    }),
  );

  renderMetrics();
}

function renderLaunchChecklist() {
  const config = getConfig();
  const budgetTotal = config.campaign.budget.reduce((total, item) => total + Number(item.percent || 0), 0);
  const checks = [
    ["Admin token entered and accepted", serverAuthReady],
    ["Vercel Blob storage configured", Boolean(serverHealth?.blobStorage)],
    ["Preset donation amounts set", config.campaign.presetAmounts.length > 0],
    ["Budget split totals 100%", budgetTotal === 100],
    ["USDT address set", Boolean(config.paymentMethods.usdt.address)],
    ["Bitcoin address set", Boolean(config.paymentMethods.bitcoin.address)],
    ["USDC address set", Boolean(config.paymentMethods.usdc.address)],
    ["Bank transfer details set", Boolean(config.paymentMethods.bank.details || config.paymentMethods.bank.url)],
    ["Proof upload endpoint connected", config.proofSubmissionEndpoint === "/api/proofs"],
    [
      "Human live-chat provider/contact set",
      Boolean(config.chat.providerId || config.chat.embedUrl || config.chat.adminContact),
    ],
    ["Domain rmbtsdonations.com deployed and tested", false],
    ["Test donation completed for every enabled payment method", false],
  ];

  launchChecklist.replaceChildren(
    ...checks.map(([label, ready]) => {
      const item = document.createElement("li");
      item.className = ready ? "ready" : "";
      item.textContent = label;
      return item;
    }),
  );
}

function renderAll() {
  hydrateForms();
  renderAuthStatus();
  renderProofs();
  renderLaunchChecklist();
}

async function loadServerConfig() {
  try {
    const payload = await apiRequest("/api/config");
    if (payload.config) {
      writeStorageJSON(adminConfigKey, normalizeConfig(payload.config));
    }
  } catch (error) {
    authStatus.textContent = `Server config unavailable. Local preview mode active. ${error.message}`;
  }
}

async function loadHealth() {
  try {
    const payload = await apiRequest("/api/health");
    serverHealth = payload.checks || null;
  } catch (error) {
    serverHealth = null;
  }
}

async function refreshProofs() {
  if (!(await getAdminToken())) {
    serverAuthReady = false;
    saveProofs(readStorageJSON(proofInboxKey, []));
    renderProofs();
    renderLaunchChecklist();
    return;
  }

  try {
    const payload = await apiRequest("/api/proofs");
    serverAuthReady = true;
    saveProofs(payload.proofs || []);
    renderAuthStatus("Authenticated. Server proof inbox loaded.");
  } catch (error) {
    serverAuthReady = false;
    saveProofs(readStorageJSON(proofInboxKey, []));
    renderAuthStatus(`Token/API check failed: ${error.message}`);
  }

  renderProofs();
  renderLaunchChecklist();
}

async function refreshAdminData() {
  await loadHealth();
  await loadServerConfig();
  hydrateForms();
  await refreshProofs();
  renderLaunchChecklist();
}

async function saveFormConfig(readForm, statusElement, successCopy) {
  statusElement.textContent = "Saving...";
  try {
    const target = await saveConfig(readForm());
    statusElement.textContent =
      target === "server" ? `${successCopy} Server config updated.` : `${successCopy} Saved locally.`;
  } catch (error) {
    statusElement.textContent = `Save failed: ${error.message}`;
  }

  renderLaunchChecklist();
}

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value;
  if (!email || !password) {
    renderAuthStatus("Enter your admin email and password.");
    return;
  }

  renderAuthStatus("Authenticating with Firebase...");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    renderAuthStatus(`Login failed: ${error.message}`);
  }
});

adminSignout.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.body.classList.add("is-authenticated");
    adminEmailInput.value = "";
    adminPasswordInput.value = "";
    serverAuthReady = true;
    renderAuthStatus("Authenticated. Loading server controls...");
    await refreshAdminData();
  } else {
    document.body.classList.remove("is-authenticated");
    serverAuthReady = false;
    saveProofs(readStorageJSON(proofInboxKey, []));
    renderAll();
  }
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveFormConfig(readSettingsForm, settingsStatus, "Payment settings saved.");
});

campaignForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveFormConfig(readCampaignForm, campaignStatus, "Campaign and pricing settings saved.");
});

document.querySelector("#reset-settings").addEventListener("click", async () => {
  if (!confirm("Reset campaign, payment, and chat settings to defaults?")) {
    return;
  }

  localStorage.removeItem(adminConfigKey);
  try {
    if (await getAdminToken()) {
      await saveConfig(defaultConfig);
      settingsStatus.textContent = "Server settings reset to defaults.";
    } else {
      settingsStatus.textContent = "Local settings reset to defaults.";
    }
  } catch (error) {
    settingsStatus.textContent = `Reset failed: ${error.message}`;
  }
  renderAll();
});

chatSettingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveFormConfig(readChatForm, chatStatus, "Chat settings saved.");
});

manualRecordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const record = {
    manual: true,
    id: `manual-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "new",
    method: getValue("manual-method"),
    amount: getValue("manual-amount"),
    reference: getValue("manual-reference"),
    donorName: "Manual admin entry",
    contact: "",
    note: "Created from admin dashboard.",
  };

  if (await getAdminToken()) {
    try {
      const payload = await apiRequest("/api/proofs", {
        method: "POST",
        body: record,
      });
      saveProofs([payload.proof, ...getProofs()]);
    } catch (error) {
      authStatus.textContent = `Manual record failed: ${error.message}`;
      return;
    }
  } else {
    saveProofs([record, ...getProofs()]);
  }

  manualRecordForm.reset();
  renderProofs();
  renderLaunchChecklist();
});

proofFilter.addEventListener("change", renderProofs);

proofList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-proof-id]");
  if (!button) {
    return;
  }

  if (await getAdminToken()) {
    try {
      const payload = await apiRequest("/api/proofs", {
        method: "PATCH",
        body: {
          id: button.dataset.proofId,
          status: button.dataset.proofStatus,
        },
      });
      saveProofs(payload.proofs || []);
    } catch (error) {
      authStatus.textContent = `Proof update failed: ${error.message}`;
      return;
    }
  } else {
    const proofs = getProofs().map((proof) =>
      proof.id === button.dataset.proofId
        ? { ...proof, status: button.dataset.proofStatus, reviewedAt: new Date().toISOString() }
        : proof,
    );
    saveProofs(proofs);
  }

  renderProofs();
});

clearProofs.addEventListener("click", async () => {
  if (!confirm("Clear proof records? Stored proof files may remain in Blob storage.")) {
    return;
  }

  if (await getAdminToken()) {
    try {
      await apiRequest("/api/proofs", { method: "DELETE" });
    } catch (error) {
      authStatus.textContent = `Clear failed: ${error.message}`;
      return;
    }
  }

  saveProofs([]);
  renderProofs();
  renderLaunchChecklist();
});

document.querySelector("#export-config").addEventListener("click", () => {
  configJSON.value = JSON.stringify(
    {
      config: getConfig(),
      proofs: getProofs(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
  configStatus.textContent = "Config exported into the text area.";
});

document.querySelector("#import-config").addEventListener("click", async () => {
  try {
    const payload = JSON.parse(configJSON.value);
    if (payload.config) {
      await saveConfig(payload.config);
    }
    if (Array.isArray(payload.proofs)) {
      saveProofs(payload.proofs);
    }
    configStatus.textContent = (await getAdminToken())
      ? "Config imported and synced to server."
      : "Config imported locally.";
    renderAll();
  } catch (error) {
    configStatus.textContent = "Import failed. Check the JSON format.";
  }
});

window.addEventListener("hashchange", () => {
  setActiveNav();
});

saveProofs(readStorageJSON(proofInboxKey, []));
setActiveNav();
renderAll();
refreshAdminData();
