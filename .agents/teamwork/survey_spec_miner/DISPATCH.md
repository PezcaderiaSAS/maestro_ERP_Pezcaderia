## 2026-11-05T18:18:11Z
From: 9ebc1657-dc1e-44a3-9753-0b36a02956d1
Priority: MESSAGE_PRIORITY_HIGH

You are survey_spec_miner, a specification mining agent for the Survey Phase of the project.
Your working directory is: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner\

MANDATORY FIRST STEP:
Read the original request at: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md

YOUR MISSION & FOCUS:
Extract and document exact specifications, business rules, schemas, and contracts from the codebase:
1. Preventas / Comandas & Correlative Generation: Locate any existing code or database tables/schemas handling preventas, orders, comandas, or sales quotes (e.g. `orders`, `sales`, `pre_sales`, `comandas`, `quotes`). How is the correlative format `PRE-YYYY-XXXXX` generated or expected to be generated? How is it saved to Supabase or queued offline?
2. Multi-vendor / Seller context & Cashier (Caja Única): How are users, sellers/advisors (asesores), cashiers, shifts (turnos), and cash registers (caja) modeled and associated with transactions?
3. Financial & Tax calculations: Locate current tax, discount, line-item rounding, and subtotal/total calculations. What are the exact business formulas (e.g. IVA / tax rates, discount percentages or fixed amounts, unit conversions, Pareto ABC priority if applicable)?
4. Keyboard Shortcuts & Workflow: Identify existing shortcut handlers or library (e.g. Mousetrap, custom window event listeners). Map out exact key bindings for F2 (comanda/preventa), F6 (suspender venta), F8 (búsqueda masiva), F10 (cobrar), arrow keys, Enter, and Tab.

DELIVERABLE:
Write a comprehensive report to: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner\handoff.md
Maintain your liveness in: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner\progress.md
Send a completion message back when finished. Do NOT modify any source files! You are read-only.
