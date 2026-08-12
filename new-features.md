Build a production-grade Indian Brokerage Calculator web application.

Tech Stack:
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma ORM
- Zustand
- Recharts

Goal:

Create the most accurate brokerage calculator in India.

Key differentiator:

The calculator must accurately include DP Charges for every supported broker and match real contract notes as closely as possible.

Supported brokers:

- Zerodha
- Groww
- Angel One
- Upstox
- Dhan
- FYERS
- 5Paisa
- ICICI Direct
- HDFC Securities
- Kotak Securities

Supported segments:

- Equity Delivery
- Equity Intraday
- MTF
- Futures
- Options
- Commodity
- Currency

Requirements:

1. Separate calculation engine from UI.

2. Create a broker rules engine driven entirely by JSON configurations.

3. Support:
   - Brokerage
   - STT
   - Exchange charges
   - GST
   - SEBI charges
   - Stamp duty
   - DP charges
   - IPFT charges

4. DP charges must support:
   - Fixed charges
   - Per ISIN charges
   - Broker fee component
   - Depository fee component
   - GST component

5. Build a database schema for broker charges with effective dates.

6. Build an admin panel to update charges.

7. Build a scraper service architecture for future broker charge updates.

8. Include audit logs for charge changes.

9. Add broker comparison mode.

10. Add contract-note simulation mode.

11. Add break-even calculator.

12. Add responsive mobile layout.

13. Add dark/light theme toggle.

Design System:

Light Mode:
- Beige background
- Warm neutral surfaces
- Minimal borders
- Premium typography

Dark Mode:
- Matte black
- Charcoal surfaces
- Neutral greys
- No blue-grey tones

Design references:
- Linear
- Stripe Dashboard
- Raycast
- Notion

Avoid:
- Fintech template look
- Glassmorphism
- Excessive gradients
- AI-generated visual style

UI Principles:

- Dense but readable
- Data-first
- Fast interactions
- Professional trading-tool feel
- Accessibility AA compliant

Pages:

/
Calculator

/compare
Compare Brokers

/charges
Broker Charges Database

/contract-note
Contract Note Simulator

/about
Methodology and Charge Sources

Build clean folder architecture, reusable calculation engine, complete TypeScript types, unit tests for all formulas, and production-ready code.