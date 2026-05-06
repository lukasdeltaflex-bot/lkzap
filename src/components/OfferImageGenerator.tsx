"use client";
import React, { useRef, useState, useCallback } from 'react';
import { ImageIcon, Download, X, Loader2, Send } from 'lucide-react';

interface Props {
  lead: { name: string; availableValue: number; bank: string; phone?: string };
  onClose: () => void;
}

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const BANK_THEMES: Record<string, { primary: string; secondary: string; card1: string; card2: string; glow: string }> = {
  daycoval: { primary: '#22c55e', secondary: '#16a34a', card1: '#0e2a3d', card2: '#1a3a52', glow: 'rgba(34,197,94,0.18)' },
  bmg:      { primary: '#FF6A00', secondary: '#cc5000', card1: '#7a2e00', card2: '#a33d00', glow: 'rgba(255,106,0,0.22)' },
  default:  { primary: '#10B981', secondary: '#059669', card1: '#0d2a1e', card2: '#1a3d2e', glow: 'rgba(16,185,129,0.18)' },
};

function getTheme(banco: string) {
  const key = banco.toLowerCase();
  for (const [k, t] of Object.entries(BANK_THEMES)) {
    if (key.includes(k)) return t;
  }
  return BANK_THEMES.default;
}

export function generateOfferCanvas(p: { nome: string; valor: number; banco: string }): HTMLCanvasElement {
  const { nome, valor, banco } = p;
  const W = 1080, H = 1920;
  const T = getTheme(banco);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // BG
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#060c0f'); bg.addColorStop(1, '#030608');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Glow
  const gl = ctx.createRadialGradient(W/2, H*0.3, 100, W/2, H*0.3, 600);
  gl.addColorStop(0, T.glow); gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

  // ── HEADER ────────────────────────────────────────────────
  const hH = 380;
  const hBg = ctx.createLinearGradient(0, 0, 0, hH);
  hBg.addColorStop(0, '#0d1820'); hBg.addColorStop(1, '#060c10');
  ctx.fillStyle = hBg; ctx.fillRect(0, 0, W, hH);

  // Card
  const cX = 40, cY = 44, cW = 340, cH = 220;
  const cGrd = ctx.createLinearGradient(cX, cY, cX+cW, cY+cH);
  cGrd.addColorStop(0, T.card1); cGrd.addColorStop(1, T.card2);
  ctx.fillStyle = cGrd; rr(ctx, cX, cY, cW, cH, 22); ctx.fill();
  ctx.strokeStyle = T.primary + '60'; ctx.lineWidth = 2;
  rr(ctx, cX, cY, cW, cH, 22); ctx.stroke();

  // Chip
  const chipG = ctx.createLinearGradient(cX+32, cY+80, cX+100, cY+134);
  chipG.addColorStop(0, '#b8962e'); chipG.addColorStop(0.5, '#f0c040'); chipG.addColorStop(1, '#b8962e');
  ctx.fillStyle = chipG; rr(ctx, cX+32, cY+80, 68, 50, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(cX+32, cY+93+i*13); ctx.lineTo(cX+100, cY+93+i*13); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cX+66, cY+80); ctx.lineTo(cX+66, cY+130); ctx.stroke();

  // Bank name on card
  ctx.font = 'bold 22px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'left'; ctx.fillText(banco.toUpperCase(), cX+32, cY+52);
  ctx.font = 'bold 70px serif'; ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.textAlign = 'right'; ctx.fillText(banco.charAt(0).toUpperCase(), cX+cW-28, cY+cH-22);

  // Right: CRÉDITO LIBERADO
  const rx = cX + cW + 48;
  ctx.font = 'bold 52px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
  ctx.fillText('CRÉDITO', rx, 108);
  const libG = ctx.createLinearGradient(rx, 120, rx+380, 200);
  libG.addColorStop(0, T.primary); libG.addColorStop(1, T.secondary);
  ctx.font = 'bold 88px Arial'; ctx.fillStyle = libG; ctx.fillText('LIBERADO', rx, 205);
  // Check circle
  const chkX = rx + 468, chkY = 162;
  ctx.beginPath(); ctx.arc(chkX, chkY, 40, 0, Math.PI*2);
  ctx.fillStyle = T.primary; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(chkX-18, chkY); ctx.lineTo(chkX-5, chkY+14); ctx.lineTo(chkX+19, chkY-14); ctx.stroke();

  // "CARTÃO BANCO"
  const lY = 248;
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(rx, lY); ctx.lineTo(rx+48, lY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx+290, lY); ctx.lineTo(rx+480, lY); ctx.stroke();
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#d4a843'; ctx.fillText('CARTÃO ', rx+56, lY+9);
  const tw = ctx.measureText('CARTÃO ').width;
  ctx.fillStyle = '#ffffff'; ctx.fillText(banco.toUpperCase(), rx+56+tw, lY+9);

  // Divider
  ctx.strokeStyle = T.primary+'50'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, hH); ctx.lineTo(W, hH); ctx.stroke();

  // ── VALUE BOX ────────────────────────────────────────────
  const vY = hH+28, vH = 520, pad = 32;
  const vBg = ctx.createLinearGradient(pad, vY, pad, vY+vH);
  vBg.addColorStop(0, '#0d1e14'); vBg.addColorStop(1, '#080f0a');
  ctx.fillStyle = vBg; rr(ctx, pad, vY, W-pad*2, vH, 26); ctx.fill();
  ctx.strokeStyle = T.primary+'50'; ctx.lineWidth = 2;
  rr(ctx, pad, vY, W-pad*2, vH, 26); ctx.stroke();

  // "VOCÊ TEM"
  const vtY = vY+72;
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W/2-160, vtY); ctx.lineTo(W/2-88, vtY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2+88, vtY); ctx.lineTo(W/2+160, vtY); ctx.stroke();
  ctx.font = 'bold 28px Arial'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center';
  ctx.fillText('VOCÊ TEM', W/2, vtY+10);

  // Big value
  const valStr = fmtBRL(valor);
  let fs = 168;
  ctx.font = `900 ${fs}px Arial`;
  while (ctx.measureText(valStr).width > W-pad*4 && fs > 80) { fs -= 6; ctx.font = `900 ${fs}px Arial`; }
  const goldG = ctx.createLinearGradient(0, vtY+20, 0, vtY+20+fs);
  goldG.addColorStop(0, '#fef08a'); goldG.addColorStop(0.3, '#f0c040');
  goldG.addColorStop(0.6, T.primary === '#FF6A00' ? '#FF6A00' : '#c9a227'); goldG.addColorStop(1, '#92740f');
  ctx.fillStyle = goldG; ctx.fillText(valStr, W/2, vtY+20+fs);

  // Glow under value
  const vgl = ctx.createRadialGradient(W/2, vtY+20+fs, 40, W/2, vtY+20+fs, 200);
  vgl.addColorStop(0, T.glow); vgl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vgl; ctx.fillRect(0, vtY+20+fs-100, W, 200);

  // Badge
  const bY = vtY+20+fs+28, bW = 520, bH = 58, bX = (W-bW)/2;
  ctx.fillStyle = T.secondary; rr(ctx, bX, bY, bW, bH, 10); ctx.fill();
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('DISPONÍVEIS PARA SAQUE', W/2, bY+38);

  // Subtext
  const stY = bY+bH+44;
  ctx.font = 'bold 28px Arial'; ctx.fillStyle = '#e5e7eb';
  ctx.fillText('SAQUE COMPLEMENTAR DO SEU CARTÃO', W/2, stY);
  ctx.font = 'bold 30px Arial'; ctx.fillStyle = T.primary;
  ctx.fillText(banco.toUpperCase(), W/2, stY+40);

  // ── FEATURES ─────────────────────────────────────────────
  const fY = vY+vH+28, fH = 400;
  const features = [
    { icon: '🚀', title: 'LIBERAÇÃO\nRÁPIDA', badge: 'EM ATÉ 48H ⏱' },
    { icon: '📊', title: 'SEM AUMENTO\nDE DESCONTO\nNO SEU INSS!', badge: '✕  NÃO AUMENTA' },
    { icon: '💰', title: 'VALOR DEPOSITADO\nDIRETAMENTE\nNA SUA CONTA', badge: '🏦  + SEGURANÇA' },
  ];
  const colW = (W-pad*2-24)/3;
  features.forEach((f, i) => {
    const fx = pad+i*(colW+12);
    const fbg = ctx.createLinearGradient(fx, fY, fx, fY+fH);
    fbg.addColorStop(0, '#0d1e14'); fbg.addColorStop(1, '#080f08');
    ctx.fillStyle = fbg; rr(ctx, fx, fY, colW, fH, 18); ctx.fill();
    ctx.strokeStyle = T.primary+'30'; ctx.lineWidth = 1.5;
    rr(ctx, fx, fY, colW, fH, 18); ctx.stroke();

    const icX = fx+colW/2, icY = fY+70;
    ctx.beginPath(); ctx.arc(icX, icY, 54, 0, Math.PI*2);
    ctx.fillStyle = T.secondary+'33'; ctx.fill();
    ctx.strokeStyle = T.primary; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '46px serif'; ctx.textAlign = 'center'; ctx.fillText(f.icon, icX, icY+16);

    const lines = f.title.split('\n');
    ctx.font = 'bold 22px Arial'; ctx.fillStyle = T.primary;
    const tlY = icY+90;
    lines.forEach((ln, li) => ctx.fillText(ln, icX, tlY+li*30));

    const bBY = fY+fH-60, bBW = colW-24, bBX = fx+12;
    ctx.fillStyle = '#052e14'; rr(ctx, bBX, bBY, bBW, 40, 8); ctx.fill();
    ctx.strokeStyle = T.secondary+'60'; ctx.lineWidth = 1;
    rr(ctx, bBX, bBY, bBW, 40, 8); ctx.stroke();
    ctx.font = 'bold 17px Arial'; ctx.fillStyle = T.primary;
    ctx.fillText(f.badge, bBX+bBW/2, bBY+26);
  });

  // ── CTA ───────────────────────────────────────────────────
  const cY2 = fY+fH+28, cH2 = 240;
  const ctaBg = ctx.createLinearGradient(pad, cY2, pad, cY2+cH2);
  ctaBg.addColorStop(0, T.card1); ctaBg.addColorStop(1, '#040808');
  ctx.fillStyle = ctaBg; rr(ctx, pad, cY2, W-pad*2, cH2, 22); ctx.fill();
  ctx.strokeStyle = T.primary+'60'; ctx.lineWidth = 2;
  rr(ctx, pad, cY2, W-pad*2, cH2, 22); ctx.stroke();

  const oneX = pad+96, oneY = cY2+cH2/2;
  const og = ctx.createRadialGradient(oneX, oneY, 14, oneX, oneY, 64);
  og.addColorStop(0, T.primary); og.addColorStop(0.7, T.secondary); og.addColorStop(1, '#052e14');
  ctx.fillStyle = og; ctx.beginPath(); ctx.arc(oneX, oneY, 64, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = 'bold 72px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('1', oneX, oneY+24);

  const ctaX = oneX+90;
  ctx.textAlign = 'left'; ctx.font = 'bold 44px Arial'; ctx.fillStyle = '#fff';
  ctx.fillText('DIGITE ', ctaX, cY2+96);
  const dw = ctx.measureText('DIGITE ').width;
  ctx.fillStyle = T.primary; ctx.fillText('1', ctaX+dw, cY2+96);
  const ow = ctx.measureText('1').width;
  ctx.fillStyle = '#fff'; ctx.fillText(' AGORA', ctaX+dw+ow, cY2+96);
  ctx.font = '26px Arial'; ctx.fillStyle = '#d1fae5'; ctx.fillText('E RECEBA O LINK DE CONFIRMAÇÃO', ctaX, cY2+142);
  ctx.font = 'bold 30px Arial'; ctx.fillStyle = T.primary; ctx.fillText('E LIBERAÇÃO!', ctaX, cY2+184);

  const waX = W-pad-72, waY = cY2+cH2/2;
  ctx.beginPath(); ctx.arc(waX, waY, 58, 0, Math.PI*2);
  ctx.fillStyle = '#25d366'; ctx.fill();
  ctx.font = '52px serif'; ctx.textAlign = 'center'; ctx.fillText('💬', waX, waY+18);

  // ── FOOTER ────────────────────────────────────────────────
  const ftY = cY2+cH2+22, ftH = 84;
  ctx.fillStyle = '#0a1510'; rr(ctx, pad, ftY, W-pad*2, ftH, 14); ctx.fill();
  ctx.strokeStyle = T.primary+'25'; ctx.lineWidth = 1;
  rr(ctx, pad, ftY, W-pad*2, ftH, 14); ctx.stroke();
  const badges = ['🛡️  100% SEGURO', '🔒  SEUS DADOS PROTEGIDOS', '✅  EMPRESA AUTORIZADA'];
  const sw = (W-pad*2)/3;
  badges.forEach((b, i) => {
    if (i > 0) {
      ctx.strokeStyle = T.primary+'30'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad+i*sw, ftY+16); ctx.lineTo(pad+i*sw, ftY+ftH-16); ctx.stroke();
    }
    ctx.font = '20px Arial'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center';
    ctx.fillText(b, pad+i*sw+sw/2, ftY+ftH/2+7);
  });

  // Disclaimer
  ctx.font = '17px Arial'; ctx.fillStyle = 'rgba(156,163,175,0.55)'; ctx.textAlign = 'center';
  ctx.fillText('*Sujeito à análise e aprovação de crédito.', W/2, ftY+ftH+40);

  return canvas;
}

