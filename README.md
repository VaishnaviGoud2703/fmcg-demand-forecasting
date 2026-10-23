# DemandIQ — FMCG Supply Chain Demand Forecasting Prototype

A beginner-friendly hackathon prototype built with HTML, CSS, and vanilla JavaScript. It demonstrates demand forecasting, inventory risk alerts, replenishment suggestions, a demand chart, and directional feature-driver explanations.

## Important scope and honesty notes

- **All data is synthetic** and generated in the browser. No retailer or customer data is included.
- This is a demonstration, not a production-ready supply-chain system.
- The forecasting model is a transparent regularized linear regression fitted in-browser using lagged demand, calendar features, promotions, web-interest proxy, price, and macroeconomic proxy signals.
- The WAPE shown is calculated on a chronological held-out portion of the synthetic history. It is not evidence of performance on real business data.
- Driver bars are directional model signals, not causal explanations.
- Inventory recommendations use a simplified safety buffer. A real deployment must include supplier lead times, service levels, case-pack sizes, stock reservations, and data validation.

## Features

- 500 synthetic SKUs and 50 synthetic distribution centers
- Select a product, distribution center, and 7/14/30-day forecast horizon
- 35-day actual-sales view and projected demand chart
- Stock risk status and simplified suggested order quantity
- Feature-driver signals for recent sales, promotions, calendar patterns, web-interest proxy, and market context
- Responsive desktop/mobile layout

## Run locally

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Start a local static server. For example, if Python is installed, run:
   ```bash
   python3 -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser.

The Chart.js chart is loaded from a CDN, so an internet connection is required for the chart. Other dashboard logic runs in the browser.

## Test checklist

1. Change SKU and verify the KPI values/chart update.
2. Change distribution center and verify forecasts and inventory risk update.
3. Select 7, 14, and 30 days and verify total demand changes with the horizon.
4. Check that order quantity is never negative.
5. Resize the browser to a mobile width and verify the layout stacks.
6. Disconnect from the internet and note that the external chart library will not load; document this limitation in your submission.
7. Describe the displayed WAPE as a synthetic holdout metric only.

## Deploy with GitHub Pages

1. Create a new public repository on GitHub, for example `fmcg-demand-forecasting`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under build and deployment, select **Deploy from a branch**.
5. Choose `main` and `/ (root)`, then save.
6. Wait for the deployment to finish. Open the URL shown in the Pages section.

## Originality and submission

Use this code as a starter, understand it, and personalize the interface, feature engineering, assumptions, and documentation. Follow the hackathon's specific AI-use and attribution rules. State clearly that the data is synthetic and that the prototype has not been validated on retailer data. Do not claim the prototype saved money or reduced stockouts without measured evidence.
