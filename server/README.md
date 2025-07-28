# SAG-WEB-ERP Server

This directory contains the backend code for the Seohan Auto Georgia WEP-ERP system, built with Node.js and Express.

## Getting Started

### Prerequisites

*   Node.js and npm installed
*   Access to MongoDB, MSSQL, and MySQL databases

### Installation and Startup

1.  **Navigate to the server directory:**

    ```bash
    cd server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create a `.env` file:**

    Create a `.env` file in this directory and populate it with the necessary environment variables (see the main `README.md` for a template).

4.  **Start the server:**

    ```bash
    npm start
    ```

    The server will start on the port defined in your `.env` file (default is 5000).

## Available Scripts

*   `npm start`: Starts the server using `node server.js`.
*   `npm test`: (Not yet configured)

## Key Technologies

*   **Node.js & Express:** The core runtime and web framework.
*   **Mongoose:** An Object Data Modeling (ODM) library for MongoDB.
*   **mssql & mysql2:** Drivers for connecting to MSSQL and MySQL databases.
*   **JWT (jsonwebtoken):** For implementing JSON Web Token-based authentication.
*   **bcryptjs:** For hashing passwords.
*   **Nodemailer:** For sending emails (e.g., for password resets).

## Project Structure

```
server/
├── config/         # Database and other configurations
├── controllers/    # Logic to handle incoming requests
├── middleware/     # Custom middleware (e.g., for authentication)
├── models/         # Database schemas and models
├── routes/         # API route definitions
├── seed/           # Scripts to seed the database with initial data
├── services/       # Business logic and services (e.g., AuthService)
└── utils/          # Utility functions (e.g., email, packing logic)
```
