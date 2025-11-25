# Python Backend Setup

## Virtual Environment Setup

### Create Virtual Environment

```bash
cd backend/python
python3 -m venv venv
```

### Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Server

```bash
python app.py
```

Or with uvicorn directly:
```bash
uvicorn app:app --host 0.0.0.0 --port 7000 --reload
```

### Deactivate Virtual Environment

```bash
deactivate
```

## Environment Variables

Create a `.env` file in the `backend/python` directory:

```env
PORT=7000
A79_API_ENDPOINT=https://your-a79-api.com/api/extract-invoice
A79_API_KEY=your-api-key-here
A79_TIMEOUT=60000
FRONTEND_URL=http://localhost:3001
```

## Testing

```bash
# Activate venv first
source venv/bin/activate

# Run tests
pytest tests/

# Run with coverage
pytest --cov=app tests/
```

## Troubleshooting

### Virtual environment not activating
- Make sure you're using `python3` not `python`
- On Windows, use `venv\Scripts\activate.bat`

### Dependencies not installing
- Make sure virtual environment is activated
- Upgrade pip: `pip install --upgrade pip`
- Try: `pip install -r requirements.txt --upgrade`

