# Test NPM Project Fixture

This is a minimal npm project fixture for testing OSS Preflight's repo analysis capabilities.

## Features

- Express.js web server
- Axios for HTTP requests
- Basic REST API endpoints
- Vitest for testing

## Usage

```bash
npm install
npm start
```

## Testing

```bash
npm test
```

## Endpoints

- `GET /` - Returns welcome message
- `GET /health` - Health check endpoint
- `GET /external` - Proxies external API call

## Dependencies

- **express**: Web framework
- **axios**: HTTP client

## Dev Dependencies

- **vitest**: Testing framework