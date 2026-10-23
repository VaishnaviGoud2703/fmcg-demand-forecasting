# fmcg-demand-forecasting
DemandIQ – FMCG Supply Chain Demand Forecasting

Project Overview

DemandIQ is an AI-powered prototype designed to help FMCG retailers forecast product demand, identify inventory risks, and make better replenishment decisions.

Problem Statement

FMCG retailers can experience stockouts of popular products and excess inventory of slow-moving products. Traditional forecasting methods may not incorporate promotions, holidays, pricing, and other demand signals effectively.

Objectives

* Forecast demand for 7, 14, and 30 days.
* Identify potential stockout and overstock risks.
* Recommend replenishment quantities.
* Explain demand predictions using model input features.
* Visualize demand trends through an interactive dashboard.

Technologies Used

* HTML
* CSS
* JavaScript
* Chart.js

Key Features

* Interactive demand forecasting dashboard.
* Simulated dataset representing 500 SKUs and 50 distribution centers.
* Demand trend visualization.
* Inventory risk alerts.
* Suggested order quantities.
* Directional feature-driver explanations.

Dataset

This prototype uses synthetic demonstration data generated in JavaScript. It does not contain real retailer sales or inventory records.

How to Run

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:
    python3 -m http.server 8000
5. Open http://localhost:8000 in your browser.

Keep the terminal open while using the website.

Limitations

The model and inventory calculations are experimental. The displayed evaluation metric is based on synthetic data and does not demonstrate real-world accuracy or proven financial savings. Real deployment requires validation on historical retailer data.

Future Improvements

* Integrate authorized real-world sales data.
* Improve time-series forecasting and backtesting.
* Include supplier lead times and service-level targets.
* Add forecast uncertainty estimates.
* Compare against seasonal-naive forecasting baselines.

Originality and Attribution

This project is a hackathon prototype. The team should document its own modifications, follow the event’s AI-use rules, and attribute external libraries and datasets as required.
