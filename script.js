let proofSubmissionEndpoint = "/api/proofs";

const defaultCampaign = {
  currencySymbol: "$",
  presetAmounts: [1000, 3000, 5000, 10000],
  fundraisingGoal: 85000,
  receiptGoal: "24h",
  eyebrow: "RMbtsdonations.com / Independent ARMY campaign",
  heroCopy:
    "A fan donation hub for Kim Namjoon supporters funding Arirang tour marketing, poster runs, flyers, external PR, fan visibility, and transparent campaign logistics.",
  dockCopy: "Support with USDT, Bitcoin, USDC, or bank transfer once admin details are live.",
  budgetTitle: "Every donation gets a job.",
  stats: [
    { value: "AR", label: "Arirang tour marketing" },
    { value: "$37,500", label: "raised so far" },
    { value: "$85,000", label: "funding target" },
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
};

const paymentMethods = {
  usdt: {
    label: "USDT",
    type: "crypto",
    network: "TRC20/ERC20",
    address: "",
    detailLabel: "USDT wallet address",
    placeholder: "Awaiting admin-approved USDT wallet address",
    warning: "Confirm whether admins are using TRC20 or ERC20 before sending USDT.",
    instructions: [
      "Copy the admin-approved USDT wallet address.",
      "Confirm the network before sending. Wrong-network transfers may be lost.",
      "Send the selected amount, then upload a screenshot or transaction hash.",
    ],
  },
  bitcoin: {
    label: "Bitcoin",
    type: "crypto",
    network: "BTC",
    address: "",
    detailLabel: "Bitcoin wallet address",
    placeholder: "Awaiting admin-approved Bitcoin wallet address",
    warning: "Send Bitcoin only through the BTC network.",
    instructions: [
      "Copy the admin-approved Bitcoin wallet address.",
      "Send from your wallet or exchange using the BTC network.",
      "Upload the transaction hash or a screenshot after the transfer broadcasts.",
    ],
  },
  usdc: {
    label: "USDC",
    type: "crypto",
    network: "ERC20/Solana",
    address: "",
    detailLabel: "USDC wallet address",
    placeholder: "Awaiting admin-approved USDC wallet address",
    warning: "Confirm whether admins are using ERC20, Solana, or another USDC network.",
    instructions: [
      "Copy the admin-approved USDC wallet address.",
      "Match the exact network listed by the fanbase admin.",
      "Upload proof with the transaction hash so the donation can be reconciled.",
    ],
  },
  bank: {
    label: "Bank transfer",
    type: "bank",
    network: "Bank",
    url: "",
    details: "",
    detailLabel: "Bank transfer details",
    placeholder: "Awaiting admin-approved bank transfer details",
    warning: "Use the exact reference shown by admins so the transfer can be matched.",
    instructions: [
      "Open your banking app and use the approved account details.",
      "Include your fan handle or the listed reference if admins provide one.",
      "Upload your transfer receipt after the payment is submitted.",
    ],
  },
};


const header = document.querySelector("[data-header]");
const amountGrid = document.querySelector("[data-amount-grid]");
const customAmount = document.querySelector("#custom-amount");
const paymentButtons = document.querySelectorAll(".payment-button");
const paymentStatus = document.querySelector("#payment-status");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#site-menu");
const noteForm = document.querySelector(".note-form");
const notesList = document.querySelector(".notes-list");
const paymentFlow = document.querySelector("#payment-flow");
const methodTabs = document.querySelectorAll("[data-flow-method]");
const selectedAmountOutput = document.querySelector("[data-selected-amount]");
const paymentMethodLabel = document.querySelector("#payment-method-label");
const paymentMethodTitle = document.querySelector("#payment-method-title");
const paymentMethodWarning = document.querySelector("#payment-method-warning");
const paymentDetailLabel = document.querySelector("#payment-detail-label");
const paymentDetailValue = document.querySelector("#payment-detail-value");
const paymentNetworkNote = document.querySelector("#payment-network-note");
const paymentInstructions = document.querySelector("#payment-instructions");
const copyPaymentDetail = document.querySelector("#copy-payment-detail");
const proofForm = document.querySelector("#proof-form");
const proofFile = document.querySelector("#proof-file");
const proofMethodBadge = document.querySelector("#proof-method-badge");
const proofStatus = document.querySelector("#proof-status");
const chatToggle = document.querySelector(".chat-toggle");
const chatPanel = document.querySelector("#chat-panel");
const chatClose = document.querySelector(".chat-close");
const chatMessages = document.querySelector("#chat-messages");
const chatPrompts = document.querySelectorAll("[data-chat-prompt]");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");

let selectedAmount = "10";
let selectedPaymentMethod = "usdt";

function formatAmount(amount) {
  return `${campaignSettings.currencySymbol}${amount}`;
}

function renderCampaignSettings() {
  document.querySelector("[data-currency-symbol]").textContent = campaignSettings.currencySymbol;
  document.querySelector('[data-campaign="eyebrow"]').textContent = campaignSettings.eyebrow;
  document.querySelector('[data-campaign="heroCopy"]').textContent = campaignSettings.heroCopy;
  document.querySelector('[data-campaign="dockCopy"]').textContent = campaignSettings.dockCopy;
  document.querySelector('[data-campaign="budgetTitle"]').textContent = campaignSettings.budgetTitle;

  campaignSettings.stats.forEach((stat, index) => {
    const value = document.querySelector(`[data-stat-value="${index}"]`);
    const label = document.querySelector(`[data-stat-label="${index}"]`);
    if (value) {
      value.textContent = stat.value;
    }
    if (label) {
      label.textContent = stat.label;
    }
  });

  campaignSettings.budget.forEach((item, index) => {
    const row = document.querySelector(`[data-budget-row="${index}"]`);
    if (!row) {
      return;
    }
    row.querySelector("h3").textContent = item.title;
    row.querySelector("p").textContent = item.description;
    row.querySelector("strong").textContent = `${item.percent}%`;
  });

  amountGrid.replaceChildren(
    ...campaignSettings.presetAmounts.map((amount, index) => {
      const button = document.createElement("button");
      button.className = `amount-option${index === 0 ? " is-selected" : ""}`;
      button.type = "button";
      button.dataset.amount = String(amount);
      button.textContent = formatAmount(amount);
      return button;
    }),
  );

  selectedAmount = String(campaignSettings.presetAmounts[0] || 10);
}

function setSelectedAmount(amount) {
  selectedAmount = amount;
  document.querySelectorAll(".amount-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.amount === amount);
  });
  renderPaymentMethod(selectedPaymentMethod);
}

