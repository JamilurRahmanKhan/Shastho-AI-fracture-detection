import os

LABEL_DIR = r"X:\02012026 - FYDP\datasets\data\labels"
NC = 1  # number of classes

bad_files = []

for split in ["train", "valid", "test"]:
    path = os.path.join(LABEL_DIR, split)
    if not os.path.exists(path):
        continue

    for f in os.listdir(path):
        if not f.endswith(".txt"):
            continue

        fp = os.path.join(path, f)
        with open(fp, "r") as file:
            for i, line in enumerate(file.readlines()):
                parts = line.strip().split()

                # must be exactly 5 values
                if len(parts) != 5:
                    bad_files.append((fp, i, "Wrong column count"))
                    break

                cls, x, y, w, h = parts

                # class check
                if not cls.isdigit() or int(cls) >= NC:
                    bad_files.append((fp, i, f"Invalid class {cls}"))
                    break

                # bbox range check
                try:
                    x, y, w, h = map(float, [x, y, w, h])
                    if not (0 <= x <= 1 and 0 <= y <= 1 and 0 < w <= 1 and 0 < h <= 1):
                        bad_files.append((fp, i, "BBox out of range"))
                        break
                except:
                    bad_files.append((fp, i, "Non-numeric bbox"))
                    break

print(f"❌ Found {len(bad_files)} bad label files")
for b in bad_files[:10]:
    print(b)

if bad_files:
    print("⚠️ Delete these label files before training.")
else:
    print("✅ All labels are valid.")
