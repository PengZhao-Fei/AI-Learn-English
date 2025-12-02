import os
import sys
from huggingface_hub import hf_hub_download, snapshot_download

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "models")
LLM_REPO_ID = "Qwen/Qwen2.5-7B-Instruct-GGUF"
LLM_FILENAME = "qwen2.5-7b-instruct-q4_k_m.gguf"
TTS_REPO_ID = "coqui/XTTS-v2"

def download_llm():
    print(f"Checking LLM in repo: {LLM_REPO_ID}...")
    os.makedirs(os.path.join(MODEL_DIR, "llm"), exist_ok=True)
    try:
        from huggingface_hub import list_repo_files
        files = list_repo_files(repo_id=LLM_REPO_ID)
        gguf_files = [f for f in files if f.endswith(".gguf")]
        
        selected_base = None
        selected_parts = []
        
        # Prefer q5_k_m, q4_k_m
        for pref in ["q5_k_m", "q4_k_m", "q4_0"]:
            # Check for split files first
            # Look for part 1
            part1 = next((f for f in gguf_files if pref in f.lower() and "00001-of-" in f), None)
            if part1:
                # Find all parts
                base_name = part1.split("-00001-of-")[0]
                selected_parts = [f for f in gguf_files if base_name in f]
                selected_parts.sort()
                selected_base = part1
                break
            
            # Check for single files
            single = next((f for f in gguf_files if pref in f.lower() and "-of-" not in f), None)
            if single:
                selected_parts = [single]
                selected_base = single
                break
        
        if not selected_parts and gguf_files:
            # Fallback to first available
            selected_parts = [gguf_files[0]]
            selected_base = gguf_files[0]

        if not selected_parts:
            print("Error: No GGUF files found.")
            return

        print(f"Selected LLM: {selected_base} (Parts: {len(selected_parts)})")
        
        for part in selected_parts:
            print(f"Downloading {part}...")
            hf_hub_download(
                repo_id=LLM_REPO_ID,
                filename=part,
                local_dir=os.path.join(MODEL_DIR, "llm"),
                local_dir_use_symlinks=False
            )
            
        # Create a marker or symlink for the main file so config can find it?
        # Better: Update config to search for the file.
        # But for compatibility with our previous logic, let's write the filename to a metadata file
        # or just rely on config finding it.
        # Let's create a symlink 'model.gguf' to the first part if possible, 
        # BUT llama.cpp might need the original name pattern to find the second part.
        # So we should NOT rename.
        # We will create a 'model_info.txt' containing the filename.
        with open(os.path.join(MODEL_DIR, "llm", "model_info.txt"), "w") as f:
            f.write(selected_base)
            
        print(f"LLM download complete. Main file: {selected_base}")
        
    except Exception as e:
        print(f"Error downloading LLM: {e}")

def download_tts():
    print(f"Downloading TTS: {TTS_REPO_ID}...")
    os.makedirs(os.path.join(MODEL_DIR, "tts"), exist_ok=True)
    try:
        path = snapshot_download(
            repo_id=TTS_REPO_ID,
            local_dir=os.path.join(MODEL_DIR, "tts"),
            local_dir_use_symlinks=False,
            allow_patterns=["*.json", "*.pth", "*.bin", "vocab.json"] # Download only necessary files
        )
        print(f"TTS downloaded to: {path}")
    except Exception as e:
        print(f"Error downloading TTS: {e}")

if __name__ == "__main__":
    print("Starting model downloads... This may take a while.")
    download_llm()
    # Note: XTTS download is large and we are using Edge-TTS as default now for stability.
    download_tts()
    print("Download complete.")
