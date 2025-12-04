import io
import json
import re
import shutil
import wave
from dataclasses import dataclass, asdict
from pathlib import Path
from threading import Lock, RLock
from typing import Dict, List, Optional, Tuple

from app.core.config import settings

try:
    from huggingface_hub import hf_hub_download
except ImportError:  # pragma: no cover - missing optional dependency
    hf_hub_download = None

try:
    from piper import PiperVoice
except ImportError:  # pragma: no cover - missing optional dependency
    PiperVoice = None


@dataclass(frozen=True)
class VoiceSpec:
    key: str
    language: str
    name: str
    repo_id: str
    model_file: str
    config_file: str
    quality: str
    description: str


@dataclass
class LocalVoice:
    key: str
    language: str
    name: str
    quality: str
    description: str
    model_path: Path
    config_path: Path

    def to_dict(self) -> Dict[str, str]:
        data = asdict(self)
        data["model_path"] = str(self.model_path)
        data["config_path"] = str(self.config_path)
        return data


DEFAULT_VOICES: List[VoiceSpec] = [
    VoiceSpec(
        key="en_us_amy_low",
        language="en",
        name="Amy (US · Female)",
        repo_id="rhasspy/piper-voices",
        model_file="en/en_US/amy/low/en_US-amy-low.onnx",
        config_file="en/en_US/amy/low/en_US-amy-low.onnx.json",
        quality="low",
        description="轻量美式女声，默认选项，加载速度快。",
    ),
    VoiceSpec(
        key="en_us_bryce_medium",
        language="en",
        name="Bryce (US · Male)",
        repo_id="rhasspy/piper-voices",
        model_file="en/en_US/bryce/medium/en_US-bryce-medium.onnx",
        config_file="en/en_US/bryce/medium/en_US-bryce-medium.onnx.json",
        quality="medium",
        description="中等体量的美式男声，音色沉稳。",
    ),
    VoiceSpec(
        key="en_us_danny_low",
        language="en",
        name="Danny (US · Male)",
        repo_id="rhasspy/piper-voices",
        model_file="en/en_US/danny/low/en_US-danny-low.onnx",
        config_file="en/en_US/danny/low/en_US-danny-low.onnx.json",
        quality="low",
        description="轻量美式男声，适合快速响应场景。",
    ),
    VoiceSpec(
        key="en_us_joe_medium",
        language="en",
        name="Joe (US · Male)",
        repo_id="rhasspy/piper-voices",
        model_file="en/en_US/joe/medium/en_US-joe-medium.onnx",
        config_file="en/en_US/joe/medium/en_US-joe-medium.onnx.json",
        quality="medium",
        description="中性腔调的美式男声，适合陈述内容。",
    ),
    VoiceSpec(
        key="en_us_kristin_medium",
        language="en",
        name="Kristin (US · Female)",
        repo_id="rhasspy/piper-voices",
        model_file="en/en_US/kristin/medium/en_US-kristin-medium.onnx",
        config_file="en/en_US/kristin/medium/en_US-kristin-medium.onnx.json",
        quality="medium",
        description="标准女声，音色明亮清晰。",
    ),
    VoiceSpec(
        key="en_us_ryan_high",
        language="en",
        name="Ryan (US · Male)",
        repo_id="rhasspy/piper-voices",
        model_file="en/en_US/ryan/high/en_US-ryan-high.onnx",
        config_file="en/en_US/ryan/high/en_US-ryan-high.onnx.json",
        quality="high",
        description="高质量美式男声，情感表达丰富。",
    ),
]

LANGUAGE_HINTS = {
    "zh": re.compile(r"[\u4e00-\u9fff]"),
    "es": re.compile(r"[¡¿ñáéíóúÁÉÍÓÚÑ]"),
    "fr": re.compile(r"[àâçéèêëîïôùûüÿçÀÂÉÈËÎÏÔÙÛÜŸÇ]"),
    "de": re.compile(r"[äöüßÄÖÜ]"),
}

QUALITY_ORDER = {"high": 3, "medium": 2, "low": 1}


