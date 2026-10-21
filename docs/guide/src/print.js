(function(){
'use strict';
window.prepareGuidePrint=function(){
let host=document.querySelector('.print-document');if(host)host.remove();
host=document.createElement('div');host.className='print-document';document.body.append(host);
const title=document.querySelector('h1').textContent,meta=document.querySelector('.version-note').textContent,pages=[],starts={};
function page(){const sheet=document.createElement('div');sheet.className='sheet';sheet.innerHTML='<div class="sheet-head"></div><div class="sheet-content"></div><div class="sheet-foot"></div>';sheet.querySelector('.sheet-head').textContent=title;host.append(sheet);pages.push(sheet);return sheet.querySelector('.sheet-content');}
const cover=page();cover.append(document.querySelector('.cover').cloneNode(true));
const sections=Array.from(document.querySelectorAll('main > .guide-section'));const tocPages=[];
for(let i=0;i<Math.max(1,Math.ceil(sections.length/16));i++)tocPages.push(page());
function fits(content){return content.scrollHeight<=content.clientHeight+1;}
sections.forEach(function(section){
let content=page();starts[section.id]=pages.length;
const children=Array.from(section.children).filter(function(x){return x.tagName!=='BUTTON';}).flatMap(function(x){return x.classList.contains('gallery')?Array.from(x.children):[x];});
children.forEach(function(node){
const copy=node.cloneNode(true);if(node.tagName==='H2')copy.id='print-'+section.id;
content.append(copy);if(fits(content))return;
copy.remove();
if(node.classList.contains('table-wrap')){
const table=node.querySelector('table'),head=table.querySelector('thead'),rows=Array.from(table.querySelectorAll('tbody > tr'));let wrapper,tbody;
function tableOnPage(){wrapper=document.createElement('div');wrapper.className='table-wrap';const t=document.createElement('table');if(head)t.append(head.cloneNode(true));tbody=document.createElement('tbody');t.append(tbody);wrapper.append(t);content.append(wrapper);}
if(content.children.length>1)content=page();tableOnPage();
rows.forEach(function(row){const r=row.cloneNode(true);tbody.append(r);if(!fits(content)&&tbody.children.length>1){r.remove();content=page();tableOnPage();tbody.append(r);}});
return;
}
if((node.tagName==='UL'||node.tagName==='OL')&&node.children.length>4){
let list=document.createElement(node.tagName);content.append(list);let count=0;
Array.from(node.children).forEach(function(item){const c=item.cloneNode(true);list.append(c);if(!fits(content)){c.remove();content=page();list=document.createElement(node.tagName);if(node.tagName==='OL')list.start=count+1;content.append(list);list.append(c);}count++;});return;
}
if(content.lastElementChild&&/H[23]/.test(content.lastElementChild.tagName)){const h=content.lastElementChild;h.remove();content=page();content.append(h);}else content=page();
content.append(copy);
});
});
tocPages.forEach(function(content,i){const h=document.createElement('h2');h.textContent=i?'الفهرس — تابع':'الفهرس والصفحات';content.append(h);const ul=document.createElement('ul');ul.className='toc-lines';sections.slice(i*16,(i+1)*16).forEach(function(s){const li=document.createElement('li');li.className='toc-line';const a=document.createElement('a');a.href='#print-'+s.id;a.textContent=s.querySelector('h2').textContent;const n=document.createElement('span');n.textContent=String(starts[s.id]);li.append(a,n);ul.append(li);});content.append(ul);});
pages.forEach(function(p,i){const foot=p.querySelector('.sheet-foot');const a=document.createElement('span');a.innerHTML=document.querySelector('.version-note').innerHTML;const b=document.createElement('span');b.dir='ltr';b.textContent=String(i+1)+' / '+pages.length;foot.append(a,b);});
window.guidePrintReport={pages:pages.length,starts:starts,overflow:pages.map(function(p,i){const c=p.querySelector('.sheet-content');return c.scrollHeight>c.clientHeight+2||c.scrollWidth>c.clientWidth+2?i+1:null;}).filter(Boolean)};
return window.guidePrintReport;
};
})();
