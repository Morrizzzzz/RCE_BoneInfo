#!/usr/bin/env python3
"""Export BoneInfo with mdbtools (apt install mdbtools). No Python packages required."""
import argparse, csv, datetime, hashlib, io, json, pathlib, subprocess
TABLES = ['tblZoo_cluster','tblZoo_diersoort','tblDiersoort','tblZoo_publicatie','tblPeriodiek','tblPeriode','tblOmvang']
def export(source, destination):
    tables = {}
    for table in TABLES:
        result = subprocess.run(['mdb-export',str(source),table],check=True,capture_output=True,text=True,encoding='utf-8')
        tables[table] = list(csv.DictReader(io.StringIO(result.stdout)))
    clusters = {r['Zoonr'] for r in tables['tblZoo_cluster']}
    assert len(clusters) == len(tables['tblZoo_cluster']), 'Duplicate cluster IDs'
    taxa = {r['diersoortID'] for r in tables['tblDiersoort']}
    journals = {r['PeriodiekID'] for r in tables['tblPeriodiek']}
    checks = {
        'species_links_without_cluster': sum(r['Zoonr'] not in clusters for r in tables['tblZoo_diersoort']),
        'species_links_without_taxon': sum(r['DiersoortID'] not in taxa for r in tables['tblZoo_diersoort']),
        'publications_without_cluster': sum(r['Zoonr'] not in clusters for r in tables['tblZoo_publicatie']),
        'publications_without_journal': sum(bool(r['Periodiek']) and r['Periodiek'] not in journals for r in tables['tblZoo_publicatie'])
    }
    metadata = {'source':'https://cultureelerfgoed.info/BoneInfo/', 'database':source.name, 'exported':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'counts':{k:len(v) for k,v in tables.items()}, 'checks':checks}
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps({'metadata':metadata,'tables':tables},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(json.dumps(metadata,ensure_ascii=False,indent=2))
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('database',type=pathlib.Path)
    parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]/'data/boneinfo.json')
    args = parser.parse_args()
    export(args.database,args.output)
