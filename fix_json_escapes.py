import glob
import json

VALID_ESCAPES = {'"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'}

def fix_json_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            json.load(f)
        return
    except Exception:
        pass

    with open(filepath, 'r', encoding='utf-8') as f:
        s = f.read()

    out = []
    i = 0
    n = len(s)
    in_string = False
    fixed = 0

    while i < n:
        c = s[i]
        if c == '"':
            # Check if escaped
            num_slashes = 0
            j = i - 1
            while j >= 0 and s[j] == '\\':
                num_slashes += 1
                j -= 1
            if num_slashes % 2 == 0:
                in_string = not in_string
            out.append(c)
            i += 1
        elif in_string and c == '\\':
            if i + 1 < n:
                nxt = s[i + 1]
                if nxt in VALID_ESCAPES:
                    out.append(c)
                    out.append(nxt)
                    i += 2
                else:
                    out.append('\\\\')
                    out.append(nxt)
                    i += 2
                    fixed += 1
            else:
                out.append('\\\\')
                i += 1
                fixed += 1
        else:
            out.append(c)
            i += 1

    new_s = "".join(out)
    try:
        json.loads(new_s)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_s)
        print(f"Fixed {fixed} bad escapes in {filepath}")
    except Exception as e:
        print(f"Failed to fix {filepath}: {e}")

if __name__ == '__main__':
    for p in glob.glob('**/*.json', recursive=True):
        if any(skip in p for skip in ['node_modules', '.next', '.git']):
            continue
        fix_json_file(p)
