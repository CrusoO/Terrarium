from __future__ import annotations

import argparse
import json

from terrarium_sandbox.runner import SandboxRunner


def main() -> None:
    parser = argparse.ArgumentParser(description="Terrarium sandbox fixture runner")
    parser.add_argument("action", choices=["start", "health", "stop"])
    parser.add_argument("--session-id", default="p1-s3")
    args = parser.parse_args()
    runner = SandboxRunner()
    if args.action == "start":
        handle = runner.start(args.session_id)
        print(handle.model_dump_json(indent=2))
        return
    if args.action == "health":
        report = runner.health(args.session_id)
        print(report.model_dump_json(indent=2))
        return
    runner.stop(args.session_id)
    print(json.dumps({"stopped": args.session_id}))


if __name__ == "__main__":
    main()
