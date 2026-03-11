// ============================================================
// 💰 PRICE FORMULA — Edit ONLY this file to change the formula
// ============================================================

/**
 * Calculates the DZD price from CNY price + settings
 *
 * Current formula:
 *   Step 1: CNY → USD:  price_cny × cny_usd_rate
 *   Step 2: + Shipment: + shipment_fee_usd
 *   Step 3: USD → DZD:  total_usd × usd_dzd_rate
 *
 * @param {number} priceCNY - Car price in Chinese Yuan
 * @param {object} settings - { cny_usd_rate, usd_dzd_rate, shipment_fee_usd }
 * @returns {number|null} Price in DZD
 */
export const calculateDZD = (priceCNY, settings) => {
  if (!priceCNY || !settings) return null;
  const { cny_usd_rate, usd_dzd_rate, shipment_fee_usd } = settings;
  if (!cny_usd_rate || !usd_dzd_rate) return null;

  const priceUSD = priceCNY * cny_usd_rate;
  const totalUSD = priceUSD + (shipment_fee_usd || 0);
  const priceDZD = totalUSD * usd_dzd_rate;

  return Math.round(priceDZD);
};

// Currency API — using exchangerate-api.com (free tier: 1500 req/month)
const CURRENCY_API_KEY = '12e61ac4e60a27c7440eadb3'; // get free key at https://www.exchangerate-api.com
const CURRENCY_API_URL = `https://v6.exchangerate-api.com/v6/${CURRENCY_API_KEY}/latest/USD`;

/**
 * Fetches live exchange rates from API
 * Returns { cny_usd_rate, usd_dzd_rate } or null on failure
 */
export const fetchLiveRates = async () => {
  try {
    const res = await fetch(CURRENCY_API_URL);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('API error');

    const usdToCny = data.conversion_rates['CNY']; // 1 USD = X CNY
    const usdToDzd = data.conversion_rates['DZD']; // 1 USD = X DZD

    return {
      cny_usd_rate: 1 / usdToCny,   // 1 CNY = X USD
      usd_dzd_rate: usdToDzd,        // 1 USD = X DZD
    };
  } catch (err) {
    console.error('Failed to fetch exchange rates:', err);
    return null;
  }
};