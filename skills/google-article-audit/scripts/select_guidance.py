#!/usr/bin/env python3
"""Select a small relevant slice of the bundled official-source cache. No network or writes."""
import argparse
import json
from pathlib import Path
import sys


def read(name):
    return json.loads((Path(__file__).resolve().parent.parent / 'references' / name).read_text(encoding='utf-8'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list', action='store_true', help='List modules and their triggers')
    parser.add_argument('--module', action='append', default=[], help='Select a named conditional module; repeatable')
    parser.add_argument('--check', action='append', default=[], help='Select a stable internal check ID; repeatable')
    parser.add_argument('--source', action='append', default=[], help='Select an official source ID; repeatable')
    parser.add_argument('--summary', action='store_true', help='Omit extended source observations')
    args = parser.parse_args()
    modules = read('modules.json')
    checks = {x['id']:x for x in read('checks.json')['checks']}
    cache = read('source-registry.json')
    sources = {x['id']:x for x in cache['sources']}
    if args.list:
        print(json.dumps({k:v['trigger'] for k,v in modules.items()}, ensure_ascii=False, indent=2))
        return
    if not (args.module or args.check or args.source):
        parser.error('Choose --list, --module, --check or --source; no whole-catalog default.')
    for label, requested, known in [('module',args.module,modules),('check',args.check,checks),('source',args.source,sources)]:
        unknown = sorted(set(requested)-set(known))
        if unknown:
            parser.error(f'Unknown {label}: {", ".join(unknown)}')
    selected_checks = set(args.check)
    selected_sources = set(args.source)
    for m in args.module:
        selected_checks.update(modules[m].get('checks',[]))
        selected_sources.update(modules[m].get('sources',[]))
    for cid in selected_checks:
        selected_sources.update(checks[cid]['source_ids'])
    source_results = [dict(sources[sid]) for sid in sorted(selected_sources)]
    if args.summary:
        for source in source_results:
            source.pop('notes', None)
    out = {'cache_as_of':cache['as_of'], 'warning':'Cached successful reads, not new live verification; local checks are not a Google score.',
           'modules':{m:modules[m] for m in dict.fromkeys(args.module)},
           'checks':[checks[cid] for cid in sorted(selected_checks)], 'sources':source_results}
    print(json.dumps(out,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
