import sys, os, shutil
take, times = sys.argv[1], [float(x) for x in sys.argv[2:]]
lines = open(f"takes/{take}/frames.txt").read().split("\n")
fr, t = [], 0.0
for i, l in enumerate(lines):
    if l.startswith("file") and i + 1 < len(lines) and lines[i+1].startswith("duration"):
        fr.append((t, l.split()[1])); t += float(lines[i+1].split()[1])
for q in times:
    f = [n for (s, n) in fr if s <= q][-1]
    print(q, f)
    shutil.copy(f"takes/{take}/{f}", f"peek_{take}_{q}.jpg")
