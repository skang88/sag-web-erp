# SAG-WEB-ERP Client

This directory contains the frontend code for the Seohan Auto Georgia WEP-ERP system, built with React.

## Getting Started

### Prerequisites

*   Node.js and npm installed

### Installation and Startup

1.  **Navigate to the client directory:**

    ```bash
    cd client
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm start
    ```

    The application will be available at `http://localhost:3000`.

## Available Scripts

*   `npm start`: Runs the app in development mode.
*   `npm test`: Launches the test runner in interactive watch mode.
*   `npm run build`: Builds the app for production to the `build` folder.
*   `npm run eject`: Removes the single dependency and copies all configuration files and transitive dependencies into your project.

## Key Technologies

*   **React:** A JavaScript library for building user interfaces.
*   **React Router:** For declarative routing in the application.
*   **Tailwind CSS:** A utility-first CSS framework for styling.
*   **Axios:** A promise-based HTTP client for making API requests to the backend.
*   **Three.js:** For 3D visualizations, likely used in the container packing feature.
*   **jsPDF & jspdf-autotable:** For generating client-side PDF reports.
*   **SheetJS/xlsx:** For reading and writing Excel files.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts for state management (e.g., AuthContext)
└── pages/          # Top-level page components corresponding to routes
```