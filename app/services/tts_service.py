import os
import uuid
import torch
from app.core.config import settings

try:
    from TTS.api import TTS
except ImportError:
    TTS = None


class TTSService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = TTSService()
        return cls._instance

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        if torch.backends.mps.is_available():
            self.device = "mps"

        print(f"正在设备上初始化 TTS: {self.device}")
        self.model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        self.local_model_dir = settings.TTS_MODEL_PATH
        self.tts = None

    def _local_files(self):
        return {
            "config": os.path.join(self.local_model_dir, "config.json"),
            "model": os.path.join(self.local_model_dir, "model.pth"),
            "speakers": os.path.join(self.local_model_dir, "speakers_xtts.pth"),
            "dvae": os.path.join(self.local_model_dir, "dvae.pth"),
            "mel_stats": os.path.join(self.local_model_dir, "mel_stats.pth"),
            "vocab": os.path.join(self.local_model_dir, "vocab.json"),
            "language_ids": os.path.join(self.local_model_dir, "language_ids.json"),
        }

    def _has_local_assets(self):
        files = self._local_files()
        required_keys = ["config", "model", "speakers", "dvae", "mel_stats", "vocab"]
        return all(os.path.exists(files[key]) for key in required_keys)

    def _load_model(self):
        if self.tts:
            return

        if TTS is None:
            print("未安装 Coqui TTS。使用 Edge-TTS CLI 作为回退。")
            self.tts = "edge-tts"
            return

        if self._has_local_assets():
            files = self._local_files()
            print("检测到本地 XTTS 模型，尝试加载...")
            try:
                kwargs = {
                    "model_path": files["model"],
                    "config_path": files["config"],
                    "speakers_file": files["speakers"],
                    "progress_bar": False,
                }
                if os.path.exists(files["language_ids"]):
                    kwargs["language_ids_file"] = files["language_ids"]
                self.tts = TTS(**kwargs).to(self.device)
                print("已成功加载本地 TTS 模型。")
                return
            except Exception as e:
                print(f"加载本地 TTS 失败: {e}")

        print("尝试使用在线模型名称加载 TTS...")
        try:
            self.tts = TTS(self.model_name).to(self.device)
            print("通过模型名称加载 TTS 成功。")
        except Exception as e:
            print(f"加载 Coqui TTS 时出错: {e}")
            print("回退到 Edge-TTS CLI。")
            self.tts = "edge-tts"

    def generate_audio(self, text: str, output_dir: str = "static/audio") -> str:
        self._load_model()

        filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(settings.BASE_DIR, "app", output_dir, filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        if self.tts == "edge-tts":
            try:
                mp3_path = output_path.replace(".wav", ".mp3")
                filename = filename.replace(".wav", ".mp3")
                cmd = f'edge-tts --text "{text}" --write-media "{mp3_path}"'
                os.system(cmd)
                return f"/static/audio/{filename}"
            except Exception as e:
                print(f"Edge-TTS 错误: {e}")
                return None

        if not self.tts:
            return None

        try:
            self.tts.tts_to_file(
                text=text,
                file_path=output_path,
                speaker="female-en-5",
                language="en",
            )
            return f"/static/audio/{filename}"
        except Exception as e:
            print(f"生成音频时出错: {e}")
            return None


tts_service = TTSService.get_instance()
