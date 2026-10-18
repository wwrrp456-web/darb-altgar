/* المرحلة الأولى: مجسّمات إجرائية ثابتة، WebGL مباشر بلا مكتبات أو اتصالات. */
(function(root){
'use strict';
let scene = null, totalFrames = 0, mounts = 0, disposals = 0, last = null;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const rgb = hex => /^#[0-9a-f]{6}$/i.test(hex) ? [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) : [.5,.5,.5];
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
const norm = a => {const d=Math.hypot(...a)||1;return a.map(x=>x/d);};
function multiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function matrix(camera,width,height,base){
 const pitch=camera.pitch*Math.PI/180,yaw=camera.yaw,back=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
 const right=norm(cross([0,1,0],back)),up=cross(back,right),target=[camera.x,0,camera.z],eye=target.map((v,i)=>v+back[i]*1800);
 const view=new Float32Array([right[0],up[0],back[0],0,right[1],up[1],back[1],0,right[2],up[2],back[2],0,-dot(right,eye),-dot(up,eye),-dot(back,eye),1]);
 const fit=Math.max(base[3],(Math.abs(Math.sin(yaw))*base[2]+Math.abs(Math.cos(yaw))*base[3])*Math.sin(pitch)+50,(Math.abs(Math.cos(yaw))*base[2]+Math.abs(Math.sin(yaw))*base[3])*height/width);
 const h=fit/camera.zoom,w=h*width/height,near=1,far=4000;
 const proj=new Float32Array([2/w,0,0,0,0,2/h,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]);
 return multiply(proj,view);
}
function project(m,p,w,h){const v=[...p,1],o=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[r]+=m[k*4+r]*v[k];return[(o[0]/o[3]+1)*w/2,(1-o[1]/o[3])*h/2,o[2]/o[3]];}
// هندسة مدمجة: موضع، عمودي السطح، لون، إحداثيات الخامة؛ لا مادة لكل مبنى.
function builder(){
 const data=[];
 const tri=(a,b,c,color,uv)=>{const n=norm(cross(sub(b,a),sub(c,a))),co=rgb(color);[a,b,c].forEach((v,i)=>data.push(...v,...n,...co,...(uv?uv[i]:[0,0])));};
 const quad=(a,b,c,d,color,uv)=>{tri(a,b,c,color,uv&&[uv[0],uv[1],uv[2]]);tri(a,c,d,color,uv&&[uv[0],uv[2],uv[3]]);};
 function box(x,y,z,w,h,d,color){const l=x-w/2,r=x+w/2,b=z-d/2,f=z+d/2,t=y+h;
  quad([l,y,f],[r,y,f],[r,t,f],[l,t,f],color);quad([r,y,b],[l,y,b],[l,t,b],[r,t,b],color);
  quad([l,y,b],[l,y,f],[l,t,f],[l,t,b],color);quad([r,y,f],[r,y,b],[r,t,b],[r,t,f],color);
  quad([l,t,f],[r,t,f],[r,t,b],[l,t,b],color);quad([l,y,b],[r,y,b],[r,y,f],[l,y,f],color);
 }
 function cylinder(x,y,z,r,h,color,n=10,top=r){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r],u=[x+Math.cos(a)*top,y+h,z+Math.sin(a)*top],v=[x+Math.cos(b)*top,y+h,z+Math.sin(b)*top];quad(p,u,v,q,color);tri([x,y+h,z],v,u,color);tri([x,y,z],p,q,color);}}
 function dome(x,y,z,r,color){const rings=4,n=12;for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const p=(k,l)=>{const a=k/n*2*Math.PI,t=l/rings*Math.PI/2;return[x+Math.cos(a)*Math.cos(t)*r,y+Math.sin(t)*r,z+Math.sin(a)*Math.cos(t)*r];};quad(p(i,j),p(i,j+1),p(i+1,j+1),p(i+1,j),color);}}
 function ellipsoid(x,y,z,rx,ry,rz,color,lean=0){const rings=6,n=10;for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const p=(k,l)=>{const a=k/n*2*Math.PI,t=l/rings*Math.PI-Math.PI/2,dy=Math.sin(t)*ry;return[x+Math.cos(a)*Math.cos(t)*rx+dy*lean,y+dy,z+Math.sin(a)*Math.cos(t)*rz];};quad(p(i,j),p(i,j+1),p(i+1,j+1),p(i+1,j),color);}}
 function roof(x,y,z,w,d,h,color){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2],t=[x,y+h,z];tri(a,t,b,color);tri(b,t,c,color);tri(c,t,e,color);tri(e,t,a,color);}
 function disc(x,z,r,color,y=.7,rx=r){for(let i=0;i<20;i++){const a=i/20*Math.PI*2,b=(i+1)/20*Math.PI*2;tri([x,y,z],[x+Math.cos(b)*rx,y,z+Math.sin(b)*r],[x+Math.cos(a)*rx,y,z+Math.sin(a)*r],color);}}
 return {data,tri,quad,box,cylinder,dome,ellipsoid,roof,disc};
}
const palettes={sa:['#c6a36c','#ead5a7','#a47c4d'],eg:['#d2b782','#eee0bc','#b3986e'],ir:['#cfab7a','#398b88','#d2a044'],in:['#b85f43','#eed2a0','#d19a2a'],cn:['#a74e38','#2b3f6b','#d2a044']};
function castle(b,c){
 const [wall,roof,detail]=palettes[c.country]||palettes.sa,x=c.x,z=c.y;
 b.box(x,1,z,42,3,32,detail);b.box(x,4,z,32,17,22,wall);
 b.box(x,4,z+11.3,8,11,1.3,'#554333');b.box(x,16,z+12,11,2,2,detail);
 for(const dx of[-16,16])for(const dz of[-11,11]){
  if(c.country==='sa'){b.box(x+dx,4,z+dz,9,24,9,wall);for(const k of[-3,3])b.box(x+dx+k,28,z+dz,3,3,8,detail);}
  else {b.cylinder(x+dx,4,z+dz,5,24,wall,10);b.cylinder(x+dx,26,z+dz,6,3,detail,10);
   if(c.country==='cn')b.roof(x+dx,29,z+dz,14,14,5,roof);
   else if(c.country==='in'||c.country==='ir')b.dome(x+dx,29,z+dz,5.5,roof);
   else b.cylinder(x+dx,29,z+dz,5,3,wall,10,4);
  }
 }
 if(c.country==='cn'){b.box(x,21,z,18,10,15,wall);b.roof(x,31,z,29,24,9,roof);b.box(x,39,z,2,4,2,detail);}
 else if(c.country==='ir'||c.country==='in'){b.box(x,21,z,14,7,14,wall);b.dome(x,28,z,9,roof);}
 else {for(const dx of[-11,0,11])b.box(x+dx,21,z+10,4,3,3,detail);}
}
function market(b,c){
 const [wall,roof,detail]=palettes[c.country]||palettes.sa,x=c.x,z=c.y;
 b.box(x,1,z,29,2,23,detail);b.box(x,3,z-3,22,13,13,wall);
 for(const dx of[-7,7]){b.box(x+dx,3,z+5,2,11,2,detail);b.box(x+dx,3,z+3,4,8,1,'#554333');}
 if(c.country==='cn'){b.roof(x,16,z-3,31,24,7,roof);b.roof(x,21,z-3,20,16,5,roof);}
 else if(c.country==='ir'||c.country==='in'){b.dome(x,16,z-3,8,roof);b.cylinder(x+12,3,z-5,2.4,24,wall,8);b.dome(x+12,27,z-5,3,roof);}
 else {b.box(x,16,z-3,25,2,16,detail);if(c.country==='eg')b.cylinder(x+12,3,z-6,3,27,wall,6,1);}
 b.quad([x-12,13,z+1],[x+12,13,z+1],[x+12,11,z+11],[x-12,11,z+11],roof);
}
function camel(b,x,z){
 const skin='#c99a53',light='#e2bc78',dark='#775432';
 b.ellipsoid(x,17,z,13,6,5,skin);b.dome(x-3,21,z,6,skin);b.ellipsoid(x+9,25,z,3.4,11,3.2,skin,.32);b.ellipsoid(x+15,34,z,6,3,3,light);
 b.cylinder(x+11,36,z-2,1,4,skin,5,.3);b.cylinder(x+11,36,z+2,1,4,skin,5,.3);
 for(const dx of[-8,7])for(const dz of[-3,3]){b.box(x+dx,1,z+dz,2.4,12,2.4,skin);b.box(x+dx+.5,.8,z+dz,4,2,3,dark);}
 b.box(x-4,18,z,10,3,13,'#2b3f6b');b.box(x-4,16,z-7,8,8,5,light);b.box(x-4,16,z+7,8,8,5,light);
 b.box(x-4,24,z,10,2,3,'#d19a2a');b.box(x-13,13,z,4,1,1,dark);b.box(x+14,35,z+2.9,1.1,1,1,'#2b2a26');
}
function available(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return 'تم اختيار الخريطة المسطحة احترامًا لإعداد تقليل الحركة.';
 if((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2))return 'الخريطة المسطحة أنسب لإمكانات هذا الجهاز.';
 return '';
}
const vertex=`attribute vec3 p;attribute vec3 n;attribute vec3 c;attribute vec2 uv;uniform mat4 matrix;varying vec3 color;varying vec3 normal;varying vec2 tex;void main(){gl_Position=matrix*vec4(p,1.);color=c;normal=n;tex=uv;}`;
const fragment=`precision mediump float;varying vec3 color;varying vec3 normal;varying vec2 tex;uniform sampler2D image;uniform float textured;uniform float alpha;uniform float shade;void main(){float light=.76+.24*max(dot(normalize(normal),normalize(vec3(-.5,1.,.6))),0.);vec3 base=mix(color,texture2D(image,tex).rgb,textured);gl_FragColor=vec4(base*mix(1.,light,shade),alpha);}`;
function mount(el,state){
 destroy();const reason=available();if(reason){state.onFallback(reason);return false;}
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','معاينة ثلاثية الأبعاد للمباني والقلاع والقافلة؛ قائمة المدن أسفلها متاحة للاختيار');canvas.tabIndex=0;
 el.append(canvas);
 let gl;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false});if(!gl)throw Error('WebGL unavailable');}
 catch(e){canvas.remove();state.onFallback('تعذر تشغيل العرض المجسّم؛ الخريطة المسطحة متاحة بالكامل.');return false;}
 const s=scene={el,canvas,gl,state,buffers:[],textures:[],shaders:[],events:[],labels:[],frame:0,frames:0,drawcalls:0,triangles:0,disposed:false,ready:false,dragging:false,slow:0,frameMs:0,started:performance.now()};mounts++;
 try{
  const compile=(kind,source)=>{const shader=gl.createShader(kind);s.shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  s.program=gl.createProgram();gl.attachShader(s.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(s.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(s.program);if(!gl.getProgramParameter(s.program,gl.LINK_STATUS))throw Error('shader link');
  s.attributes=['p','n','c','uv'].map(k=>gl.getAttribLocation(s.program,k));s.uniforms=Object.fromEntries(['matrix','textured','image','alpha','shade'].map(k=>[k,gl.getUniformLocation(s.program,k)]));
  s.base=state.bounds.slice();s.camera={x:s.base[0]+s.base[2]/2,z:s.base[1]+s.base[3]/2,zoom:1,pitch:52,yaw:0,...state.camera};
  const upload=(b)=>{const buffer=gl.createBuffer();s.buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(b.data),gl.STATIC_DRAW);return{buffer,count:b.data.length/11};};
  const solid=builder(),shadows=builder(),board=state.worldBounds||s.base;
  solid.box(board[0]+board[2]/2,-9,board[1]+board[3]/2,board[2],9,board[3],state.theme.board);
  s.tiles=state.tiles.filter(t=>t.url).map(t=>{const b=builder();b.quad([t.x,.2,t.y+t.height],[t.x+t.width,.2,t.y+t.height],[t.x+t.width,.2,t.y],[t.x,.2,t.y], '#f6efe0',[[0,1],[1,1],[1,0],[0,0]]);return{...upload(b),url:t.url};});
  const groups={};state.cities.forEach(c=>(groups[c.country]||(groups[c.country]=[])).push(c));s.landmarks=[];
  Object.values(groups).forEach(group=>{group.sort((a,b)=>b.size-a.size||a.id.localeCompare(b.id));const a=group[0],b=group[1];castle(solid,a);shadows.disc(a.x,a.y,23,'#2b2a26',.5,30);s.landmarks.push({...a,type:'castle'});if(b){market(solid,b);shadows.disc(b.x,b.y,17,'#2b2a26',.5,23);s.landmarks.push({...b,type:'market'});}
   const label=document.createElement('button');label.className='map3d-label';label.classList.toggle('on',a.id===state.selected);label.dataset.city=a.id;label.textContent=a.name;el.append(label);s.labels.push({el:label,city:a});
  });
  s.camel={x:state.camel.x-35,z:state.camel.y+22};camel(solid,s.camel.x,s.camel.z);shadows.disc(s.camel.x,s.camel.z,9,'#2b2a26',.5,20);
  s.solid=upload(solid);s.shadows=upload(shadows);s.triangles=(s.solid.count+s.shadows.count+s.tiles.reduce((n,t)=>n+t.count,0))/3;
  const texture=()=>{const t=gl.createTexture();s.textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([246,239,224,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};
  s.blank=texture();s.pending=s.tiles.length;
  s.tiles.forEach(t=>{t.texture=texture();const image=new Image();t.image=image;image.onload=()=>{if(s.disposed)return;gl.bindTexture(gl.TEXTURE_2D,t.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);s.pending--;s.ready=s.pending===0;request();};image.onerror=()=>fallback('تعذر عرض خامة الخريطة؛ عُرضت الخريطة المسطحة.');image.src=t.url;});
  if(!s.pending)s.ready=true;
  s.resize=new ResizeObserver(()=>request());s.resize.observe(el);
  s.themeObserver=new MutationObserver(()=>{s.state.theme={...s.state.theme,bg:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()};request();});s.themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style']});
  listen(s,matchMedia('(prefers-color-scheme: dark)'),'change',()=>{s.state.theme={...s.state.theme,bg:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()};request();});
  controls(s);
  listen(s,canvas,'webglcontextlost',ev=>{ev.preventDefault();fallback('توقف العرض المجسّم؛ انتقلنا إلى الخريطة المسطحة.');});
  listen(s,document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(s.frame);s.frame=0;s.inertia=null;}else request();});
  request();return true;
 }catch(e){fallback('تعذر تشغيل العرض المجسّم؛ الخريطة المسطحة متاحة بالكامل.');return false;}
}
function listen(s,el,type,fn,options){el.addEventListener(type,fn,options);s.events.push(()=>el.removeEventListener(type,fn,options));}
function fallback(message){if(!scene)return;const notify=scene.state.onFallback;destroy();notify(message);}
function constrain(s){const c=s.camera,b=s.base;c.zoom=clamp(c.zoom,1,4);c.pitch=clamp(c.pitch,32,72);c.yaw=((c.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;const w=b[2]/c.zoom,h=b[3]/c.zoom;c.x=clamp(c.x,b[0]+w/2,b[0]+b[2]-w/2);c.z=clamp(c.z,b[1]+h/2,b[1]+b[3]-h/2);}
function request(){const s=scene;if(!s||s.disposed||document.hidden||s.frame)return;s.queued=performance.now();s.frame=requestAnimationFrame(()=>draw(s));}
function draw(s){
 if(scene!==s||s.disposed||document.hidden)return;s.frame=0;
 const start=performance.now(),gl=s.gl,w=s.el.clientWidth,h=s.el.clientHeight;if(!w||!h)return;
 if(s.inertia){s.camera.x+=s.inertia[0];s.camera.z+=s.inertia[1];s.inertia=s.inertia.map(v=>v*.6);if(Math.hypot(...s.inertia)<.25)s.inertia=null;}
 constrain(s);const dpr=Math.min(devicePixelRatio||1,1.5);if(s.canvas.width!==Math.round(w*dpr)||s.canvas.height!==Math.round(h*dpr)){s.canvas.width=Math.round(w*dpr);s.canvas.height=Math.round(h*dpr);}
 const m=matrix(s.camera,w,h,s.base);s.matrix=m;s.width=w;s.height=h;s.dpr=dpr;
 gl.viewport(0,0,s.canvas.width,s.canvas.height);gl.clearColor(...rgb(s.state.theme.bg),1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(s.program);gl.uniformMatrix4fv(s.uniforms.matrix,false,m);gl.uniform1i(s.uniforms.image,0);gl.activeTexture(gl.TEXTURE0);
 let calls=0;
 const paint=(mesh,texture,alpha,shade)=>{gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);[3,3,3,2].reduce((offset,size,i)=>{gl.enableVertexAttribArray(s.attributes[i]);gl.vertexAttribPointer(s.attributes[i],size,gl.FLOAT,false,44,offset*4);return offset+size;},0);gl.bindTexture(gl.TEXTURE_2D,texture||s.blank);gl.uniform1f(s.uniforms.textured,texture?1:0);gl.uniform1f(s.uniforms.alpha,alpha);gl.uniform1f(s.uniforms.shade,shade);gl.drawArrays(gl.TRIANGLES,0,mesh.count);calls++;};
 // الأرض أولاً، الظلال الشفافة دون كتابة العمق، ثم المجسّمات أمامها.
 s.tiles.forEach(t=>paint(t,t.texture,1,0));
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);paint(s.shadows,null,.15,0);gl.depthMask(true);gl.disable(gl.BLEND);paint(s.solid,null,1,1);
 s.labels.forEach(({el,city})=>{const p=project(m,[city.x,42,city.y],w,h);el.style.left=p[0]+'px';el.style.top=p[1]+'px';el.hidden=p[0]<24||p[0]>w-24||p[1]<22||p[1]>h-22;});
 s.frames++;totalFrames++;s.drawcalls=calls;s.frameMs=performance.now()-start;s.state.onCamera?.({...s.camera});
 const delayed=start-s.queued>70||s.frameMs>40;s.slow=delayed&&s.dragging?s.slow+1:0;if(s.slow>=16){fallback('للحفاظ على سلاسة اللعب، انتقلنا إلى الخريطة المسطحة.');return;}
 if(s.inertia)request();
}
function controls(s){
 const pointers=new Map();let previous=null,velocity=[0,0];
 const sample=()=>{const p=[...pointers.values()];return{x:p.reduce((n,a)=>n+a.x,0)/p.length,y:p.reduce((n,a)=>n+a.y,0)/p.length,dist:p.length>1?Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y):0,angle:p.length>1?Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x):0};};
 const pan=(dx,dy)=>{const k=s.base[3]/s.camera.zoom/s.el.clientHeight,y=s.camera.yaw,sz=dy/Math.sin(s.camera.pitch*Math.PI/180);const x=(-dx*Math.cos(y)+sz*Math.sin(y))*k,z=(dx*Math.sin(y)+sz*Math.cos(y))*k;s.camera.x+=x;s.camera.z+=z;velocity=[x,z];};
 listen(s,s.canvas,'contextmenu',e=>e.preventDefault());
 listen(s,s.canvas,'pointerdown',e=>{e.preventDefault();s.inertia=null;s.dragging=true;s.canvas.focus({preventScroll:true});pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,rotate:e.button===2||e.shiftKey});s.canvas.setPointerCapture(e.pointerId);previous=sample();});
 listen(s,s.canvas,'pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=pointers.get(e.pointerId);p.x=e.clientX;p.y=e.clientY;const next=sample(),dx=next.x-previous.x,dy=next.y-previous.y;if(pointers.size>1){if(previous.dist>0)s.camera.zoom*=next.dist/previous.dist;let turn=next.angle-previous.angle;turn=Math.atan2(Math.sin(turn),Math.cos(turn));s.camera.yaw-=turn;pan(dx,dy);}else if(p.rotate||e.shiftKey){s.camera.yaw-=dx*.008;s.camera.pitch+=dy*.18;velocity=[0,0];}else pan(dx,dy);previous=next;request();});
 const release=e=>{pointers.delete(e.pointerId);if(pointers.size){previous=sample();return;}s.dragging=false;previous=null;if(e.type!=='pointercancel'&&Math.hypot(...velocity)>.4){s.inertia=velocity.map(v=>v*.3);request();}velocity=[0,0];};
 listen(s,s.canvas,'pointerup',release);listen(s,s.canvas,'pointercancel',release);listen(s,s.canvas,'lostpointercapture',()=>{if(pointers.size===0)s.dragging=false;});
 listen(s,s.canvas,'wheel',e=>{e.preventDefault();s.camera.zoom*=Math.exp(-e.deltaY*.0015);request();},{passive:false});
 listen(s,s.canvas,'keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown'].includes(k)){e.preventDefault();pan(k==='arrowleft'?40:k==='arrowright'?-40:0,k==='arrowup'?40:k==='arrowdown'?-40:0);request();}else if(['+','=','-','q','e','r'].includes(k)){e.preventDefault();if(k==='r')command('reset');else if(k==='q'||k==='e')command('rotate',k==='q'?-1:1);else command('zoom',k==='-'?-1:1);}});
}
function command(kind,value){const s=scene;if(!s)return;const c=s.camera;if(kind==='zoom')c.zoom*=value>0?1.35:1/1.35;if(kind==='rotate')c.yaw+=(value||1)*Math.PI/6;if(kind==='tilt')c.pitch=c.pitch<50?52:c.pitch<64?68:36;if(kind==='focus'){c.x=value[0];c.z=value[1];c.zoom=2;}if(kind==='reset'){Object.assign(c,{zoom:1,x:s.base[0]+s.base[2]/2,z:s.base[1]+s.base[3]/2,pitch:52,yaw:0});}s.inertia=null;request();}
function update(state){if(!scene)return;scene.state={...scene.state,...state};request();}
function destroy(){const s=scene;if(!s)return;scene=null;s.disposed=true;cancelAnimationFrame(s.frame);s.resize?.disconnect();s.themeObserver?.disconnect();s.events.forEach(off=>off());s.tiles?.forEach(t=>{if(t.image){t.image.onload=null;t.image.onerror=null;t.image.src='';}});s.labels.forEach(l=>l.el.remove());s.buffers.forEach(b=>s.gl.deleteBuffer(b));s.textures.forEach(t=>s.gl.deleteTexture(t));if(s.program)s.gl.deleteProgram(s.program);s.shaders.forEach(shader=>s.gl.deleteShader(shader));s.gl.getExtension('WEBGL_lose_context')?.loseContext();s.canvas.remove();disposals++;last={frames:s.frames,disposed:true,triangles:s.triangles,drawcalls:s.drawcalls};}
function diagnostics(){const s=scene;return{active:!!s,totalFrames,mounts,disposals,last,...(s?{frames:s.frames,ready:s.ready,drawcalls:s.drawcalls,triangles:s.triangles,dpr:s.dpr,frameMs:s.frameMs,camera:{...s.camera},landmarks:s.landmarks.map(l=>({id:l.id,country:l.country,type:l.type})),camel:{...s.camel},buffers:s.buffers.length,textures:s.textures.length}: {})};}
root.Map3D={mount,update,destroy,command,available,diagnostics};
})(typeof globalThis!=='undefined'?globalThis:this);
