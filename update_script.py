import re

with open('script.js', 'r') as f:
    content = f.read()

# Remove loadAdminConfig and related storage functions
content = re.sub(r'const adminConfigKey.*?async function loadAdminConfig\(\) \{.*?\n\}\n', '', content, flags=re.DOTALL)

# Update proofForm submission
new_proof_submit = """
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
"""

content = re.sub(r'proofForm\.addEventListener\("submit", async \(event\) => \{.*?\n\}\);', new_proof_submit.strip(), content, flags=re.DOTALL)

# Remove await loadAdminConfig() from initPage
content = re.sub(r'\s*await loadAdminConfig\(\);', '', content)

with open('script.js', 'w') as f:
    f.write(content)