export const OfferImageGenerator: React.FC<Props> = ({ lead, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nome, setNome] = useState(lead.name);
  const [valor, setValor] = useState(lead.availableValue);
  const [banco, setBanco] = useState(lead.bank || 'Daycoval');
  const [phone] = useState(lead.phone || '');

  const generate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const c = generateOfferCanvas({ nome, valor, banco });
        setImageUrl(c.toDataURL('image/png'));
      } catch (e) { console.error(e); }
      finally { setIsGenerating(false); }
    }, 50);
  }, [nome, valor, banco]);

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl; a.download = `oferta_${banco}_${nome.replace(/\s+/g,'_')}.png`; a.click();
  };

  const copyImg = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Imagem copiada! Agora cole no WhatsApp.');
    } catch { download(); }
  };

  const sendWhatsApp = async () => {
    if (!imageUrl) { alert('Gere a imagem primeiro!'); return; }
    download();
    const txt = encodeURIComponent('Olá! Segue sua simulação de saque disponível 👇');
    const num = phone.replace(/\D/g, '');
    const waUrl = num ? `https://wa.me/55${num}?text=${txt}` : `https://wa.me/?text=${txt}`;
    setTimeout(() => window.open(waUrl, '_blank'), 800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ImageIcon size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg">Gerar Imagem de Oferta</h2>
              <p className="text-slate-400 text-xs">Imagem 1080×1920 otimizada para WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-auto flex-1 min-h-0">
          {/* Controls - 30% */}
          <div className="md:w-72 p-5 border-r border-slate-800 flex flex-col gap-4 shrink-0 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados da Oferta</h3>
            {[
              { label: 'Nome', val: nome, set: setNome, type: 'text' },
              { label: 'Banco', val: banco, set: setBanco, type: 'text' },
            ].map(({ label, val, set, type }) => (
              <div key={label}>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{label}</label>
                <input type={type} value={val as string} onChange={e => (set as any)(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Valor — {fmtBRL(valor)}</label>
              <input type="number" value={valor} step="0.01" min="0"
                onChange={e => setValor(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {/* Bank theme preview */}
            <div className="rounded-lg p-3 border border-slate-700 bg-slate-800/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Tema do banco detectado</p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: getTheme(banco).primary }} />
                <span className="text-xs text-slate-300 capitalize">{banco}</span>
              </div>
            </div>

            <button onClick={generate} disabled={isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
              {isGenerating ? <><Loader2 size={16} className="animate-spin" />Gerando...</> : <><ImageIcon size={16} />Gerar Imagem</>}
            </button>

            {imageUrl && (
              <div className="flex flex-col gap-2">
                <button onClick={download} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
                  <Download size={15} />Baixar PNG
                </button>
                <button onClick={copyImg} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
                  📋 Copiar Imagem
                </button>
                <button onClick={sendWhatsApp} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
                  <Send size={15} />Enviar WhatsApp
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-relaxed mt-auto pt-4 border-t border-slate-800">
              💡 O tema muda automaticamente conforme o banco. Clique em <strong className="text-slate-400">Gerar Imagem</strong> para visualizar.
            </p>
          </div>

          {/* Preview - 70% */}
          <div className="flex-1 p-6 flex flex-col items-center bg-slate-950/50 overflow-auto">
            {!imageUrl && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                <ImageIcon size={56} className="text-slate-800" />
                <p className="text-sm">Clique em <strong className="text-slate-400">Gerar Imagem</strong> para visualizar</p>
              </div>
            )}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={44} className="animate-spin text-emerald-500" />
                <p className="text-sm text-slate-400">Gerando imagem 1080×1920...</p>
              </div>
            )}
            {imageUrl && !isGenerating && (
              <>
                <p className="text-xs text-slate-500 self-start mb-3">Pré-visualização • 1080×1920px</p>
                <img src={imageUrl} alt="Oferta"
                  className="max-w-full rounded-xl shadow-2xl border border-slate-800"
                  style={{ maxHeight: '75vh', objectFit: 'contain' }} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function getTheme(b: string) {
    const k = b.toLowerCase();
    for (const [key, t] of Object.entries(BANK_THEMES)) { if (k.includes(key)) return t; }
    return BANK_THEMES.default;
  }
};
