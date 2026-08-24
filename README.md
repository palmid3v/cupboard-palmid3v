# 🗄️ Cupboard

A web-based inventory management application designed to help organize products, track stock, simplify inventory management, and progressively evolve into a practical personal inventory assistant.

---

## 🎯 Project Overview

Cupboard was created to solve a simple problem:

> Keep track of what products you have, how much you have, and what needs attention.

The application combines product organization, inventory management, quantity tracking, and barcode scanning into a single interface.

The project is designed primarily around household and kitchen inventory use cases, while keeping the architecture open for future expansion.

The long-term product direction includes:

- Better barcode scanning
- Inventory movements
- Stock control
- Expiration tracking
- Alerts
- Search and filtering
- Dashboard and analytics
- Replenishment and shopping workflows
- Reports and export
- Progressive Web App (PWA) capabilities
- Future multi-user collaboration
- Future AI-assisted inventory analysis

---

## ✨ Core Features

### 📦 Inventory Management

Current and planned inventory capabilities include:

- Product registration
- Product organization
- Inventory visualization
- Product search
- Quantity management
- Portion management
- Stock status
- Categories
- Units
- Locations
- Minimum stock
- Inventory movements
- Expiration information where applicable

The exact current implementation and data model must be validated during the initial project audit.

---

### 📷 Barcode Scanning

Cupboard includes barcode-scanning functionality designed to simplify product registration and product lookup.

The application uses browser-based camera scanning technologies to identify products through their barcodes.

Current technologies include:

- ZXing
- html5-qrcode

The scanner is expected to evolve into a faster and more reliable workflow supporting:

- Existing product detection
- New product registration
- Camera permission handling
- Unknown barcode handling
- Improved detection
- Improved focus
- Mobile optimization
- iPhone and Android compatibility
- Flashlight support where available

---

### 🔥 Firebase Integration

Product and inventory data are designed to persist through Firebase/Firestore.

This provides the foundation for:

- Cloud data storage
- Product persistence
- Inventory persistence
- Inventory synchronization
- Future multi-device usage
- Future multi-user capabilities

The current Firebase and Firestore implementation must be validated during the initial audit before architectural changes are made.

---

## 🧩 Product Model

The current product structure includes concepts such as:

- Product name
- Description
- Weight
- Portions
- Image URL
- Stock information

The inventory domain is expected to evolve to support additional concepts such as:

- Category
- Unit
- Location
- Barcode
- Minimum stock
- Expiration date
- Unit value
- Inventory movement history

The exact model must be confirmed through the project audit.

---

## 🧠 Product Direction

The long-term vision is to evolve Cupboard from a simple inventory tracker into a more complete inventory assistant.

The intended evolution is:

```text
Product
   ↓
Barcode
   ↓
Inventory
   ↓
Quantity
   ↓
Stock Control
   ↓
Movements
   ↓
Expiration
   ↓
Alerts
   ↓
Dashboard & Analytics
   ↓
Shopping / Replenishment
   ↓
Reports
   ↓
PWA
   ↓
Future Collaboration
   ↓
Future AI Assistance