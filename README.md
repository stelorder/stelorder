# STEL Order - WooCommerce Connector

This plugin provides a native integration between the STEL Order cloud ERP and the WooCommerce e-commerce plugin. It synchronizes business data between both platforms by leveraging the existing capabilities of WordPress and WooCommerce while consuming STEL Order's third-party services.

Public repository: https://github.com/stelorder/stelorder

## Overview

The purpose of this plugin is to keep critical business data synchronized between WooCommerce and STEL Order, including customers, products, orders, invoices, and subscriptions. The plugin logic is implemented in `src/`, while the administration interface is built as a React + TypeScript Single Page Application (SPA) located in `src/react-admin-panel`.

## Prerequisites

To develop and run the plugin, you will need:

- PHP 8.2 or later.
- Composer.
- Node.js (using `nvm` to manage Node versions is recommended).
- npm.

### Main Project Dependencies

The plugin root includes the following PHP dependencies defined in `composer.json`:

- `symfony/serializer` for data normalization and serialization.
- `symfony/validator` for DTO and data structure validation.
- `symfony/property-access` for dynamic property access.
- `symfony/property-info` for property metadata extraction.
- `phpdocumentor/reflection-docblock` for reading DocBlock comments and annotations.

### Development Tools

The plugin also includes several development tools defined in `composer.json` to ensure code quality and compatibility:

- `squizlabs/php_codesniffer` together with `phpcompatibility/php-compatibility` analyzes PHP code against specific PHP versions and detects compatibility issues.
- `phpstan/phpstan` performs static analysis to detect errors and bad practices early.
- `php-stubs/wordpress-stubs` and `php-stubs/woocommerce-stubs` provide WordPress and WooCommerce stubs so static analysis tools can understand their APIs.
- `brianhenryie/strauss` is used during the build process to prefix dependencies and generate a distributable package.

These tools help validate plugin compatibility with PHP, WordPress, and WooCommerce before deployment.

### React Admin Panel Dependencies

The administration panel is located in `src/react-admin-panel` and uses:

- `react` 19
- `react-dom` 19
- `react-bootstrap` and `bootstrap` for the user interface.
- `react-router-dom` for SPA routing.
- `i18next`, `react-i18next`, `i18next-browser-languagedetector`, and `i18next-http-backend` for internationalization.
- `@vitejs/plugin-react-swc` and `vite` for frontend bundling.
- `typescript` and React type definitions for TypeScript development.
- `eslint` and related plugins to maintain code quality.
- `uuid` for identifier generation.
- `@stelsolutions/stelorder-catalog` to use the STEL Order React components library.

## Project Structure

The plugin is mainly organized as follows:

- `stel-order.php` – main plugin entry point.
- `src/` – contains all plugin logic.
  - `Controllers/` – controllers and DTOs for handling requests.
  - `Domain/` – business entities, value objects, and utilities.
  - `Exceptions/` – plugin-specific exceptions.
  - `Logs/` – logging utilities.
  - `Repositories/` – data access and persistence.
  - `Services/` – business, integration, and synchronization services.
  - `Views/` – administration panel views and configuration.
  - `WooCommerce/` – WooCommerce-specific configuration and hooks.

- `src/react-admin-panel/` – React + TypeScript SPA for the plugin administration panel.
  - The `src/` directory inside this folder contains the panel's components, pages, contexts, observers, and utilities.

## React Admin Panel Development

To work on the administration interface:

1. Install the frontend dependencies:

```bash
cd src/react-admin-panel
npm install
```

2. Start the Vite development server:

```bash
npm run dev
```

3. Open WordPress and navigate to the plugin administration page. The code in `src/Views/SpaConfig.php` detects development mode and loads the Vite development server instead of the production bundles.

### Vite Development Mode Configuration

The `src/Views/SpaConfig.php` file uses the following constants to enable the Vite development server:

- `STEL_DEBUG`
- `STEL_ENV_DEVELOP`

To load assets from the Vite server, these constants must be defined and enabled in your development environment. When enabled, the plugin loads:

- `http://localhost:5173/@vite/client`
- `http://localhost:5173/src/main.tsx`

If development mode is not enabled, `SpaConfig.php` loads the production bundles from the `assets/js` and `assets/css` directories.

## Quick Installation

From the plugin root directory:

```bash
composer install
```

From the React admin panel directory:

```bash
cd src/react-admin-panel
npm install
```

Before running `npm install`, you must configure access to the private npm package by creating an `.npmrc` file or setting up the appropriate authentication token.

## Production Build

Once the frontend has been built, the plugin can be packaged using the `build` Composer script defined in `composer.json`.

The build process performs the following tasks:

- installs Composer dependencies without development packages,
- builds the React assets using Vite,
- copies the plugin files and generated frontend bundles,
- creates a ZIP package ready for distribution.

## Contributing

If you would like to extend or customize the plugin, implement plugin logic under `src/` and administration interface changes under `src/react-admin-panel/`. When adding new hooks, filters, or services, follow the WordPress and WooCommerce coding conventions.