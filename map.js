import {aggregate,createSpatial,CLASSES,colorFor,RESOLUTIONS} from './spatial.js';
import {csvValue} from './search.js';
const $=id=>document.getElementById(id),fmt=n=>n.toLocaleString('nl-NL');
const reason={missing:'Ontbrekende of nulcoördinaten',invalid:'Buiten RD-bereik of ongeldig'};
function download(filename,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function initMap({openDetail,onChange,getFilters}){
 const L=globalThis.L,proj4=globalThis.proj4;
 if(!L||!proj4){$('map-stats').textContent='Kaart niet beschikbaar.';$('map-failure').hidden=false;$('map-failure').textContent='De kaartbibliotheken ontbreken. Upload ook de map vendor. De zoeklijst blijft werken.';return {update(){}};}
 const spatial=createSpatial(proj4);
 const map=L.map('distribution-map',{scrollWheelZoom:false,minZoom:5,maxZoom:18,zoomSnap:.25,zoomDelta:.5}).setView([52.15,5.4],7);
 L.control.scale({imperial:false,position:'bottomleft'}).addTo(map);
 const tiles=L.tileLayer('https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{matrix}/{x}/{y}.png',{minZoom:0,maxZoom:19,attribution:'Kaart: <a href="https://www.pdok.nl/">PDOK</a> / <a href="https://www.kadaster.nl/">Kadaster</a> | Data: <a href="https://cultureelerfgoed.info/BoneInfo/">BoneInfo · RCE</a>'});
 tiles.getTileUrl=coords=>'https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/'+String(coords.z).padStart(2,'0')+'/'+coords.x+'/'+coords.y+'.png';
 tiles.on('tileerror',()=>{$('map-failure').hidden=false;$('map-failure').textContent='De achtergrondkaart is niet volledig geladen. Onderzoeksclusters en rastercellen blijven beschikbaar; probeer de pagina later te verversen.';});
 tiles.addTo(map);
 const layer=L.geoJSON(null,{style:f=>({color:'#154273',weight:1,fillColor:colorFor(f.properties.count),fillOpacity:.72}),pointToLayer:(f,latlng)=>L.circleMarker(latlng,{radius:6+Math.min(10,Math.sqrt(f.properties.count)),color:'#154273',weight:1.5,fillColor:colorFor(f.properties.count),fillOpacity:.9}),onEachFeature:(f,l)=>{
  const tip=document.createElement('span');tip.textContent=`${f.properties.count} ${f.properties.count===1?'cluster':'clusters'} — klik voor details`;l.bindTooltip(tip,{sticky:true});
  l.on('click',()=>select(f.id));
  l.on('add',()=>{const el=l.getElement();if(el){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`${f.properties.count} clusters op RD ${f.properties.rd_x}, ${f.properties.rd_y}. Toon clusters.`);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(f.id);}});}});
 }}).addTo(map);
 let rows=[],result=null,selected=null,first=true;
 $('map-legend-items').replaceChildren(...CLASSES.map(c=>{const span=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=c.color;span.append(swatch,document.createTextNode(c.label));return span;}));
 function clearSelection(){selected=null;$('map-selection').hidden=true;layer.resetStyle();}
 function select(key){const b=result.buckets.find(b=>b.key===key);if(!b)return;selected=key;
  layer.eachLayer(l=>{layer.resetStyle(l);if(l.feature.id===key)l.setStyle({color:'#a15b00',weight:3,fillOpacity:.9});});
  $('map-selection').hidden=false;$('map-selection-title').textContent=`${fmt(b.members.length)} clusters · ${b.size?'rastercel '+b.size/1000+' km':'bronlocatie'} · RD ${b.x}, ${b.y}`;
  $('map-selection-list').replaceChildren(...b.members.map(c=>{const button=document.createElement('button');button.type='button';const title=document.createElement('strong');title.textContent=`${c.Plaats||'Onbekende plaats'}${c.Toponiem?' — '+c.Toponiem:''}`;const meta=document.createElement('span');meta.textContent=`Cluster ${c.Zoonr} · ${c.Complextype||'Complextype onbekend'}`;button.append(title,meta);button.onclick=()=>openDetail(c.Zoonr);return button;}));
 }
 function fit(){if(layer.getLayers().length)map.fitBounds(layer.getBounds(),{padding:[25,25],maxZoom:result.resolution==='points'?13:result.resolution==='1000'?12:10});else map.setView([52.15,5.4],7);}
 function redraw(){const resolution=$('resolution').value;result=aggregate(rows,resolution);clearSelection();layer.clearLayers();layer.addData(spatial.collection(result));
  $('map-stats').textContent=`${fmt(result.mapped)} van ${fmt(result.total)} clusters op de kaart · ${fmt(result.missing.length)} zonder coördinaten · ${fmt(result.invalid.length)} buiten bereik/ongeldig`;
  $('map-unit').textContent=resolution==='points'?'bronlocatie':'rastercel';
  $('map-caption').textContent=resolution==='points'?`${fmt(result.buckets.length)} unieke broncoördinaten. Samenvallende clusters zijn samengevoegd. Bronlocaties zijn geen gegarandeerd exacte vindplaatsen.`:`${fmt(result.buckets.length)} bezette cellen van ${Number(resolution)/1000} × ${Number(resolution)/1000} km (${(Number(resolution)/1000)**2} km² per cel). Alleen cellen met resultaten zijn ingekleurd. De legenda gebruikt vaste telklassen op alle resoluties.`;
  $('map-export').disabled=!result.mapped;$('map-fit').disabled=!result.mapped;$('map-audit').disabled=!(result.missing.length+result.invalid.length);
  if(first){map.invalidateSize();fit();first=false;}
 }
 $('resolution').onchange=()=>{redraw();onChange();};
 $('map-fit').onclick=fit;$('map-selection-clear').onclick=clearSelection;
 $('map-export').onclick=()=>download(`boneinfo-kaart-${result.resolution}.geojson`,JSON.stringify(spatial.collection(result,getFilters()),null,2),'application/geo+json');
 $('map-audit').onclick=()=>{const values=[['Clusternummer','Plaats','X_coord','Y_coord','Reden'],...['missing','invalid'].flatMap(k=>result[k].map(c=>[c.Zoonr,c.Plaats,c.X_coord,c.Y_coord,reason[k]]))];download('boneinfo-uitgesloten-locaties.csv','\uFEFF'+values.map(r=>r.map(csvValue).join(';')).join('\r\n'),'text/csv;charset=utf-8');};
 const params=new URLSearchParams(location.search);if(RESOLUTIONS.includes(params.get('resolution')))$('resolution').value=params.get('resolution');
 new ResizeObserver(()=>map.invalidateSize()).observe($('distribution-map'));
 return {update(nextRows){rows=nextRows;redraw();}};
}