function getDonationAmount() {
  const customValue = customAmount.value.trim();
  if (customValue) {
    const parsed = Number(customValue);
    return Number.isFinite(parsed) && parsed > 0 ? String(Math.round(parsed)) : selectedAmount;
  }

  return selectedAmount;
}

function buildDonationUrl(baseUrl, amount) {
  if (!baseUrl) {
    return "";
  }

  const url = new URL(baseUrl, window.location.href);
  if (!url.searchParams.has("amount")) {
    url.searchParams.set("amount", amount);
  }
  return url.toString();
}

function getPaymentDetail(method) {
  return method.address || method.details || "";
}

function renderPaymentMethod(methodKey) {
  const method = paymentMethods[methodKey] || paymentMethods.usdt;
  const amount = getDonationAmount();
  const detail = getPaymentDetail(method);

  selectedPaymentMethod = methodKey;
  methodTabs.forEach((tab) => {
    tab.classList.toggle("is-selected", tab.dataset.flowMethod === methodKey);
  });

  if (selectedAmountOutput) {
    selectedAmountOutput.textContent = formatAmount(amount);
  }
  paymentMethodLabel.textContent = method.label;
  paymentMethodTitle.textContent = `${method.label} donation details`;
  paymentMethodWarning.textContent = method.warning;
  paymentDetailLabel.textContent = method.detailLabel;
  paymentDetailValue.textContent = detail || method.placeholder;
  paymentNetworkNote.textContent = `Network: ${method.network}. ${method.type === "crypto" ? "Check network carefully before sending." : "Use the listed reference when admins provide one."}`;
  proofMethodBadge.textContent = method.label;
  copyPaymentDetail.disabled = !detail;

  paymentInstructions.replaceChildren(
    ...method.instructions.map((instruction) => {
      const item = document.createElement("li");
      item.textContent = instruction;
      return item;
    }),
  );
}

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}

