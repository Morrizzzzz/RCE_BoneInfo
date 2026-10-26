// All aggregation happens in source RD metres, never in geographic degrees or screen pixels.
export const RD = '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.4171,50.3319,465.5524,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs';
export const RESOLUTIONS = ['points','1000','5000','10000','25000'];
export const CLASSES = [
 {min:1,max:1,label:'1',color:'#d3e9d6'},
 {min:2,max:5,label:'2–5',color:'#96c6a6'},
 {min:6,max:10,label:'6–10',color:'#61a887'},
 {min:11,max:25,label:'11–25',color:'#348266'},
 {min:26,max:50,label:'26–50',color:'#155e48'},
 {min:51,max:Infinity,label:'51+',color:'#083b30'}
];
export const colorFor=n=>(CLASSES.find(c=>n>=c.min&&n<=c.max)||CLASSES[0]).color;
export function coordinateStatus(c){
 if(String(c.X_coord??'').trim()===''||String(c.Y_coord??'').trim()==='')return 'missing';
 const x=Number(c.X_coord),y=Number(c.Y_coord);
 if(!Number.isFinite(x)||!Number.isFinite(y))return 'invalid';
 if(x===0||y===0)return 'missing';
 return x>0&&x<300000&&y>300000&&y<625000?'valid':'invalid';
}
export function aggregate(rows,resolution='10000'){
 if(!RESOLUTIONS.includes(resolution))throw Error('Ongeldige resolutie');
 const buckets=new Map(),missing=[],invalid=[];const size=Number(resolution);
 for(const c of rows){
  const status=coordinateStatus(c);
  if(status==='missing'){missing.push(c);continue;}if(status==='invalid'){invalid.push(c);continue;}
  const x=Number(c.X_coord),y=Number(c.Y_coord);
  const bx=resolution==='points'?x:Math.floor(x/size)*size;
  const by=resolution==='points'?y:Math.floor(y/size)*size;
  const key=`${bx}_${by}`;
  if(!buckets.has(key))buckets.set(key,{key,x:bx,y:by,size:resolution==='points'?0:size,members:[]});
  buckets.get(key).members.push(c);
 }
 return {resolution,buckets:[...buckets.values()],missing,invalid,mapped:rows.length-missing.length-invalid.length,total:rows.length};
}
export function createSpatial(proj4){
 const projection=proj4(RD,'EPSG:4326');
 const convert=point=>projection.forward(point);
 function geometry(b){
  if(!b.size)return {type:'Point',coordinates:convert([b.x,b.y])};
  // Sample every edge to respect the projected RD grid on the web map.
  const corners=[[b.x,b.y],[b.x+b.size,b.y],[b.x+b.size,b.y+b.size],[b.x,b.y+b.size]];
  const ring=[];
  for(let e=0;e<4;e++){const a=corners[e],z=corners[(e+1)%4];for(let n=0;n<4;n++)ring.push(convert([a[0]+(z[0]-a[0])*n/4,a[1]+(z[1]-a[1])*n/4]));}
  ring.push(ring[0]);return {type:'Polygon',coordinates:[ring]};
 }
 function collection(result,filters={}){
  return {type:'FeatureCollection',metadata:{source:'https://cultureelerfgoed.info/BoneInfo/',aggregation_crs:'EPSG:28992',geometry_crs:'OGC:CRS84',resolution:result.resolution,measure:'number_of_research_clusters',filters,total_filtered:result.total,mapped_clusters:result.mapped,excluded_missing:result.missing.length,excluded_invalid:result.invalid.length,coordinate_quality:'range check only; no source-accuracy guarantee'},features:result.buckets.map(b=>({type:'Feature',id:b.key,geometry:geometry(b),properties:{count:b.members.length,cluster_ids:b.members.map(c=>c.Zoonr),rd_x:b.x,rd_y:b.y,cell_size_m:b.size,area_km2:b.size?b.size*b.size/1e6:null}}))};
 }
 return {convert,geometry,collection};
}
