import { TaxService, SimpleTaxProvider } from '../src/tax/tax.service';
import { TaxRequest } from '../src/tax/tax.types';

describe('TaxService', () => {
  let service: TaxService;

  beforeEach(() => {
    service = new TaxService(new SimpleTaxProvider());
  });

  it('should calculate CA sales tax correctly', async () => {
    const request: TaxRequest = {
      amount: 1000, // $10.00
      currency: 'USD',
      customerAddress: { country: 'US', state: 'CA' }
    };
    const result = await service.calculateTax(request);
    
    // 7.25% of 1000 = 72.5 -> rounds to 73
    expect(result.totalTaxAmount).toBe(73);
    expect(result.rate).toBe(0.0725);
    expect(result.components[0].name).toBe('CA State Tax');
  });

  it('should calculate NY sales tax correctly', async () => {
    const request: TaxRequest = {
      amount: 1000, // $10.00
      currency: 'USD',
      customerAddress: { country: 'US', state: 'NY' }
    };
    const result = await service.calculateTax(request);
    
    // 4% of 1000 = 40
    expect(result.totalTaxAmount).toBe(40);
    expect(result.rate).toBe(0.04);
  });

  it('should calculate DE VAT correctly', async () => {
    const request: TaxRequest = {
      amount: 1000, // €10.00
      currency: 'EUR',
      customerAddress: { country: 'DE' }
    };
    const result = await service.calculateTax(request);
    
    // 19% of 1000 = 190
    expect(result.totalTaxAmount).toBe(190);
    expect(result.rate).toBe(0.19);
  });

  it('should return 0 for unknown regions', async () => {
    const request: TaxRequest = {
      amount: 1000,
      currency: 'USD',
      customerAddress: { country: 'JP' } // Japan not implemented yet
    };
    const result = await service.calculateTax(request);
    
    expect(result.totalTaxAmount).toBe(0);
    expect(result.rate).toBe(0);
  });
});
