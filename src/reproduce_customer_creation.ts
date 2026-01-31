import { CustomersService } from './customers/customers.service';

async function main() {
  const service = new CustomersService();
  try {
    console.log('Attempting to create customer...');
    const customer = await service.createCustomer({
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      currency: 'USD',
      address: { country: 'US' },
      balance: 0,
    });
    console.log('Customer created successfully:', customer);
  } catch (error) {
    console.error('Failed to create customer:', error);
  }
}

main();
