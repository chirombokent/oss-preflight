# Test Python Project Fixture

This is a minimal Python project fixture for testing OSS Preflight's repo analysis capabilities.

## Features

- Flask web framework
- Requests for HTTP calls
- Pytest for testing

## Usage

```bash
pip install -r requirements.txt
python src/app.py
```

## Testing

```bash
pytest
```

## Endpoints

- `GET /` - Returns welcome message
- `GET /health` - Health check endpoint
- `GET /external` - Proxies external API call

## Dependencies

- **flask**: Web framework
- **requests**: HTTP client

## Dev Dependencies

- **pytest**: Testing framework