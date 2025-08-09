// Lightweight charts without external deps using Canvas API
import { CandidateRepository } from '../../data/repositories/candidate-repository.js';

function drawLineChart(canvas, points) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = 180;
  ctx.clearRect(0,0,w,h);
  const pad = 24;
  const maxY = Math.max(1, ...points.map(p=>p.y));
  const stepX = (w - pad*2) / Math.max(1, points.length-1);
  // axis
  ctx.strokeStyle = '#e5e5e5'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h-pad); ctx.lineTo(w-pad, h-pad); ctx.stroke();
  // line
  ctx.strokeStyle = '#1488C4'; ctx.lineWidth = 2; ctx.beginPath();
  points.forEach((p,i)=>{
    const x = pad + stepX * i;
    const y = h - pad - (p.y / maxY) * (h-pad*2);
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();
  // dots
  ctx.fillStyle = '#1488C4';
  points.forEach((p,i)=>{
    const x = pad + stepX * i;
    const y = h - pad - (p.y / maxY) * (h-pad*2);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });
}

function drawPieChart(canvas, slices) {
  const ctx = canvas.getContext('2d');
  const size = Math.min(canvas.clientWidth, 180);
  canvas.width = size; canvas.height = size;
  const total = slices.reduce((a,s)=>a+s.value, 0) || 1;
  let start = -Math.PI/2;
  const colors = ['#1488C4','#d97706','#7c3aed','#059669','#dc2626'];
  slices.forEach((s,i)=>{
    const angle = (s.value/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(size/2,size/2); ctx.fillStyle = colors[i%colors.length];
    ctx.arc(size/2,size/2,size/2-10,start,start+angle); ctx.closePath(); ctx.fill();
    start += angle;
  });
}

(async function initCharts(){
  const repo = new CandidateRepository();
  const data = await repo.findAll();
  // monthly counts (last 6 months)
  const months = [...Array(6)].map((_,i)=>{
    const d = new Date(); d.setMonth(d.getMonth() - (5-i));
    const key = d.toISOString().slice(0,7);
    const count = data.filter(c => (c.appliedDate||'').startsWith(key)).length;
    return { x: key, y: count };
  });
  const statuses = ['신규','서류통과','면접대기','최종합격','불합격'];
  const slices = statuses.map(s => ({ label: s, value: data.filter(c=>c.status===s).length }));
  const line = document.getElementById('chart_line');
  const pie = document.getElementById('chart_pie');
  if (line) drawLineChart(line, months);
  if (pie) drawPieChart(pie, slices);
})();


