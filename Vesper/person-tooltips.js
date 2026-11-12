/* Mini-fiches du journal : données publiques uniquement, aucun accès aux archives chiffrées. */
(()=>{
const style=document.createElement('style');style.textContent=`
.person-ref{color:#e5a3a7;text-decoration:underline dotted #9d515a;text-underline-offset:3px;cursor:pointer;border:0;background:none;font:inherit;padding:0}
.person-ref:hover,.person-ref:focus-visible{color:#fff}
.person-tooltip{position:fixed;z-index:1000;width:min(315px,calc(100vw - 24px));padding:13px;background:#15161b;border:1px solid #9c434c;box-shadow:0 16px 35px #000b;color:#e7e7eb;font:13px/1.5 system-ui,sans-serif}
.person-tooltip[hidden]{display:none}
.person-tooltip-head{display:flex;gap:12px;align-items:flex-start}
.person-tooltip img{width:90px;height:116px;object-fit:cover;border:1px solid #45434b;flex:none}
.person-tooltip strong{display:block;font-size:16px}
.person-tooltip small{display:block;color:#b9a6a9;margin-bottom:8px}
.person-tooltip dl{margin:0}.person-tooltip dt{color:#999;font-size:10px;text-transform:uppercase}.person-tooltip dd{margin:0 0 5px}
.person-tooltip a{display:block;margin-top:12px;color:#f0a3aa;text-decoration:underline}
`;document.head.append(style);
const pop=document.createElement('div');pop.className='person-tooltip';pop.hidden=true;pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Aperçu du personnage');document.body.append(pop);
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const api='https://api.github.com/repos/foucherp/kagami-ren-journal/contents/';
let names=[],active=null,hideTimer;
const manual={'Vesper':['Ren','Kagami Ren'],'Silk':['Aya','Onee-chan']};
async function list(folder){try{const r=await fetch(api+folder,{cache:'no-store'});return r.ok?await r.json():[]}catch{return []}}
async function load(){
const [pj,pnj,res]=await Promise.all([list('PJ'),list('PNJ'),fetch('personnages.json',{cache:'no-store'})]);
const data=res.ok?await res.json():{};
for(const [folder,files] of [['PJ',pj],['PNJ',pnj]]){
if(!Array.isArray(files))continue;
for(const f of files){
if(f.type!=='file')continue;
const m=folder==='PJ'?f.name.match(/^Team-(.+)\.(?:png|jpe?g|webp)$/i):f.name.match(/^(?:Contact-|S\d{2}e\d{2}-)(.+)\.(?:png|jpe?g|webp)$/i);
if(!m)continue;
const parts=m[1].split('-');if(parts.length<2)continue;
const role=parts.pop().replace(/_/g,' '),name=parts.join('-').replace(/_/g,' ');
const path=folder+'/'+f.name;
const stable='contact:'+norm(name).replace(/\s+/g,'-');
const info=data[path]||data[stable]||{};
const display=info.nom||name;
names.push({name:display,role:info.role||role,path,img:folder+'/'+encodeURIComponent(f.name),info,aliases:[display,name,...(manual[display]||[]),...(Array.isArray(info.alias)?info.alias:[])]});
}}
names.sort((a,b)=>b.name.length-a.name.length);
}
function place(target){const r=target.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;let x=Math.min(Math.max(12,r.left),innerWidth-w-12);let y=r.bottom+9;if(y+h>innerHeight-10)y=Math.max(10,r.top-h-9);pop.style.left=x+'px';pop.style.top=y+'px'}
function show(person,target){
clearTimeout(hideTimer);active=target;pop.replaceChildren();
const head=document.createElement('div');head.className='person-tooltip-head';
const img=document.createElement('img');img.src=person.img;img.alt='Portrait de '+person.name;
const body=document.createElement('div');const title=document.createElement('strong');title.textContent=person.name;body.append(title);
const role=document.createElement('small');role.textContent=person.role;body.append(role);
const dl=document.createElement('dl');for(const [label,value] of [['Identité civile',person.info.identite_civile||'Inconnue'],['Métatype',person.info.metatype||'Inconnu'],['Affiliation',person.info.affiliation||'Inconnue']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd)}body.append(dl);head.append(img,body);pop.append(head);
const link=document.createElement('a');link.href='repertoire.html?person='+encodeURIComponent(person.path);link.textContent='Voir la fiche détaillée';pop.append(link);pop.hidden=false;place(target);
}
function scheduleHide(){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{pop.hidden=true;active=null},220)}
pop.addEventListener('mouseenter',()=>clearTimeout(hideTimer));pop.addEventListener('mouseleave',scheduleHide);
document.addEventListener('pointerdown',e=>{if(!pop.contains(e.target)&&!e.target.closest('.person-ref')){pop.hidden=true;active=null}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){pop.hidden=true;active=null}});
function decorate(){
const root=document.getElementById('transcript');if(!root||!names.length)return;
const aliases=[];for(const person of names)for(const alias of person.aliases){if(alias&&alias.length>=3&&!aliases.some(a=>norm(a.text)===norm(alias)))aliases.push({text:alias,person})}
aliases.sort((a,b)=>b.text.length-a.text.length);
const pattern=new RegExp('(?<![\\p{L}\\p{N}])('+aliases.map(a=>a.text.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}\\p{N}])','giu');
const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement.closest('.person-ref,a,button,script,style'))continue;nodes.push(node)}
for(const node of nodes){const text=node.textContent;pattern.lastIndex=0;let m,last=0,frag=document.createDocumentFragment(),found=false;while((m=pattern.exec(text))){const person=aliases.find(a=>norm(a.text)===norm(m[0]))?.person;if(!person)continue;found=true;frag.append(document.createTextNode(text.slice(last,m.index)));const btn=document.createElement('button');btn.type='button';btn.className='person-ref';btn.textContent=m[0];btn.setAttribute('aria-label','Afficher la fiche de '+person.name);btn.addEventListener('mouseenter',()=>show(person,btn));btn.addEventListener('mouseleave',scheduleHide);btn.addEventListener('focus',()=>show(person,btn));btn.addEventListener('click',()=>{if(active===btn&&!pop.hidden){pop.hidden=true;active=null}else show(person,btn)});frag.append(btn);last=m.index+m[0].length}if(found){frag.append(document.createTextNode(text.slice(last)));node.replaceWith(frag)}}
}
const observer=new MutationObserver(()=>{observer.disconnect();decorate();observer.observe(document.getElementById('transcript'),{childList:true,subtree:true})});
load().then(()=>{decorate();observer.observe(document.getElementById('transcript'),{childList:true,subtree:true})}).catch(()=>{});
})();