import base64, sys, os
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
dirname = os.path.dirname(args[0])
if dirname:
    os.makedirs(dirname, exist_ok=True)
open(args[0], "wb").write(base64.b64decode(args[1]))
print(f"Wrotten {args[0]}")