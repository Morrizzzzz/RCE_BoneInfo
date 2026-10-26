import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {aggregate,coordinateStatus,createSpatial,RESOLUTIONS,colorFor} from '../spatial.js';
import {prepare,filterRows} from '../search.js';
const context={module:{exports:{}},exports:{}};
vm.runInNewContext(fs.readFileSync(new URL('../vendor/proj4.js',import.meta.url),'utf8'),context);
const spatial=createSpatial(context.module.exports);
const data=JSON.parse(fs.readFileSync(new URL('../data/boneinfo.json',import.meta.url)));
const db=prepare(data);
for(const resolution of RESOLUTIONS){
 const r=aggregate(db.rows,resolution);
 assert.equal(r.mapped,2040);assert.equal(r.missing.length,376);assert.equal(r.invalid.length,18);
 assert.equal(r.buckets.reduce((n,b)=>n+b.members.length,0),2040);
 assert.equal(new Set(r.buckets.flatMap(b=>b.members.map(c=>c.Zoonr))).size,2040);
 if(resolution!=='points')for(const b of r.buckets){assert.equal(b.x%b.size,0);assert.equal(b.y%b.size,0);assert.ok(b.members.every(c=>+c.X_coord>=b.x&&+c.X_coord<b.x+b.size&&+c.Y_coord>=b.y&&+c.Y_coord<b.y+b.size));}
 const geo=spatial.collection(r,{species:'test'});
 assert.equal(geo.features.length,r.buckets.length);
 assert.equal(geo.features.reduce((n,f)=>n+f.properties.count,0),2040);
 for(const f of geo.features){if(f.geometry.type==='Polygon'){const ring=f.geometry.coordinates[0];assert.deepEqual(ring[0],ring.at(-1));assert.equal(ring.length,17);}assert.equal(f.properties.cluster_ids.length,f.properties.count);}
 console.log(`${resolution}: ${r.buckets.length} geometries; all 2040 clusters conserved`);
}
assert.equal(coordinateStatus({X_coord:'',Y_coord:'450000'}),'missing');
assert.equal(coordinateStatus({X_coord:'0',Y_coord:'450000'}),'missing');
assert.equal(coordinateStatus({X_coord:'525068',Y_coord:'455279'}),'invalid');
assert.equal(coordinateStatus({X_coord:'151',Y_coord:'444'}),'invalid');
const fixture=[{Zoonr:'a',X_coord:'99999',Y_coord:'449999'},{Zoonr:'b',X_coord:'100000',Y_coord:'450000'},{Zoonr:'c',X_coord:'100000',Y_coord:'450000'}];
const edge=aggregate(fixture,'10000');assert.equal(edge.buckets.length,2);assert.equal(edge.buckets[1].x,100000);assert.equal(edge.buckets[1].members.length,2);
assert.equal(aggregate(fixture,'points').buckets.length,2);
const selected=filterRows(db.rows,{place:'Nijmegen',species:'rund'},db.periods);
assert.equal(selected.length,51);const r=aggregate(selected,'1000');assert.equal(r.total,51);assert.equal(r.mapped+r.missing.length+r.invalid.length,51);
assert.equal(aggregate([],'10000').buckets.length,0);
assert.throws(()=>aggregate(db.rows,'100'));
assert.notEqual(colorFor(1),colorFor(51));
// Reference coordinates generated independently with pyproj EPSG:28992 -> EPSG:4326.
const checks=[[[155000, 463000], [5.3872035084137675, 52.15517230119224]], [[121000, 487000], [4.887970764831781, 52.36982620983305]], [[187080, 421340], [5.852070908417186, 51.77980258127334]], [[70943, 446954], [4.16300155614425, 52.00458451065905]], [[200000, 310000], [6.025178264923115, 50.77816096101843]]];
for(const [point,expected] of checks){const actual=spatial.convert(point);assert.ok(Math.abs(actual[0]-expected[0])<0.00003);assert.ok(Math.abs(actual[1]-expected[1])<0.00003);}
console.log('PASS: RD grid boundaries, duplicate coordinates, exclusions, filtered/empty data, GeoJSON counts/rings and CRS control points.');
