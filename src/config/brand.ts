export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Busongo",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT || "Busongo",
  tagline: "The #1 backtesting & research platform for Zambian markets",
  description:
    "AI-powered stock research and backtesting for the Lusaka Securities Exchange. Screen LuSE stocks, analyse fundamentals, track GRZ bonds and T-bills, build strategies and backtest ideas.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "mellorison@gmail.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "+260955646446",
  address: process.env.NEXT_PUBLIC_ADDRESS || "Lusaka, Zambia",
  org: process.env.NEXT_PUBLIC_ORG_NAME || "OrisonWorks",
  currency: "ZMW",
  currencySymbol: "K",
};
export type Brand = typeof brand;
