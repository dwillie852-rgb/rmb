import os

with open('styles.css', 'r') as f:
    lines = f.readlines()

# Find the start of the bad CSS block
start_idx = -1
for i, line in enumerate(lines):
    if "/* Campaign Progress Bar */" in line:
        start_idx = i
        break

if start_idx != -1:
    lines = lines[:start_idx]

premium_css = """
/* Premium Brutalist Progress Bar */
.campaign-progress {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background-color: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  position: relative;
  overflow: hidden;
}

.campaign-progress::before {
  content: "";
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 70%);
  pointer-events: none;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1rem;
  font-family: inherit;
  text-transform: uppercase;
}

.progress-labels strong {
  font-size: 1.25rem;
  color: var(--ink);
  letter-spacing: 0.05em;
  font-weight: 700;
}

.progress-labels span {
  font-size: 0.8rem;
  color: var(--muted);
  letter-spacing: 0.1em;
}

.progress-track {
  width: 100%;
  height: 4px;
  background-color: var(--panel-2);
  border: 1px solid var(--line);
  position: relative;
}

.progress-fill {
  height: 100%;
  background-color: var(--ink);
  position: relative;
  transition: width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.progress-fill::after {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.9),
    transparent
  );
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Premium Success Dialog */
.success-dialog {
  background-color: var(--panel);
  color: var(--ink);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  padding: 3rem 2rem;
  max-width: 420px;
  text-align: center;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.success-dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.success-dialog .dialog-content h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.success-dialog .dialog-content p {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--muted);
}

.success-dialog .dialog-content p strong {
  color: var(--ink);
}

.success-dialog .dialog-content button {
  width: 100%;
  margin-top: 0.75rem;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.success-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.5rem;
  background-color: var(--panel-2);
  border: 1px solid var(--line-strong);
  color: var(--ink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: 0.1s;
}

.success-icon svg {
  width: 32px;
  height: 32px;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
"""

with open('styles.css', 'w') as f:
    f.writelines(lines)
    f.write(premium_css)

