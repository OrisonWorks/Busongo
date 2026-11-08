import { brand } from "@/config/brand";
import { PAYMENTS_ENABLED, WEB3_ENABLED } from "@/config/features";
export const LEGAL: Record<string, { title: string; md: string }> = {
  terms: { title: "Terms of Service", md: `These terms govern your use of ${brand.name}. By creating an account you agree to them.

## Research only
${brand.name} is a research and education tool. It provides market data, analytics and educational content only.
- ${brand.name} is not a broker, dealer, investment adviser or fund manager, and is not licensed by the Securities and Exchange Commission of Zambia to give advice.
- You cannot buy, sell or trade any security, currency or digital asset on ${brand.name}, and we never hold your money or assets.
- Nothing on the platform, including scanner results, backtests, the daily brief and AI answers, is investment advice or a recommendation to buy, sell or hold anything.
- Past performance, including backtest results, does not guarantee future returns.

Any investment decision is yours alone. Speak to a broker or adviser licensed by the Securities and Exchange Commission of Zambia before investing.

## Data
Data is sourced from public releases of the Lusaka Securities Exchange, the Bank of Zambia and other providers. It may be delayed, incomplete or contain errors. We do not guarantee its accuracy.

## Accounts
You are responsible for keeping your login details secure. One account per person; sharing accounts is not allowed.

${PAYMENTS_ENABLED ? `## Subscriptions
Paid plans are prepaid for the period selected and do not renew automatically. Plan limits are shown on the pricing page.` : `## Free service
${brand.name} is free. We do not charge for any feature or accept payments of any kind. Fair-use limits, such as a monthly cap on AI messages, keep the service available for everyone.`}

## Acceptable use
You may not scrape, resell or redistribute platform data, or attempt to disrupt the service.

## Governing law
These terms are governed by the laws of the Republic of Zambia.` },
  privacy: { title: "Privacy Policy", md: `We take your privacy seriously and process personal data in line with the Zambian Data Protection Act No. 3 of 2021.

## What we collect
- Account details: name, email, optional mobile number.
${PAYMENTS_ENABLED ? "- Payment records: plan, amount, Mobile Money reference and status. We never see your Mobile Money PIN.\n" : ""}${WEB3_ENABLED ? "- Wallet and public profile: a wallet address if you link one, and the handle and bio you choose. If you make your profile public, these and your ledger records are visible to anyone. Ledger records are permanent fingerprints and cannot be removed once recorded.\n" : ""}- Usage: strategies, scans, alerts, journal entries and AI chat history that you create.

## How we use it
To provide the service${PAYMENTS_ENABLED ? ", process payments" : ""}, send alerts you request, and improve the platform. We do not sell your data.

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
