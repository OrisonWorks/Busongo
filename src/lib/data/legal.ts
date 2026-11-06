import { brand } from "@/config/brand";
export const LEGAL: Record<string, { title: string; md: string }> = {
  terms: { title: "Terms of Service", md: `These terms govern your use of ${brand.name}. By creating an account you agree to them.

## Research only
${brand.name} provides market data, analytics and educational tools. Nothing on the platform is investment advice or a recommendation to buy or sell any security. Past performance, including backtest results, does not guarantee future returns. Consult a broker licensed by the Securities and Exchange Commission of Zambia before investing.

## Data
Data is sourced from public releases of the Lusaka Securities Exchange, the Bank of Zambia and other providers. It may be delayed, incomplete or contain errors. We do not guarantee its accuracy.

## Accounts
You are responsible for keeping your login details secure. One account per person; sharing accounts is not allowed.

## Subscriptions
Paid plans are prepaid for the period selected and do not renew automatically. Plan limits are shown on the pricing page.

## Acceptable use
You may not scrape, resell or redistribute platform data, or attempt to disrupt the service.

## Governing law
These terms are governed by the laws of the Republic of Zambia.` },
  privacy: { title: "Privacy Policy", md: `We take your privacy seriously and process personal data in line with the Zambian Data Protection Act No. 3 of 2021.

## What we collect
- Account details: name, email, optional mobile number.
- Payment records: plan, amount, Mobile Money reference and status. We never see your Mobile Money PIN.
- Usage: strategies, scans, alerts, journal entries and AI chat history that you create.

## How we use it
To provide the service, process payments, send alerts you request, and improve the platform. We do not sell your data.

## Your rights
You can request a copy of your data or ask us to delete your account at any time by emailing ${brand.email}.

## Cookies
We use a single, essential session cookie to keep you signed in.` },
  refund: { title: "Refund Policy", md: `## Eligibility
If a paid plan does not work as described, contact ${brand.email} within 7 days of payment for a full refund.

## Failed or duplicate payments
Payments debited but not activated, or charged twice, are refunded in full to the original Mobile Money wallet.

## Processing
Approved refunds are processed within 5 business days.` },
};
