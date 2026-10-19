# Nexus Bike store

## Order email setup

The checkout sends an order request email to `hayden.ireland24@icloud.com`. It
does not collect payment; shipping and final pricing still need to be confirmed
with the customer.

### 1. Create a Resend account and API key

1. Sign up at [resend.com](https://resend.com).
2. Add and verify a domain you own in Resend. Resend requires a verified sender
   domain to send production email.
3. Create an API key with permission to send email. Keep it private; never put
   it in `script.js`, `index.html`, or any other browser file.

### 2. Configure the local server

1. Install Node.js 20.6 or newer.
2. Copy `.env.example` to `.env` in this folder.
3. In `.env`, replace `re_replace_with_your_resend_api_key` with your API key.
4. Replace `orders@your-verified-domain.com` with an address at the verified
   domain you added to Resend. Keep the `Nexus Bike Orders <...>` format.
5. Keep `ORDER_TO_EMAIL` set to the email address where you want order notices.
6. Open PowerShell in this folder and run:

   ```powershell
   npm run start:local
   ```

7. Open `http://localhost:3000`, add a product to the cart, and submit a test
   order. Check the Resend dashboard if you need to troubleshoot delivery.

The `.env` file is excluded from Git. Do not share or commit it.

### 3. Deploy

Deploy the project to a host that runs Node.js web servers (not static-only
hosting). Set `RESEND_API_KEY`, `ORDER_TO_EMAIL`, and `ORDER_FROM_EMAIL` as
private environment variables in the hosting dashboard, then use `npm start`
as the start command. Do not upload `.env` or put the API key in frontend code.

The server recalculates item names and prices itself, validates submitted
customer/cart data, and applies a small per-IP submission limit. Prices are
order-request estimates; no payment is processed.
