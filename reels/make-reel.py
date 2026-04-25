"""Generate Drive Finder SG short ad reel with hardcoded captions."""
import sys, os, subprocess, shutil
sys.path.insert(0, os.path.expanduser("~/story-videos"))
os.environ.setdefault("PEXELS_API_KEY", "PaOApPyGKarkZgHKe7dlEWGrMD91oOCxim8VHgQM4ww8CxRpBzDknG3t")

from pathlib import Path
from voice import generate_voice
from footage import search_videos, download_video

OUT = Path(__file__).parent / "output"
OUT.mkdir(exist_ok=True)
FOOTAGE = Path(__file__).parent / "footage"
FOOTAGE.mkdir(exist_ok=True)

W, H, FPS = 1080, 1920, 30


def download_clip(query, index):
    """Download a portrait Pexels clip."""
    vids = search_videos(query, per_page=5, orientation="portrait")
    for v in vids:
        fname = f"ad_{index}_{v['id']}.mp4"
        fpath = FOOTAGE / fname
        if fpath.exists():
            return str(fpath)
        path = download_video(v, fname)
        if path:
            return path
    return None


def make_ad(reel_id, voice_script, captions, clips_queries, rate="+0%"):
    """
    captions: list of {"text": "...", "start": 0.0, "end": 2.5}
    clips_queries: list of search terms for Pexels
    """
    # 1. Voice
    voice_path = str(OUT / f"ad_{reel_id}_voice.mp3")
    print("Generating voice...")
    generate_voice(voice_script, voice_path, rate=rate, voice="en-GB-RyanNeural")

    # Get duration
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", voice_path],
        capture_output=True, text=True
    )
    import json
    duration = float(json.loads(probe.stdout)["format"]["duration"])
    print(f"  Voice duration: {duration:.1f}s")

    # 2. Download clips
    print("Downloading footage...")
    clip_paths = []
    for i, q in enumerate(clips_queries):
        p = download_clip(q, i)
        if p:
            clip_paths.append(p)
            print(f"  Clip {i}: {q}")

    if not clip_paths:
        print("ERROR: No clips downloaded")
        return

    # 3. Build background video from clips
    print("Building background...")
    clip_dur = duration / len(clip_paths)
    bg_parts = []
    for i, cp in enumerate(clip_paths):
        part = str(OUT / f"_bg_part_{i}.mp4")
        subprocess.run([
            "ffmpeg", "-y", "-i", cp,
            "-t", str(clip_dur),
            "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}",
            "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
            part
        ], capture_output=True)
        bg_parts.append(part)

    # Concat background parts
    concat_file = str(OUT / "_concat.txt")
    with open(concat_file, "w") as f:
        for p in bg_parts:
            f.write(f"file '{p}'\n")
    bg_path = str(OUT / "_background.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        bg_path
    ], capture_output=True)

    # 4. Create SRT subtitle file
    print("Creating captions...")
    srt_path = str(OUT / f"ad_{reel_id}.srt")
    with open(srt_path, "w") as f:
        for i, cap in enumerate(captions):
            start = format_srt_time(cap["start"])
            end = format_srt_time(cap["end"])
            f.write(f"{i+1}\n{start} --> {end}\n{cap['text']}\n\n")

    # 5. Pick music
    music_dir = Path(os.path.expanduser("~/story-videos/music"))
    music_files = list(music_dir.glob("*.mp3")) if music_dir.exists() else []
    import random
    music_path = str(random.choice(music_files)) if music_files else None

    # 6. Final render
    print("Rendering final video...")
    output = str(OUT / f"ad_{reel_id}.mp4")

    # Build drawtext filter for captions (more reliable than subtitles filter)
    dt_parts = []
    for cap in captions:
        # Escape special chars for ffmpeg drawtext
        txt = cap["text"].replace("'", "'\\''").replace(":", "\\:")
        lines = txt.split("\\n") if "\\n" in txt else txt.split("\n")
        for li, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            y_offset = 1500 + li * 70
            dt_parts.append(
                f"drawtext=text='{line}'"
                f":fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf"
                f":fontsize=52:fontcolor=white:borderw=3:bordercolor=black"
                f":x=(w-text_w)/2:y={y_offset}"
                f":enable='between(t,{cap['start']},{cap['end']})'"
            )

    vf = ",".join(dt_parts)

    if music_path:
        subprocess.run([
            "ffmpeg", "-y",
            "-i", bg_path,
            "-i", voice_path,
            "-i", music_path,
            "-filter_complex",
            f"[0:v]{vf}[v];"
            f"[1:a]volume=1.0[voice];"
            f"[2:a]volume=0.12,afade=t=out:st={duration-1}:d=1[music];"
            f"[voice][music]amix=inputs=2:duration=first[a]",
            "-map", "[v]", "-map", "[a]",
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k",
            output
        ], check=True, capture_output=True)
    else:
        subprocess.run([
            "ffmpeg", "-y",
            "-i", bg_path,
            "-i", voice_path,
            "-filter_complex",
            f"[0:v]{vf}[v]",
            "-map", "[v]", "-map", "1:a",
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k",
            output
        ], check=True, capture_output=True)

    dl = os.path.expanduser(f"~/Downloads/drivefinder-reel-{reel_id}.mp4")
    shutil.copy2(output, dl)
    print(f"Done! {dl}")

    # Cleanup
    for p in bg_parts:
        Path(p).unlink(missing_ok=True)
    Path(concat_file).unlink(missing_ok=True)
    Path(bg_path).unlink(missing_ok=True)


def format_srt_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


# --- REEL 01: 10 second ad ---

voice_script = (
    "Need to find a private driving instructor in Singapore? "
    "We check which ones are actually taking students right now. "
    "Free to submit. You only pay if we find you a match. "
    "drivefindersg dot uqlabs dot co."
)

captions = [
    {"text": "Need to find a private\ndriving instructor?", "start": 0.0, "end": 2.8},
    {"text": "We check which ones are\nactually taking students", "start": 2.8, "end": 5.2},
    {"text": "Free to submit\nOnly pay if matched", "start": 5.2, "end": 7.5},
    {"text": "drivefindersg.uqlabs.co", "start": 7.5, "end": 10.0},
]

clips = [
    "person driving car interior",
    "phone scrolling searching",
    "thumbs up happy person",
    "car driving road city",
]

make_ad("01", voice_script, captions, clips, rate="+0%")
