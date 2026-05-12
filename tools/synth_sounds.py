"""Synthesize placeholder 8-bit-style sounds for the demo.

Generates WAV files at 22050 Hz mono. Drop the output into
demo/assets/sounds/. Easy to replace later with real Kenney audio.
"""
import math
import struct
import wave
from pathlib import Path

SR = 22050  # samples per second


def envelope(n: int, attack: int, release: int) -> list[float]:
    env = [1.0] * n
    for i in range(min(attack, n)):
        env[i] *= i / attack
    for i in range(min(release, n)):
        env[n - 1 - i] *= i / release
    return env


def square(freq: float, n: int) -> list[float]:
    period = SR / freq
    return [1.0 if (i % period) < (period / 2) else -1.0 for i in range(n)]


def sine(freq: float, n: int) -> list[float]:
    return [math.sin(2 * math.pi * freq * i / SR) for i in range(n)]


def write_wav(path: Path, samples: list[float], gain: float = 0.4) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # 16-bit
        w.setframerate(SR)
        clipped = [max(-1.0, min(1.0, s * gain)) for s in samples]
        frames = b"".join(struct.pack("<h", int(s * 32767)) for s in clipped)
        w.writeframes(frames)


def jump() -> list[float]:
    """Rising square wave 200→600 Hz, 100 ms."""
    n = int(SR * 0.10)
    out = []
    for i in range(n):
        t = i / n
        freq = 200 + (600 - 200) * t
        period = SR / freq
        out.append(1.0 if (i % period) < (period / 2) else -1.0)
    env = envelope(n, attack=int(SR * 0.005), release=int(SR * 0.02))
    return [s * e for s, e in zip(out, env)]


def coin() -> list[float]:
    """Short bright ping: 988 Hz then 1318 Hz, 120 ms total."""
    n1 = int(SR * 0.04)
    n2 = int(SR * 0.08)
    s = sine(988, n1) + sine(1318, n2)
    env = envelope(len(s), attack=int(SR * 0.002), release=int(SR * 0.04))
    return [a * b for a, b in zip(s, env)]


def stomp() -> list[float]:
    """Low thud: 90 Hz pitch dropping to 40 Hz, 150 ms."""
    n = int(SR * 0.15)
    out = []
    for i in range(n):
        t = i / n
        freq = 90 - 50 * t
        out.append(math.sin(2 * math.pi * freq * i / SR))
    env = envelope(n, attack=int(SR * 0.003), release=int(SR * 0.08))
    return [s * e for s, e in zip(out, env)]


def death() -> list[float]:
    """Descending square: 440 Hz → 110 Hz over 500 ms."""
    n = int(SR * 0.5)
    out = []
    for i in range(n):
        t = i / n
        freq = 440 - 330 * t
        period = SR / freq
        out.append(1.0 if (i % period) < (period / 2) else -1.0)
    env = envelope(n, attack=int(SR * 0.005), release=int(SR * 0.12))
    return [s * e for s, e in zip(out, env)]


def win() -> list[float]:
    """Major triad arpeggio C-E-G-C, 600 ms."""
    notes = [523, 659, 784, 1047]  # C5, E5, G5, C6
    each = int(SR * 0.15)
    out = []
    for f in notes:
        seg = sine(f, each)
        env = envelope(each, attack=int(SR * 0.005), release=int(SR * 0.03))
        out.extend(s * e for s, e in zip(seg, env))
    return out


def main() -> None:
    out_dir = Path("demo/assets/sounds")
    sounds = {
        "jump":  jump(),
        "coin":  coin(),
        "stomp": stomp(),
        "death": death(),
        "win":   win(),
    }
    for name, samples in sounds.items():
        path = out_dir / f"{name}.wav"
        write_wav(path, samples)
        print(f"wrote {path}  ({len(samples) / SR * 1000:.0f} ms)")


if __name__ == "__main__":
    main()
