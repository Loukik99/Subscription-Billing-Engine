"# Subscription-Billing-Engine" 

Subscription Billing Engine – Detailed Project Explanation
1. Project Overview
This project is a Subscription Billing Engine that models how real-world SaaS companies manage recurring subscriptions, billing, invoicing, and revenue tracking. It is designed with correctness and financial integrity as the primary goal, rather than UI-heavy or shortcut-based implementations.

The system clearly separates pricing rules, customer subscriptions, billing obligations, and actual money collection. It includes two portals: an Admin Portal for managing billing operations and a Customer Portal for viewing account-related financial data.
2. Why This Project Exists
Billing systems are among the most error-prone components in software systems. Small logical mistakes can silently corrupt financial data, leading to incorrect revenue reporting and trust issues.

This project was built to avoid common billing mistakes such as treating invoices as revenue, double-counting payments, or directly mutating balances. Instead, it follows industry-correct billing principles used by real SaaS platforms.
3. Core Architecture
The system follows a strict lifecycle:

Plan → Subscription → Invoice → Payment → Revenue

Each component has a single responsibility. Plans define pricing, subscriptions define access over time, invoices define obligations, payments represent actual money, and revenue is derived only from payments.
4. Plans
A Plan is a pricing template. It defines the base price, billing interval (monthly), region, and tax rules.

Plans do not generate revenue or create charges. They are intentionally immutable to ensure historical invoices remain accurate.
5. Subscriptions
A Subscription represents a contractual relationship between a customer and a plan over time.

It determines eligibility for billing but does not handle money. Subscriptions answer who is subscribed, to what plan, and for what duration.
6. Invoices
Invoices represent billing obligations. They indicate how much a customer owes for a given billing period.

Invoices contain a subtotal, tax, total amount, and status (OPEN or PAID). Importantly, invoices do not affect revenue or balance until a payment is recorded.
7. Payments
Payments represent actual money collected. Each payment is linked to a single invoice and customer.

The system enforces one payment per invoice to prevent duplication. Payments are the sole source of truth for revenue calculations.
8. Account Balance
Customer account balance is derived dynamically as the sum of all payments made by that customer.

Balances are never stored or manually updated. This avoids race conditions and ensures balances always reflect real money.
9. Billing Workflow
1. Admin creates a plan.
2. Customer subscribes to a plan.
3. System generates an OPEN invoice.
4. Admin marks invoice as PAID.
5. System creates a payment and updates balance and revenue automatically.

This flow mirrors real-world billing systems and guarantees correctness.
10. Admin Portal
The Admin Portal is the system of record. Admins can manage plans, customers, subscriptions, invoices, and view financial metrics.

Metrics include Billed Revenue (OPEN invoices) and Collected Revenue (payments). Collected revenue is calculated strictly from payments.
11. Customer Portal
The Customer Portal allows users to view their subscriptions, invoices, and account balance.

Customers cannot modify billing data, ensuring financial integrity and role separation.
12. Agent Role
The agent refers to automated backend logic that enforces billing rules.

It generates invoices, ensures correct calculations, enforces idempotent payment creation, and derives balances and revenue safely. This prevents duplicate payments and invalid financial states.
13. Why Prisma Is Used
Prisma ORM is used to ensure data integrity, type safety, and schema consistency.

Billing systems require strict relational correctness. Prisma enforces relationships between customers, subscriptions, invoices, and payments, reducing the risk of silent data corruption.
14. What Is Intentionally Avoided
Partial payments, refunds, wallet systems, and payment gateway integrations are intentionally excluded.

This keeps the system focused on core billing correctness while remaining extensible for future enhancements.
15. Key Design Principles
Invoices represent obligations. Payments represent real money. Revenue is derived only from payments. One invoice results in one payment. Admin and customer responsibilities are strictly separated.
16. Summary
This project demonstrates real-world SaaS billing fundamentals, clean separation of concerns, and correct financial modeling. It prioritizes correctness, auditability, and maintainability over shortcuts.

