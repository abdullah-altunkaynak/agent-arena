"""
Inference Dispatcher — Phase 2

Routes LLM inference requests to the correct backend based on InferenceConfig.

Supported backends:
  - ollama          → Local LLM via Ollama REST API
  - openai          → OpenAI Chat Completions API (BYOK)
  - anthropic       → Anthropic Messages API (BYOK)
  - custom_endpoint → Engineer's own model server (any HTTP endpoint)
  - local           → Handled by the agent itself (PyTorch/TF); dispatcher not needed
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from backend.engine.base_agent import InferenceBackend, InferenceConfig


class InferenceDispatcher:
    """
    Stateless dispatcher — call `complete()` with a system prompt, user message,
    and InferenceConfig to get a response string back from whichever backend is configured.
    """

    def complete(
        self,
        system_prompt: str,
        user_message: str,
        config: InferenceConfig,
        temperature: float = 0.3,
        max_tokens: int = 512,
    ) -> str:
        """
        Dispatch a completion request to the configured backend.

        Returns the model's raw text response.
        Raises RuntimeError with a clear message on failure.
        """
        backend = config.backend

        if backend == InferenceBackend.OLLAMA:
            return self._ollama(system_prompt, user_message, config, temperature, max_tokens)

        if backend == InferenceBackend.OPENAI:
            return self._openai(system_prompt, user_message, config, temperature, max_tokens)

        if backend == InferenceBackend.ANTHROPIC:
            return self._anthropic(system_prompt, user_message, config, temperature, max_tokens)

        if backend == InferenceBackend.CUSTOM_ENDPOINT:
            return self._custom_endpoint(system_prompt, user_message, config, temperature, max_tokens)

        if backend == InferenceBackend.LOCAL:
            raise ValueError(
                "InferenceBackend.LOCAL is handled by the agent itself (setup/decide). "
                "Do not call InferenceDispatcher for local models."
            )

        raise ValueError(f"Unknown inference backend: {backend}")

    # ── OLLAMA ────────────────────────────────────────────────────────────────

    def _ollama(
        self,
        system_prompt: str,
        user_message: str,
        config: InferenceConfig,
        temperature: float,
        max_tokens: int,
    ) -> str:
        base_url = config.endpoint_url or "http://localhost:11434"
        model = config.ollama_model or "llama3"

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": False,
        }

        try:
            response = httpx.post(
                f"{base_url}/api/chat",
                json=payload,
                timeout=60.0,
            )
            response.raise_for_status()
            return response.json()["message"]["content"]
        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"Ollama request failed ({base_url}): {exc}. "
                "Is Ollama running? Try: `ollama serve`"
            ) from exc

    # ── OPENAI ────────────────────────────────────────────────────────────────

    def _openai(
        self,
        system_prompt: str,
        user_message: str,
        config: InferenceConfig,
        temperature: float,
        max_tokens: int,
    ) -> str:
        if not config.api_key:
            raise RuntimeError(
                "OpenAI API key is missing. Provide it via the BYOK field in the run request."
            )

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError("openai package is not installed. Run: pip install openai") from exc

        client = OpenAI(api_key=config.api_key)

        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return completion.choices[0].message.content or ""
        except Exception as exc:
            raise RuntimeError(f"OpenAI API error: {exc}") from exc

    # ── ANTHROPIC ─────────────────────────────────────────────────────────────

    def _anthropic(
        self,
        system_prompt: str,
        user_message: str,
        config: InferenceConfig,
        temperature: float,
        max_tokens: int,
    ) -> str:
        if not config.api_key:
            raise RuntimeError(
                "Anthropic API key is missing. Provide it via the BYOK field in the run request."
            )

        try:
            import anthropic
        except ImportError as exc:
            raise RuntimeError(
                "anthropic package is not installed. Run: pip install anthropic"
            ) from exc

        client = anthropic.Anthropic(api_key=config.api_key)

        try:
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                temperature=temperature,
            )
            return message.content[0].text
        except Exception as exc:
            raise RuntimeError(f"Anthropic API error: {exc}") from exc

    # ── CUSTOM ENDPOINT ───────────────────────────────────────────────────────

    def _custom_endpoint(
        self,
        system_prompt: str,
        user_message: str,
        config: InferenceConfig,
        temperature: float,
        max_tokens: int,
    ) -> str:
        if not config.endpoint_url:
            raise RuntimeError(
                "custom_endpoint backend requires inference.endpoint_url in config.json."
            )

        # OpenAI-compatible request format — most custom servers support this
        payload: dict[str, Any] = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            headers = {"Content-Type": "application/json"}
            if config.api_key:
                headers["Authorization"] = f"Bearer {config.api_key}"

            response = httpx.post(
                config.endpoint_url,
                json=payload,
                headers=headers,
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

            # Try OpenAI-compatible response first, then fall back to plain text
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            if "response" in data:
                return data["response"]
            if "text" in data:
                return data["text"]

            return json.dumps(data)

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"Custom endpoint request failed ({config.endpoint_url}): {exc}"
            ) from exc


# Module-level singleton — import and use directly
dispatcher = InferenceDispatcher()
