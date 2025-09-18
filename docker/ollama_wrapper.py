from fastapi import FastAPI, Request
import requests
import uuid

app = FastAPI()

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"

@app.post("/v1/completions")
async def completions(request: Request):
    body = await request.json()

    # Adapt body to Ollama format
    ollama_req = {
        "model": body.get("model", "llama2:7b"),
        "prompt": body.get("prompt", "")
    }

    ollama_resp = requests.post(OLLAMA_URL, json=ollama_req).json()

    # Build OpenAI-compatible response
    return {
        "id": str(uuid.uuid4()),
        "object": "text_completion",
        "created": 1234567890,
        "model": ollama_req["model"],
        "choices": [
            {"text": ollama_resp.get("response", ""), "index": 0}
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        },
        "hash": "dummy_hash_value"
    }
