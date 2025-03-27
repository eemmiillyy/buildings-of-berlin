# Prerequisites

- You will need to have node and npm installed to run the project.
- You will need a dev database to develop against. When this is setup, you'll need to migrate the schema according to the maki migrations inside of .maki folder. 
- You will need to have a .env.local file in the server folder with the values from .env.example populated with your new database connection string and `development` as the NODE_ENV.

## Setup Instructions

1. Install dependencies:
```
npm install
```

2. Run the server:
```
cd server && npm run dev
```

3. Run the client:
```
cd client && npm start
```

## Running Services
This will start:
- The server on http://localhost:8888
- The client on http://localhost:8080


