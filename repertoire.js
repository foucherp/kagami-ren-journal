(async()=>{
'use strict';
const root=document.getElementById('directory-content'),tabs=document.getElementById('directory-tabs'),search=document.getElementById('npc-search'),total=document.getElementById('total');
const repo='https://api.github.com/repos/foucherp/kagami-ren-journal/contents/';
const profiles=[['team',"L'ÉQUIPE"],['common','COMMUN'],['vesper','CONTACTS VESPER'],['silk','CONTACTS SILK'],['makoto','CONTACTS MAKOTO'],['plurk','CONTACTS PLURK'],['naphria','CONTACTS NAPHRIA']];
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n};
async function files(folder){const r=await fetch(repo+folder,{cache:'no-store'});if(r.status===404)return [];if(!r.ok)throw Error('HTTP '+r.status+' : '+folder);const data=await r.json();return Array.isArray(data)?data:[]}
async function json(path){try{const r=await fetch(path,{cache:'no-store'});return r.ok?await r.json():{}}catch{return {}}}
const data=await json('personnages.json');
let active=new URLSearchParams(location.search).get('tab')||'team';
if(!profiles.some(p=>p[0]===active))active='team';
const people=[];
function add(file,folder,source){
if(file.type!=='file')return;
let m,kind,episode=null,part;
if(folder==='PJ'){m=file.name.match(/^Team-(.+)\.(png|jpe?g|webp)$/i);if(!m)return;kind='team';part=m[1]}
else if((m=file.name.match(/^Contact-(.+)\.(png|jpe?g|webp)$/i))){kind=source||'vesper';part=m[1]}
else if((m=file.name.match(/^(S\d{2}e\d{2})-(.+)\.(png|jpe?g|webp)$/i))){kind='common';episode=m[1];part=m[2]}
else return;
const bits=part.split('-');if(bits.length<2)return;
const role=bits.pop().replace(/_/g,' '),name=bits.join('-').replace(/_/g,' ');
const path=folder+'/'+file.name;
const stable='contact:'+normalize(name).replace(/\s+/g,'-');
const info=(kind==='vesper'||kind==='team'||kind==='common'?data[path]||data[stable]:{})||{};
people.push({name:info.nom||name,role:info.role||role,path,url:folder+'/'+encodeURIComponent(file.name),kind,episode,info});
}
try{
const [pj,pnj]=await Promise.all([files('PJ'),files('PNJ')]);
pj.forEach(f=>add(f,'PJ'));pnj.forEach(f=>add(f,'PNJ'));
/* Pour chaque joueur, ses futurs portraits vont dans contacts/<profil>/.
   Ses métadonnées sont dans contacts/<profil>/personnages.json.
   Les dossiers absents donnent simplement un onglet vide. */
for(const id of ['silk','makoto','plurk','naphria']){
const folder='contacts/'+id;
const [images,metadata]=await Promise.all([files(folder),json(folder+'/personnages.json')]);
for(const file of images){const count=people.length;add(file,folder,id);if(people.length>count){const p=people[people.length-1];const key='contact:'+normalize(p.name).replace(/\s+/g,'-');p.info=metadata[p.path]||metadata[file.name]||metadata[key]||{};p.name=p.info.nom||p.name;p.role=p.info.role||p.role}}
}
people.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
const selected=new URLSearchParams(location.search).get('person');
if(selected){const p=people.find(x=>x.path===selected);if(p){active=p.kind;search.value=p.name}}
function section(parent,title,value,cls){if(!value)return;const s=el('section','person-section');s.append(el('h4','',title),el('p',cls||'',value));parent.append(s)}
function card(p){const card=el('div','person-card'),head=el('div','person-head'),img=el('img');img.src=p.url;img.alt='Portrait de '+p.name;img.loading='lazy';head.append(img);
const facts=el('div','person-facts'),i=p.info||{};facts.append(el('h3','',p.name),el('div','person-role',p.role.toUpperCase()));
const dl=el('dl');for(const [k,v] of [['Identité civile',i.identite_civile||'Inconnu'],['Métatype',i.metatype||'Inconnu'],['Affiliation',i.affiliation||'Inconnu'],['Statut',i.statut||'Inconnu']]){if(v)dl.append(el('dt','',k),el('dd','',v))}
facts.append(dl);
if(!['team','common'].includes(p.kind)){const ratings=[['RÉSEAU',i.reseau],['LOYAUTÉ',i.loyaute]].filter(([,v])=>Number.isInteger(v)&&v>=0&&v<=12);if(ratings.length){const panel=el('div','contact-ratings');for(const [label,value] of ratings){const block=el('div','contact-rating'),heading=el('div','contact-rating-label'),cells=el('div','contact-rating-cells');heading.append(el('span','',label),el('span','',value+' / 12'));for(let n=0;n<12;n++){const cell=el('span','contact-rating-cell'+(n<value?' filled':''));cell.setAttribute('aria-hidden','true');cells.append(cell)}block.setAttribute('role','img');block.setAttribute('aria-label',label+' : '+value+' sur 12');block.append(heading,cells);panel.append(block)}facts.append(panel)}}
head.append(facts);card.append(head);section(card,'INFORMATIONS CONNUES',i.description||'Inconnu');section(card,p.kind==='vesper'||p.kind==='team'||p.kind==='common'?'AVIS DE VESPER':'AVIS PERSONNEL',i.avis||'Inconnu','person-opinion');
if(i.premiere_apparition&&/^VESPER_\d{3,}$/.test(i.premiere_apparition)){const sec=el('section','person-section');sec.append(el('h4','','PREMIÈRE APPARITION'));const a=el('a','',i.premiere_apparition);a.href='archive.html?id='+encodeURIComponent(i.premiere_apparition);sec.append(a);card.append(sec)}return card}
function row(p){const wrap=el('div','person-row'),btn=el('button','npc');btn.type='button';btn.setAttribute('aria-expanded','false');btn.append(el('span','npc-name',p.name),el('span','npc-role',p.role));btn.onclick=()=>{const previous=wrap.querySelector('.person-card');if(previous){previous.remove();btn.setAttribute('aria-expanded','false');return}const container=wrap.parentElement;container.querySelectorAll('.person-card').forEach(n=>n.remove());container.querySelectorAll('.npc[aria-expanded=true]').forEach(n=>n.setAttribute('aria-expanded','false'));wrap.append(card(p));btn.setAttribute('aria-expanded','true')};wrap.append(btn);return wrap}
function render(){tabs.replaceChildren();for(const [id,label] of profiles){const b=el('button','directory-tab',label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(active===id));b.onclick=()=>{active=id;search.value='';history.replaceState(null,'',location.pathname+'?tab='+id);render()};tabs.append(b)}
root.replaceChildren();const q=normalize(search.value.trim());const shown=people.filter(p=>p.kind===active&&(!q||[p.name,p.role,p.info.affiliation,p.info.identite_civile].some(v=>normalize(v).includes(q))));total.textContent=shown.length+' PERSONNAGE'+(shown.length>1?'S':'');
if(!shown.length){root.append(el('p','directory-state',q?'AUCUN RÉSULTAT':'AUCUNE FICHE DANS CET ONGLET'));return}
if(active==='common'){const groups=new Map();for(const p of shown){const k=p.episode||'AUTRES';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)}for(const [code,group] of [...groups].sort((a,b)=>a[0].localeCompare(b[0], 'fr',{numeric:true}))){const details=el('details','episode'),summary=el('summary'),list=el('div','episode-list');summary.append(el('span','',code),el('span','directory-count',group.length+' PERSONNAGE'+(group.length>1?'S':'')));group.forEach(p=>list.append(row(p)));details.append(summary,list);root.append(details)}}
else shown.forEach(p=>root.append(row(p)));
if(selected){const p=shown.find(p=>p.path===selected);if(p){const btn=[...root.querySelectorAll('.npc')].find(b=>b.textContent.includes(p.name));if(btn){const parent=btn.closest('details');if(parent)parent.open=true;btn.click()}}}
}
search.addEventListener('input',render);render();
}catch(e){root.replaceChildren(el('p','directory-state','RÉPERTOIRE INDISPONIBLE // '+e.message));total.textContent='ERREUR'}
})();