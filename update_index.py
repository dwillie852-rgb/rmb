import re

with open('index.html', 'r') as f:
    content = f.read()

# Add the success dialog before </body>
dialog_html = """
    <dialog id="success-dialog" class="success-dialog">
      <div class="dialog-content">
        <h2>Donation Submitted Successfully!</h2>
        <p>Thank you for supporting the campaign.</p>
        <p><strong>IMPORTANT:</strong> Please click the Live Donation Guide chat below to confirm your payment with an admin, or if you encounter any problems.</p>
        <button class="button button-primary" onclick="document.getElementById('success-dialog').close(); document.querySelector('.chat-toggle').click();">Talk to Livechat</button>
        <button class="button" onclick="document.getElementById('success-dialog').close()">Close</button>
      </div>
    </dialog>
"""

if "id=\"success-dialog\"" not in content:
    content = content.replace("</body>", dialog_html + "\n  </body>")

with open('index.html', 'w') as f:
    f.write(content)

