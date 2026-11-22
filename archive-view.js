/* Affichage des archives et édition réservée au propriétaire, après déchiffrement si nécessaire. */
(async()=>{
'use strict';
const journal=window.RunnerJournal;
const state=await journal.init();
const entry=state.entries.find(x=>x.id===new URLSearchParams(location.search).get('id'));
const transcript=document.getElementById('transcript');
if(!entry){document.getElementById('title').textContent='ARCHIVE INTROUVABLE';return}
const isHesperis=location.pathname.toLowerCase().includes('hesperis');
const image=document.querySelector('.video-still img');
if(!isHesperis){
 const stills={VESPER_001:'images/Vesper_video5.jpeg',VESPER_002:'images/Vesper_video2.jpeg',VESPER_003:'images/Vesper_video3.jpeg',VESPER_004:'images/Vesper_video4.jpeg'};
 image.src=stills[entry.id]||'images/Vesper_video1.jpeg';
}
document.getElementById('title').textContent=entry.title;
document.getElementById('meta').textContent=entry.date+' // '+(entry.location||'');
document.getElementById('file-id').textContent=entry.id;
let access=null;
const editor=document.createElement('button');
editor.type='button';editor.className='opinion-button';
editor.textContent='✎ MODIFIER CET ENREGISTREMENT';
editor.style.cssText='margin:16px 0;padding:10px 16px';
editor.onclick=()=>journal.edit(entry,()=>location.reload(),access);
const mountEditor=()=>{
 if(state.editable&&!editor.isConnected)document.querySelector('.record-head').append(editor);
};
function render(lines){
 transcript.replaceChildren();
 for(const line of lines||[]){
  const p=document.createElement('p');
  if(line.type==='stage'){
   p.className='stage';
   p.textContent='['+line.text+']';
  }else{
   p.className='speech';
   p.textContent=line.text||'\u00a0';
  }
  transcript.append(p);
 }
}
if(!entry.private){render(entry.lines);mountEditor();return}
document.querySelector('.video-still').hidden=true;
const glyph='A7F0 9C2E 5D1B 83AA F6C9 0D3E 74B1 C2FF 68A0 1E9D 4B73';
const encrypted=document.createElement('p');encrypted.className='cipher';
encrypted.textContent=Array(14).fill(glyph).join('  //  ');
transcript.append(encrypted);
const form=document.createElement('form');form.className='decrypt';
const label=document.createElement('label');label.textContent='CLÉ DE DÉCHIFFREMENT // ACCESS KEY';label.htmlFor='decrypt-key';
const input=document.createElement('input');input.id='decrypt-key';input.type='password';input.placeholder='Mot de passe';input.autocomplete='off';input.required=true;
const button=document.createElement('button');button.type='submit';button.textContent='DÉCHIFFRER';
const status=document.createElement('div');status.className='decrypt-status';status.setAttribute('role','status');
form.append(label,input,button,status);transcript.before(form);
form.addEventListener('submit',async ev=>{
 ev.preventDefault();button.disabled=true;status.textContent='DECRYPTION IN PROGRESS...';
 try{
  const password=input.value;
  const binary64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:binary64(entry.salt),iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:binary64(entry.iv)},key,binary64(entry.ciphertext));
  const lines=JSON.parse(new TextDecoder().decode(plain));
  render(lines);
  document.querySelector('.video-still').hidden=false;
  access=state.editable?{lines,password}:null;
  input.value='';form.remove();mountEditor();
 }catch(error){status.textContent='DECRYPTION FAILED // CLÉ INCORRECTE';input.value='';button.disabled=false}
});
})();