function closeMenu() {
  navToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
  document.body.classList.remove("is-menu-open");
}

function openPaymentMethod(methodKey, shouldScroll = false) {
  const method = paymentMethods[methodKey];
  if (!method) {
    return;
  }

  renderPaymentMethod(methodKey);
  paymentStatus.classList.add("is-live");
  paymentStatus.textContent = `${method.label} payment page opened. Upload proof after sending funds.`;

  if (shouldScroll) {
    paymentFlow.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function appendChatMessage(text, type = "guide") {
  const message = document.createElement("p");
  message.className = `chat-message is-${type}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderChatSettings() {
  const widget = document.querySelector(".chat-widget");
  const firstGuideMessage = chatMessages.querySelector(".chat-message.is-guide");

  if (adminChatSettings.intro && firstGuideMessage) {
    firstGuideMessage.textContent = adminChatSettings.intro;
  }

  if (adminChatSettings.mode === "off") {
    widget.hidden = true;
  }

  loadChatProvider();
}

function loadExternalScript(src, id) {
  if (!src || document.querySelector(`#${id}`)) {
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.body.append(script);
}

function loadChatProvider() {
  if (adminChatSettings.mode !== "provider") {
    return;
  }

  const providerType = String(adminChatSettings.providerType || "").toLowerCase();
  const providerId = String(adminChatSettings.providerId || "").trim();
  const embedUrl = String(adminChatSettings.embedUrl || "").trim();

  if (providerType === "tawk" && providerId) {
    loadExternalScript(`https://embed.tawk.to/${providerId}/default`, "rmbts-tawk-chat");
    return;
  }

  if (providerType === "crisp" && providerId) {
    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = providerId;
    loadExternalScript("https://client.crisp.chat/l.js", "rmbts-crisp-chat");
    return;
  }

  if (providerType === "custom" && embedUrl) {
    loadExternalScript(embedUrl, "rmbts-custom-chat");
  }
}

function saveProofLocally(record) {
  const proofRecords = readStorageJSON(proofInboxKey, []);
  proofRecords.unshift(record);
  writeStorageJSON(proofInboxKey, proofRecords);
}

function isLocalHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function buildProofRecord(formData, method, amount, file) {
  return {
    id: `proof-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "new",
    method: method.label,
    methodKey: selectedPaymentMethod,
    amount,
    network: method.network,
    donorName: String(formData.get("donorName") || "Anonymous").trim(),
    contact: String(formData.get("contact") || "").trim(),
    reference: String(formData.get("reference") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    file: {
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
    },
  };
}

function getChatReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes("usdt")) {
    return "For USDT, open the USDT payment page, confirm the exact network listed by admins, send funds, then upload the screenshot or transaction hash.";
  }
  if (lower.includes("bitcoin") || lower.includes("btc")) {
    return "For Bitcoin, use only the BTC address shown on the Bitcoin page. After sending, upload the transaction hash or receipt screenshot.";
  }
  if (lower.includes("usdc")) {
    return "For USDC, match the exact network before sending. ERC20 and Solana addresses are not interchangeable.";
  }
  if (lower.includes("bank")) {
    return "For bank transfer, use the approved account details and include the reference admins provide. Upload the bank receipt afterward.";
  }
  if (lower.includes("proof") || lower.includes("receipt") || lower.includes("upload")) {
    return "Use the proof form on the payment page. Add your transaction hash or bank reference, attach a screenshot or PDF, then submit proof.";
  }
  if (lower.includes("admin") || lower.includes("human") || lower.includes("live")) {
    const provider = adminChatSettings.provider ? ` via ${adminChatSettings.provider}` : "";
    const contact = adminChatSettings.adminContact ? ` Contact: ${adminChatSettings.adminContact}.` : "";
    const sla = adminChatSettings.sla ? ` Expected reply: ${adminChatSettings.sla}.` : "";
    return `Human support can be connected${provider}.${contact}${sla} For now, I can guide the donation steps and proof upload flow.`;
  }

  return "Choose a payment method, copy the approved details, send funds, then upload proof. Ask me about USDT, Bitcoin, USDC, Bank, or proof upload.";
}

amountGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".amount-option");
  if (!button) {
    return;
  }

  customAmount.value = "";
  setSelectedAmount(button.dataset.amount);
});

customAmount.addEventListener("input", () => {
  document.querySelectorAll(".amount-option").forEach((button) => button.classList.remove("is-selected"));
  renderPaymentMethod(selectedPaymentMethod);
});

paymentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPaymentMethod(button.dataset.payment, true);
  });
});

methodTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    openPaymentMethod(tab.dataset.flowMethod);
  });
});

copyPaymentDetail.addEventListener("click", () => {
  const method = paymentMethods[selectedPaymentMethod];
  const detail = getPaymentDetail(method);
  if (!detail) {
    return;
  }

  navigator.clipboard
    .writeText(detail)
    .then(() => {
      proofStatus.textContent = `${method.label} details copied. Send the selected amount, then upload proof.`;
    })
    .catch(() => {
      proofStatus.textContent = `Copy failed. ${method.label} details: ${detail}`;
    });
});

proofFile.addEventListener("change", () => {
  const file = proofFile.files[0];
  if (file) {
    proofStatus.textContent = `${file.name} attached. Add your transaction reference and submit proof.`;
  }
});

proofForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!proofForm.checkValidity()) {
    proofForm.reportValidity();
    return;
  }

  const file = proofFile.files[0];
  if (!file) {
    proofStatus.textContent = "Attach a screenshot or PDF proof before submitting.";
    return;
  }

  proofStatus.textContent = "Submitting proof...";
  const formData = new FormData(proofForm);
  
  // Hardcoded FormSubmit Endpoint. 
  // IMPORTANT: Replace YOUR_EMAIL_HERE with your real email.
  const endpoint = "https://formsubmit.co/ajax/YOUR_EMAIL_HERE";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Always show success dialog as requested by user
    document.getElementById("success-dialog").showModal();
    proofStatus.textContent = "Proof submitted successfully.";
    proofForm.reset();
  } catch (error) {
    // Show success dialog anyway for fallback testing
    document.getElementById("success-dialog").showModal();
    proofStatus.textContent = "Proof submission simulated (replace YOUR_EMAIL_HERE).";
    proofForm.reset();
  }
});

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("is-menu-open", !isOpen);
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    closeMenu();
  }
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = noteForm.querySelector("#fan-name");
  const noteInput = noteForm.querySelector("#fan-note");
  const name = nameInput.value.trim() || "Purple Fan";
  const note = noteInput.value.trim();

  if (!note) {
    noteInput.focus();
    return;
  }

  const article = document.createElement("article");
  const strong = document.createElement("strong");
  const paragraph = document.createElement("p");

  strong.textContent = name.slice(0, 30);
  paragraph.textContent = note.slice(0, 120);
  article.append(strong, paragraph);
  notesList.prepend(article);
  noteForm.reset();
});

chatToggle.addEventListener("click", () => {
  const isOpen = chatToggle.getAttribute("aria-expanded") === "true";
  chatToggle.setAttribute("aria-expanded", String(!isOpen));
  chatPanel.hidden = isOpen;
  if (!isOpen) {
    chatInput.focus();
  }
});

chatClose.addEventListener("click", () => {
  chatToggle.setAttribute("aria-expanded", "false");
  chatPanel.hidden = true;
});

chatPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.dataset.chatPrompt;
    appendChatMessage(prompt, "user");
    appendChatMessage(getChatReply(prompt), "guide");
  });
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) {
    return;
  }

  appendChatMessage(text, "user");
  chatInput.value = "";
  appendChatMessage(getChatReply(text), "guide");
});

window.addEventListener("scroll", updateHeader, { passive: true });

async function initPage() {
  updateHeader();
  renderCampaignSettings();
  renderChatSettings();
  renderPaymentMethod(selectedPaymentMethod);
}

initPage();
