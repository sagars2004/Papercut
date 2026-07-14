export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  color: string;
};

export const MARKET_ASSETS: MarketAsset[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "#9ba4ff" },
  { id: "solana", symbol: "SOL", name: "Solana", color: "#a8ffcf" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", color: "#5e8cff" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", color: "#e84142" },
  { id: "aave", symbol: "AAVE", name: "Aave", color: "#a8d5cc" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", color: "#c2a633" },
];
