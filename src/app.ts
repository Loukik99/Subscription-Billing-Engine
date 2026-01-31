import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './api/routes';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Subscription Billing API</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
          h1 { color: #2563eb; }
          code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; }
          .endpoint { margin-bottom: 1rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; }
          .method { font-weight: bold; color: #475569; }
        </style>
      </head>
      <body>
        <h1>🚀 Subscription Billing & Tax Engine API</h1>
        <p>The server is up and running!</p>
        
        <h2>Available Endpoints</h2>
        
        <div class="endpoint">
          <span class="method">GET</span> <code>/health</code>
          <p>Check server status</p>
        </div>

        <div class="endpoint">
          <span class="method">POST</span> <code>/api/subscriptions</code>
          <p>Create a new subscription</p>
        </div>

        <div class="endpoint">
          <span class="method">POST</span> <code>/api/billing/generate-invoices</code>
          <p>Trigger recurring billing</p>
        </div>

        <p><em>See documentation for full API reference.</em></p>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default app;