class TTSService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = TTSService()
        return cls._instance

    def __init__(self):
        if PiperVoice is None:
            raise RuntimeError(
                "缺少 Piper TTS 依赖。请先运行 `pip install piper-tts` "
                "或安装 requirements.txt。"
            )
        if hf_hub_download is None:
            raise RuntimeError(
                "缺少 huggingface_hub 依赖，无法自动下载 TTS 模型。"
            )

        self.base_dir = Path(settings.TTS_MODEL_PATH)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.default_language = "en"

        self._voice_registry: Dict[str, LocalVoice] = {}
        self._voice_cache: Dict[str, PiperVoice] = {}
        self._voice_locks: Dict[str, Lock] = {}
        self._state_lock = RLock()

        self._sync_default_models()

    # --- Public API -------------------------------------------------

    def list_voices(self) -> List[Dict[str, str]]:
        with self._state_lock:
            voices = [voice.to_dict() for voice in self._voice_registry.values()]
        return [
            {
                "key": v["key"],
                "language": v["language"],
                "name": v["name"],
                "quality": v["quality"],
                "description": v["description"],
            }
            for v in sorted(voices, key=lambda item: item["language"])
        ]

    def generate_audio(
        self,
        text: str,
        language: Optional[str] = None,
        voice_key: Optional[str] = None,
    ) -> Tuple[Optional[bytes], Optional[LocalVoice]]:
        clean_text = (text or "").strip()
        if not clean_text:
            return None, None

        voice = self._resolve_voice(clean_text, language, voice_key)
        if not voice:
            print("未检测到可用的本地语音模型。")
            return None, None

        voice_instance = self._get_voice_instance(voice)
        voice_lock = self._get_voice_lock(voice.key)
        buffer = io.BytesIO()

        try:
            with voice_lock:
                with wave.open(buffer, "wb") as wav_handle:
                    voice_instance.synthesize_wav(clean_text, wav_handle)
        except Exception as exc:
            print(f"生成音频时出错: {exc}")
            return None, None

        return buffer.getvalue(), voice

    # --- Internal helpers -------------------------------------------

    def _sync_default_models(self):
        for spec in DEFAULT_VOICES:
            self._ensure_voice_assets(spec)
        self._refresh_voice_registry()

    def _ensure_voice_assets(self, spec: VoiceSpec):
        voice_dir = self.base_dir / spec.key
        model_path = voice_dir / "model.onnx"
        config_path = voice_dir / "config.json"
        metadata_path = voice_dir / "metadata.json"

        if model_path.exists() and config_path.exists():
            return

        voice_dir.mkdir(parents=True, exist_ok=True)
        try:
            self._download_file(spec.repo_id, spec.model_file, model_path)
            self._download_file(spec.repo_id, spec.config_file, config_path)
        except Exception as exc:
            print(f"下载 {spec.key} 语音模型失败: {exc}")
            return

        metadata = {
            "key": spec.key,
            "language": spec.language,
            "name": spec.name,
            "quality": spec.quality,
            "description": spec.description,
        }
        metadata_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _download_file(self, repo_id: str, file_name: str, destination: Path):
        cache_path = hf_hub_download(repo_id=repo_id, filename=file_name)
        shutil.copy2(cache_path, destination)

    def _refresh_voice_registry(self):
        voices: Dict[str, LocalVoice] = {}
        for entry in self.base_dir.iterdir():
            if not entry.is_dir():
                continue

            model_path = entry / "model.onnx"
            config_path = entry / "config.json"
            if not (model_path.exists() and config_path.exists()):
                continue

            metadata = self._load_metadata(entry)
            if metadata.get("language") != self.default_language:
                continue
            voice = LocalVoice(
                key=metadata["key"],
                language=metadata["language"],
                name=metadata["name"],
                quality=metadata["quality"],
                description=metadata["description"],
                model_path=model_path,
                config_path=config_path,
            )
            voices[voice.key] = voice

        with self._state_lock:
            self._voice_registry = voices

    def _load_metadata(self, directory: Path) -> Dict[str, str]:
        metadata_path = directory / "metadata.json"
        data = {
            "key": directory.name,
            "language": self.default_language,
            "name": directory.name.replace("_", " ").title(),
            "quality": "medium",
            "description": "自定义语音",
        }
        if metadata_path.exists():
            try:
                stored = json.loads(metadata_path.read_text(encoding="utf-8"))
                data.update({k: stored.get(k, data[k]) for k in data})
            except Exception as exc:
                print(f"读取 {metadata_path} 时出错: {exc}")
        return data

    def _resolve_voice(
        self,
        text: str,
        language: Optional[str],
        voice_key: Optional[str],
    ) -> Optional[LocalVoice]:
        with self._state_lock:
            if not self._voice_registry:
                return None
            if voice_key:
                return self._voice_registry.get(voice_key)

            language_code = self._normalize_language(language) or self._detect_language(
                text
            )

            candidates = [
                voice
                for voice in self._voice_registry.values()
                if voice.language == language_code
            ]
            if not candidates:
                candidates = list(self._voice_registry.values())

        candidates.sort(
            key=lambda voice: QUALITY_ORDER.get(voice.quality, 1), reverse=True
        )
        return candidates[0] if candidates else None

    def _normalize_language(self, language: Optional[str]) -> Optional[str]:
        if not language:
            return None
        return language.split("-")[0].lower()

    def _detect_language(self, text: str) -> str:
        for lang_code, pattern in LANGUAGE_HINTS.items():
            if pattern.search(text):
                return lang_code
        return self.default_language

    def _get_voice_instance(self, voice: LocalVoice) -> PiperVoice:
        with self._state_lock:
            cached = self._voice_cache.get(voice.key)
            if cached:
                return cached

        voice_instance = PiperVoice.load(
            model_path=str(voice.model_path), config_path=str(voice.config_path)
        )
        with self._state_lock:
            self._voice_cache[voice.key] = voice_instance
        return voice_instance

    def _get_voice_lock(self, key: str) -> Lock:
        with self._state_lock:
            lock = self._voice_locks.get(key)
            if not lock:
                lock = Lock()
                self._voice_locks[key] = lock
        return lock


tts_service = TTSService.get_instance()
