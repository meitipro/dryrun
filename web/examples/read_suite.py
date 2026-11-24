"""
Read a suite from Python with genlayer-py 0.19.0rc2.

    python web/examples/read_suite.py <rules id>

Reads need an account even for views, so a throwaway one is made and never funded.
"""
import json
import sys

from genlayer_py import create_account, create_client
from genlayer_py.chains import studio_devnet

CONTRACT = json.load(open("web/lib/deployment.json"))["dryrun"]
studio_devnet.rpc_urls = {"default": {"http": ["https://studio-next.genlayer.com/api"]}}

client = create_client(chain=studio_devnet, account=create_account())
rules_id = int(sys.argv[1])
rules = json.loads(client.read_contract(address=CONTRACT, function_name="get_rules", args=[rules_id]))
cases = json.loads(client.read_contract(address=CONTRACT, function_name="list_cases", args=[rules_id])).get("cases", [])
print(json.dumps({
    "found": rules["found"],
    "name": rules.get("name"),
    "version": rules.get("version"),
    "suite": rules.get("suite"),
    "counts": rules.get("counts"),
    "cases": [{"id": c["id"], "expected": c["expected"], "label": c["label"], "result": c["result"]} for c in cases],
}))
