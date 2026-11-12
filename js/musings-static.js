// Progressive enhancement for already-rendered articles. No network content loading.
document.addEventListener('DOMContentLoaded', () => {
  const content=document.querySelector('[data-prerendered="true"]');
  if(!content)return;
  const cover=content.querySelector('.post-monument-video-cover');
  cover?.addEventListener('click',()=>{
    const iframe=document.createElement('iframe');
    const url=new URL(cover.dataset.youtubeSrc);
    url.searchParams.delete('t');url.searchParams.set('start','0');url.searchParams.set('autoplay','1');
    iframe.src=url.href;iframe.className='post-monument-youtube';iframe.title='Play the featured conversation';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;cover.replaceWith(iframe);iframe.focus();
  });
  const headings=content.querySelectorAll('#post-body h2');
  if(headings.length<2)return;
  const list=document.createElement('ul');
  headings.forEach((heading,i)=>{
    heading.id=heading.id||'section-'+(i+1);
    const item=document.createElement('li'),link=document.createElement('a');
    link.href='#'+heading.id;link.textContent=heading.textContent;item.appendChild(link);list.appendChild(item);
  });
  const toc=content.querySelector('#post-toc');
  if(toc){const nav=document.createElement('nav');nav.className='post-toc';nav.setAttribute('aria-label','Table of contents');nav.appendChild(list);toc.appendChild(nav);}
});
