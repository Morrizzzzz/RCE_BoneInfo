export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function matches(text, query) {
  const hay = normalize(text);
  return normalize(query).trim().split(/\s+/).filter(Boolean).every(word => {
    const pattern = word.split('').map(c => c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('');
    return new RegExp(pattern,'u').test(hay);
  });
}
export function prepare(data) {
  const t=data.tables;
  const species=new Map(t.tblDiersoort.map(s=>[s.diersoortID,s]));
  const journals=new Map(t.tblPeriodiek.map(j=>[j.PeriodiekID,j.Omschrijving]));
  const periods=new Map(t.tblPeriode.map(p=>[p.periodecode,p]));
  const rows=t.tblZoo_cluster.map(c=>({...c,species:[],publications:[]}));
  const byId=new Map(rows.map(c=>[c.Zoonr,c]));
  for(const link of t.tblZoo_diersoort) byId.get(link.Zoonr)?.species.push({...link,taxon:species.get(link.DiersoortID)});
  for(const p of t.tblZoo_publicatie) byId.get(p.Zoonr)?.publications.push({...p,journal:journals.get(p.Periodiek)||''});
  const year=v=>v.trim()===''||Number(v)===0?null:Number(v);
  const bound=(code,key)=>code!=='Onbekend'&&periods.has(code)?Number(periods.get(code)[key]):null;
  for(const c of rows){
    c.species.sort((a,b)=>Number(a.Volgnr)-Number(b.Volgnr));
    c.publications.sort((a,b)=>Number(a.Volgnr)-Number(b.Volgnr));
    c.speciesText=c.species.map(s=>Object.values(s.taxon||{}).join(' ')+' '+s.Opmerking).join(' ');
    c.publicationText=c.publications.map(p=>Object.values(p).join(' ')).join(' ');
    c.text=Object.values(Object.fromEntries(Object.entries(c).filter(([k])=>!['species','publications','speciesText','publicationText'].includes(k)))).join(' ')+' '+c.speciesText+' '+c.publicationText+' '+[c.Begin_periode,c.Eind_periode].map(p=>periods.get(p)?.omschrijving||'').join(' ');
    c.start=year(c.Beginjaar)??bound(c.Begin_periode,'beginwaarde');
    c.end=year(c.Eindjaar)??bound(c.Eind_periode,'eindwaarde');
  }
  return {rows,byId,periods,species};
}
export function filterRows(rows,filters,periods) {
  let low=filters.from!==''&&filters.from!=null?Number(filters.from):-Infinity;
  let high=filters.to!==''&&filters.to!=null?Number(filters.to):Infinity;
  if(filters.period&&filters.period!=='Onbekend'){const p=periods.get(filters.period);if(p){low=Math.max(low,Number(p.beginwaarde));high=Math.min(high,Number(p.eindwaarde));}}
  return rows.filter(c=>
    (!filters.q||matches(c.text,filters.q))&&
    (!filters.province||c.Provincie===filters.province)&&
    (filters.period!=='Onbekend'||c.Begin_periode==='Onbekend'||c.Eind_periode==='Onbekend')&&
    (!filters.type||c.Complextype===filters.type)&&
    (!filters.place||matches(c.Plaats+' '+c.Gemeente,filters.place))&&
    (!filters.species||c.species.some(s=>matches(Object.values(s.taxon||{}).join(' '),filters.species)))&&
    (!filters.group||c.species.some(s=>s.taxon?.group===filters.group))&&
    (!filters.researcher||matches(c.Onderzoeker+' '+c.Onderzoeksinstantie,filters.researcher))&&
    (!filters.publication||matches(c.publicationText,filters.publication))&&
    (!filters.cluster||c.Zoonr===filters.cluster)&&
    (low===-Infinity&&high===Infinity||(low<=high&&c.start!==null&&c.end!==null&&c.start<=high&&c.end>=low))
  );
}
export function csvValue(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s)&&!/^\s*-?\d+(\.\d+)?\s*$/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
