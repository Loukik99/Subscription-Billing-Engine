import { TaxProvider, TaxRequest, TaxResult } from './tax.types';
import BigNumber from 'bignumber.js';

export class SimpleTaxProvider implements TaxProvider {
  async calculateTax(request: TaxRequest): Promise<TaxResult> {
    const { country, state } = request.customerAddress;
    const amount = new BigNumber(request.amount);
    let rate = new BigNumber(0);
    let components: { name: string; rate: number; amount: number }[] = [];

    // Simplified Rules
    if (country === 'US') {
      // US Sales Tax (State-based)
      if (state === 'CA') {
        rate = new BigNumber(0.0725); // California
        components.push({ name: 'CA State Tax', rate: 0.0725, amount: 0 });
      } else if (state === 'NY') {
        rate = new BigNumber(0.04); // New York
        components.push({ name: 'NY State Tax', rate: 0.04, amount: 0 });
      } else {
         // Default US fallback or no tax for other states in this MVP
         rate = new BigNumber(0);
      }
    } else if (country === 'DE') {
      // Germany VAT
      rate = new BigNumber(0.19);
      components.push({ name: 'VAT (Standard)', rate: 0.19, amount: 0 });
    } else if (country === 'FR') {
      // France VAT
      rate = new BigNumber(0.20);
      components.push({ name: 'VAT (Standard)', rate: 0.20, amount: 0 });
    } else if (country === 'IN') {
      // India GST
      rate = new BigNumber(0.18);
      components.push({ name: 'IGST', rate: 0.18, amount: 0 });
    } else if (country === 'GB') {
        // UK VAT
        rate = new BigNumber(0.20);
        components.push({ name: 'VAT (Standard)', rate: 0.20, amount: 0 });
    }

    const taxAmount = amount.multipliedBy(rate).decimalPlaces(0, BigNumber.ROUND_HALF_UP);
    
    // Distribute amount to components (trivial for single component, but good for structure)
    // For MVP assuming single component per region usually, or aggregate rate.
    // If multiple components existed (e.g. Canada GST+PST), we would sum them.
    
    if (components.length > 0) {
        components[0].amount = taxAmount.toNumber();
    }

    return {
      totalTaxAmount: taxAmount.toNumber(),
      rate: rate.toNumber(),
      components
    };
  }
}

export class TaxService {
  private provider: TaxProvider;

  constructor(provider: TaxProvider = new SimpleTaxProvider()) {
    this.provider = provider;
  }

  async calculateTax(request: TaxRequest): Promise<TaxResult> {
    return this.provider.calculateTax(request);
  }
}
