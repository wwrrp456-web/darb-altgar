(function(){
'use strict';
const select=document.querySelector('.mobile-nav');
if(select)select.addEventListener('change',function(){location.hash=this.value;});
const sections=Array.from(document.querySelectorAll('.guide-section'));
if('IntersectionObserver' in window){const o=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;document.querySelectorAll('.toc a').forEach(function(a){if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});if(select)select.value=e.target.id;});},{rootMargin:'-15% 0px -65% 0px'});sections.forEach(function(s){o.observe(s);});}
document.querySelector('[data-print]')?.addEventListener('click',function(){window.prepareGuidePrint();window.print();});
window.addEventListener('beforeprint',function(){window.prepareGuidePrint();});
})();
