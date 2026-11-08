# Dispatch: survey_explorer_cart
Assigned: Survey of Cart panel, LineaVentaRow, vertical space, customer selector, and secondary actions menu.


## 2026-11-07T18:31:11Z
Read ORIGINAL_REQUEST.md at c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md.

You are survey_explorer_cart.
Your mission is to investigate the Cart Panel, LineaVentaRow, customer selector, secondary operational actions, and ergonomic spacing in MaestroPescaderia ERP.

Key Investigation Areas:
1. Reference Material Analysis:
   Inspect the two reference images using read_file:
   - Problem image (current saturated state): C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/.user_uploaded/media_1794075195584_b45d7bb3.png (Notice the compressed ~40px line-item area, overflowing action buttons, white artifacts, visual saturation).
   - Reference image (mature SaaS POS design): C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/.user_uploaded/media_1794075246319_e3c57ab1.png (Notice the tall, spacious cart panel where line items take the full vertical height, clean customer selector at top, and prominent "Vender" / "Guardar" buttons at bottom).

2. Codebase Investigation:
   - Locate and examine CartPanel.tsx and LineaVentaRow.tsx (and any subcomponents, e.g., in src/components/pos/).
   - Root Cause Analysis of Cart Saturation:
     - Why is the line-item container compressed (e.g., fixed heights, flex-grow misconfiguration, overflow clipping, duplicate scrollbars)?
     - Where do the white artifacts come from?
     - What secondary operational buttons ("Cerrar turno", "Ventas en espera", "Borradores", "Multicliente", etc.) are crammed inside CartPanel, cluttering the view?
   - LineaVentaRow analysis:
     - How are product names, quantities, unit prices, discounts, and subtotals rendered?
     - How are quantity changes, price adjustments, and item deletions handled?
     - How can LineaVentaRow be redesigned to be clean, spacious, and easily readable on a counter touch screen or desktop?
   - Customer Selector (Cliente):
     - How is the customer selected or switched?
     - How to place it compactly at the top of CartPanel without pushing down line items?
   - Secondary Operations Relocation:
     - Identify every function, modal, or handler currently bound to: "Cerrar turno", "Ventas en espera", "Borradores", "Multicliente".
     - Propose a clean architecture to relocate them into a secondary menu, dropdown, or top action popover without losing functionality.
   - Cart Footer:
     - Subtotal, taxes, discounts, grand total presentation.
     - Direct, uncluttered action buttons: "Vender" (primary pay button) and "Guardar" (save draft / hold sale).

Deliverable:
Write a comprehensive, self-contained handoff report to:
c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_explorer_cart\handoff.md
Follow the standard Handoff format: Observation, Logic Chain, Caveats, Conclusion, Recommendations.
Update progress.md in your state folder as you make progress.
When finished, send a message to your parent with a concise summary.
