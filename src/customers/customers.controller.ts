import { Request, Response } from 'express';
import { CustomersService } from './customers.service';

export class CustomersController {
  private customersService: CustomersService;

  constructor() {
    this.customersService = new CustomersService();
  }

  getCustomers = async (req: Request, res: Response) => {
    try {
      const customers = await this.customersService.getCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getCustomer = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const customer = await this.customersService.getCustomer(id);
      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createCustomer = async (req: Request, res: Response) => {
    try {
      console.log('Creating customer with body:', req.body);
      const customer = await this.customersService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        res.status(409).json({ error: 'Customer with this email already exists' });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  deleteCustomer = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await this.customersService.deleteCustomer(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
