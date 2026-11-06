export type SecurityMeta = {
  symbol: string;
  name: string;
  sector: string;
  board?: "Main" | "Alternative";
  currency?: "ZMW" | "USD";
  listedYear?: number;
  description?: string;
};

// Source: https://www.luse.co.zm/trading/listed-companies/
export const LUSE_SECURITIES: SecurityMeta[] = [
  { symbol: "AECI", name: "AECI Mining Explosives Plc", sector: "Mining Services", listedYear: 2006, description: "Formerly AEL Zambia Plc; manufactures and distributes bulk emulsion, packaged explosives, initiating systems and accessories." },
  { symbol: "ATEL", name: "Airtel Networks Zambia Plc", sector: "Telecommunications", listedYear: 2008, description: "Cellular telecommunication services to individual and business customers in Zambia." },
  { symbol: "BATA", name: "Bata Zambia Plc", sector: "Consumer Goods", listedYear: 2009, description: "Footwear manufacturer and retailer operating in Zambia since 1937." },
  { symbol: "BATZ", name: "British American Tobacco Zambia Plc", sector: "Consumer Staples", listedYear: 1995, description: "Produces tobacco products for local and international markets." },
  { symbol: "CCAF", name: "CEC Africa Investments Ltd", sector: "Energy", listedYear: 2016, description: "Pan-African power-sector investment company incorporated in Mauritius." },
  { symbol: "CECZ", name: "Copperbelt Energy Corporation Plc", sector: "Energy", listedYear: 2007, description: "Electricity generation, transmission, distribution and supply in Zambia and Nigeria." },
  { symbol: "CHIL", name: "Chilanga Cement Plc", sector: "Industrials", listedYear: 1995, description: "Cement producer for construction, road building and civil engineering." },
  { symbol: "DCZM", name: "DotCom Zambia Plc", sector: "Technology", board: "Alternative", listedYear: 2025, description: "Digital tolling and payment infrastructure; first listing on the LuSE Alternative Market." },
  { symbol: "FARM", name: "FARM", sector: "Agriculture" },
  { symbol: "KLRE", name: "Klapton Reinsurance Plc", sector: "Insurance", listedYear: 2026, description: "Reinsurance services across Zambia, Africa, the Middle East and beyond." },
  { symbol: "MAFS", name: "Madison Financial Services Plc", sector: "Financial Services", listedYear: 2014, description: "Asset and wealth management, corporate administration and investment management." },
  { symbol: "NATB", name: "National Breweries Plc", sector: "Beverages", listedYear: 1998, description: "Zambian beverage producer of beer, lager and other alcoholic beverages." },
  { symbol: "PMDZ", name: "PMDZ", sector: "Other" },
  { symbol: "PUMA", name: "Puma Energy Zambia Plc", sector: "Energy", listedYear: 2002, description: "Integrated energy supply group delivering domestic fuel and related services." },
  { symbol: "REIZUSD", name: "Real Estate Investments Zambia Plc (USD)", sector: "Real Estate", currency: "USD", listedYear: 1996, description: "Real estate investment, development and management company." },
  { symbol: "SCBL", name: "Standard Chartered Bank Zambia Plc", sector: "Banking", listedYear: 1998, description: "Retail and corporate banking, credit cards and treasury services." },
  { symbol: "SHOP", name: "Shoprite Holdings Ltd", sector: "Retail", listedYear: 2003, description: "Supermarket and retail group, dual-listed on the LuSE." },
  { symbol: "ZABR", name: "Zambian Breweries Plc", sector: "Beverages", listedYear: 1997, description: "Leading brewer and soft-drink maker based in Lusaka." },
  { symbol: "ZCCM-IH", name: "ZCCM Investments Holdings Plc", sector: "Mining", listedYear: 2000, description: "Investment holding company managing the Zambian Government's mineral interests." },
  { symbol: "ZFCO", name: "Zambia Forestry and Forest Industries Corp. Plc", sector: "Materials", listedYear: 2020, description: "ZAFFICO: forest and wood products." },
  { symbol: "ZMBF", name: "Zambeef Products Plc", sector: "Agriculture", listedYear: 2005, description: "Integrated cold-chain food and agribusiness: beef, chicken, pork, dairy, flour and stockfeed." },
  { symbol: "ZMFA", name: "Metal Fabricators of Zambia Plc", sector: "Industrials", listedYear: 2004, description: "ZAMEFA: processes copper cathode into cable." },
  { symbol: "ZMRE", name: "Zambia Reinsurance Plc", sector: "Insurance", listedYear: 2013, description: "Reinsurance services to insurance companies." },
  { symbol: "ZNCO", name: "Zambia National Commercial Bank Plc", sector: "Banking", listedYear: 2008, description: "Zanaco: retail, corporate, agri-business and public-sector banking." },
  { symbol: "ZSUG", name: "Zambia Sugar Plc", sector: "Consumer Staples", listedYear: 1996, description: "One of the largest sugar producers in Southern Africa." },
];

export const CRYPTO_SYMBOLS: { symbol: string; name: string; pair: string }[] = [
  { symbol: "BTC", name: "Bitcoin", pair: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", pair: "ETHUSDT" },
  { symbol: "BNB", name: "BNB", pair: "BNBUSDT" },
  { symbol: "SOL", name: "Solana", pair: "SOLUSDT" },
  { symbol: "XRP", name: "XRP", pair: "XRPUSDT" },
  { symbol: "ADA", name: "Cardano", pair: "ADAUSDT" },
  { symbol: "DOGE", name: "Dogecoin", pair: "DOGEUSDT" },
  { symbol: "TRX", name: "TRON", pair: "TRXUSDT" },
  { symbol: "AVAX", name: "Avalanche", pair: "AVAXUSDT" },
  { symbol: "LINK", name: "Chainlink", pair: "LINKUSDT" },
  { symbol: "DOT", name: "Polkadot", pair: "DOTUSDT" },
  { symbol: "LTC", name: "Litecoin", pair: "LTCUSDT" },
];
