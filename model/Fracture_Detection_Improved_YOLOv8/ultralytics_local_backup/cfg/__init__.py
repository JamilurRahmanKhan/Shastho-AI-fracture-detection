import sys
import os
import pandas as pd

def get_col(last_row, candidates):
    for c in candidates:
        if c in last_row.index:
            return float(last_row[c])
    raise KeyError(f"None of these columns found: {candidates}")

def main():
    if len(sys.argv) < 2:
        print("❌ Usage: python compute_f1.py <path_to_results.csv>")
        sys.exit(1)

    results_csv = sys.argv[1]

    if not os.path.exists(results_csv):
        print(f"❌ File not found: {results_csv}")
        sys.exit(1)

    df = pd.read_csv(results_csv)
    last = df.iloc[-1]

    precision = get_col(last, ["metrics/precision(B)", "metrics/precision", "P"])
    recall    = get_col(last, ["metrics/recall(B)", "metrics/recall", "R"])
    mAP50     = get_col(last, ["metrics/mAP50(B)", "metrics/mAP50", "mAP50"])

    f1 = 2 * precision * recall / (precision + recall + 1e-9)

    out_df = pd.DataFrame([{
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "mAP50": mAP50
    }])

    # Save into same folder as results.csv
    out_dir = os.path.dirname(results_csv)
    out_path = os.path.join(out_dir, "f1_results.csv")

    out_df.to_csv(out_path, index=False)

    print("✅ F1 score computed successfully")
    print(out_df)
    print(f"📄 Saved to: {out_path}")

if __name__ == "__main__":
    main()
