# Seohan Auto Georgia WEP-ERP

This is a web-based ERP system for Seohan Auto Georgia. It includes a React.js frontend and a Node.js Express server backend.

## Features

*   User authentication (login, registration, password reset)
*   Access control based on user roles
*   Data visualization and management
*   Container packing visualization
*   ASN (Advanced Shipping Notice) management
*   Pallet packing and tracking
*   License plate recognition and logging
*   Stocktaking and inventory management

## Tech Stack

### Frontend

*   React.js
*   React Router for routing
*   Axios for API requests
*   Tailwind CSS for styling
*   [jsPDF](https://github.com/parallax/jsPDF) and [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) for PDF generation
*   [SheetJS/xlsx](https://github.com/SheetJS/sheetjs) for Excel file processing
*   [Three.js](https://threejs.org/) for 3D visualization

### Backend

*   Node.js with Express.js
*   MongoDB with Mongoose for the primary database
*   MSSQL for relational data
*   MySQL2 for another relational database
*   bcryptjs for password hashing
*   JSON Web Token (JWT) for authentication
*   Nodemailer for sending emails
*   `node-fetch` for making HTTP requests

## Getting Started

### Prerequisites

*   Node.js and npm installed
*   MongoDB instance running
*   MSSQL server running
*   MySQL server running

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://example.com/your-repo.git
    cd sag-web-erp
    ```

2.  **Install server dependencies:**

    ```bash
    cd server
    npm install
    ```

3.  **Install client dependencies:**

    ```bash
    cd ../client
    npm install
    ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    cd server
    npm start
    ```

    The server will start on `http://localhost:5000` (or the port specified in your environment variables).

2.  **Start the frontend development server:**

    ```bash
    cd client
    npm start
    ```

    The client will start on `http://localhost:3000`.

## Available Scripts

### Client (`/client`)

*   `npm start`: Runs the app in development mode.
*   `npm test`: Launches the test runner in interactive watch mode.
*   `npm run build`: Builds the app for production to the `build` folder.
*   `npm run eject`: Removes the single dependency and copies all configuration files and transitive dependencies into your project.

### Server (`/server`)

*   `npm start`: Starts the server using `node server.js`.
*   `npm test`: (Not yet configured)

## Environment Variables

The backend server requires a `.env` file in the `/server` directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
MSSQL_USER=your_mssql_user
MSSQL_PASSWORD=your_mssql_password
MSSQL_SERVER=your_mssql_server
MSSQL_DATABASE=your_mssql_database
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_mysql_database
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

## API Endpoints

The backend API routes are defined in the `/server/routes` directory. Here's a brief overview:

*   `/api/acc`: Routes for accounting data.
*   `/api/asn`: Routes for Advanced Shipping Notices.
*   `/api/auth`: Routes for user authentication.
*   `/api/items`: Routes for item management.
*   `/api/packing`: Routes for packing and containerization.
*   `/api/plates`: Routes for license plate data.
*   `/api/plate-recognition`: Routes for the license plate recognition service.
*   `/api/shelly`: Routes for Shelly device integration.
*   `/api/users`: Routes for user management.

## Project Structure

```
sag-web-erp/
├── client/         # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── contexts/
│       └── pages/
└── server/         # Node.js Backend
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── seed/
    ├── services/
    └── utils/
```

## License

This project is licensed under the ISC License.