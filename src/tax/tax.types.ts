export interface TaxRequest {
  amount: number; // in MAJOR units (e.g. Rupees)
  currency: string;
  customerAddress: {
    country: string; // ISO 2-letter code
    state?: string;  // For US
    postalCode?: string;
  };
}

export interface TaxComponent {
  name: string;
  rate: number; // percentage (0-100) or decimal (0-1) - let's use decimal (0.18 for 18%)
  amount: number; // calculated amount in MAJOR units
}

export interface TaxResult {
  totalTaxAmount: number;
  rate: number; // effective rate
  components: TaxComponent[];
}

export interface TaxProvider {
  calculateTax(request: TaxRequest): Promise<TaxResult>;
}
