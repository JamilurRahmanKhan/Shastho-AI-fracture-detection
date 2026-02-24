import os

LABEL_DIR = r"X:\02012026 - FYDP\datasets\data\labels"

fixed = 0

for split in ["train", "valid", "test"]:
    path = os.path.join(LABEL_DIR, split)
    if not os.path.exists(path):
        continue

    for f in os.listdir(path):
        if not f.endswith(".txt"):
            continue

        fp = os.path.join(path, f)
        new_lines = []

        with open(fp, "r") as file:
            for line in file:
                parts = line.strip().split()
                if len(parts) != 5:
                    continue  # skip malformed lines

                # FORCE class to 0
                _, x, y, w, h = parts
                new_lines.append(f"0 {x} {y} {w} {h}\n")

        with open(fp, "w") as file:
            file.writelines(new_lines)

        fixed += 1

print(f"✅ Fixed class IDs in {fixed} label files")
