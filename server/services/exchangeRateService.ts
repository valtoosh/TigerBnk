const CACHE_TTL = 10 * 60 * 1000;

interface RateCache {
  rates: Record<string, number>;
  lastFetch: number;
}

const cache: RateCache = { rates: {}, lastFetch: 0 };

const FALLBACK_RATES: Record<string, number> = {
  AED: 1, USD: 0.2722, INR: 22.78, PHP: 15.25, GBP: 0.2166, IDR: 4327,
};

export async function getExchangeRates(baseCurrency: string = "AED"): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - cache.lastFetch < CACHE_TTL && Object.keys(cache.rates).length > 0) {
    return cache.rates;
  }

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    const data = await response.json();
    if (data.result === "success" && data.rates) {
      cache.rates = data.rates;
      cache.lastFetch = now;
      return data.rates;
    }
  } catch (err) {
    console.error("[ExchangeRate] Failed to fetch rates:", err);
  }

  return cache.rates && Object.keys(cache.rates).length > 0 ? cache.rates : FALLBACK_RATES;
}

export function getFeePercent(_from: string, _to: string): number {
  return 0;
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ convertedAmount: number; rate: number; fee: number; feePercent: number }> {
  const rates = await getExchangeRates("AED");
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  const rate = toRate / fromRate;
  const convertedAmount = amount * rate;

  return { convertedAmount, rate, fee: 0, feePercent: 0 };
}
