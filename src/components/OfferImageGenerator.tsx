"use client";

import React, { useRef, useState, useCallback } from 'react';
import { ImageIcon, Download, X, Loader2 } from 'lucide-react';

interface OfferImageGeneratorProps {
  lead: {
    name: string;
    availableValue: number;
    bank: string;
  };
  onClose: () => void;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

// Draw a rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, color: string
) {
  const grd = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
  grd.addColorStop(0, color);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

export function generateOfferCanvas(params: {
  nome: string;
  valor: number;
  banco: string;
}): HTMLCanvasElement {
  const { nome, valor, banco } = params;
  const W = 680;
  const H = 1020;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── BACKGROUND ──────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#070d10');
  bg.addColorStop(1, '#040a0d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle dark green ambient glow bottom-left
  drawGlowCircle(ctx, 0, H, 400, 'rgba(5,80,40,0.18)');

  // ── SECTION 1: HEADER ────────────────────────────────────────────────────
  const headerH = 210;

  // Dark header bg
  const hBg = ctx.createLinearGradient(0, 0, 0, headerH);
  hBg.addColorStop(0, '#0d1820');
  hBg.addColorStop(1, '#070d14');
  ctx.fillStyle = hBg;
  ctx.fillRect(0, 0, W, headerH);

  // Card graphic (left side)
  const cardX = 28, cardY = 30, cardW = 210, cardH = 140;
  const cardGrd = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrd.addColorStop(0, '#0e2a3d');
  cardGrd.addColorStop(0.5, '#1a3a52');
  cardGrd.addColorStop(1, '#0d2030');
  ctx.fillStyle = cardGrd;
  roundRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.fill();

  // Card border glow
  ctx.strokeStyle = 'rgba(30,120,180,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.stroke();

  // Chip on card
  const chipGrd = ctx.createLinearGradient(cardX + 20, cardY + 50, cardX + 60, cardY + 90);
  chipGrd.addColorStop(0, '#b8962e');
  chipGrd.addColorStop(0.5, '#f0c040');
  chipGrd.addColorStop(1, '#b8962e');
  ctx.fillStyle = chipGrd;
  roundRect(ctx, cardX + 20, cardY + 50, 42, 32, 4);
  ctx.fill();
  // Chip lines
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cardX + 20, cardY + 58 + i * 8);
    ctx.lineTo(cardX + 62, cardY + 58 + i * 8);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cardX + 41, cardY + 50);
  ctx.lineTo(cardX + 41, cardY + 82);
  ctx.stroke();

  // Bank initial letter on card
  ctx.font = 'bold 44px serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'right';
  ctx.fillText(banco.charAt(0).toUpperCase(), cardX + cardW - 20, cardY + cardH - 20);

  // Bank name on card (top-left)
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText(banco.toUpperCase(), cardX + 20, cardY + 36);

  // ── RIGHT SIDE HEADER TEXT ─────────────────────────────────────────────
  const rx = cardX + cardW + 30;

  // "CRÉDITO" text
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('CRÉDITO', rx, 72);

  // "LIBERADO" in gold-green gradient
  const libGrd = ctx.createLinearGradient(rx, 80, rx + 200, 120);
  libGrd.addColorStop(0, '#22c55e');
  libGrd.addColorStop(1, '#16a34a');
  ctx.font = 'bold 50px Arial';
  ctx.fillStyle = libGrd;
  ctx.fillText('LIBERADO', rx, 124);

  // Checkmark circle
  const chkX = rx + 228, chkY = 95, chkR = 22;
  ctx.beginPath();
  ctx.arc(chkX, chkY, chkR, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(chkX - 11, chkY);
  ctx.lineTo(chkX - 3, chkY + 9);
  ctx.lineTo(chkX + 12, chkY - 9);
  ctx.stroke();

  // Divider lines + "CARTÃO {BANCO}"
  const lineY = 144;
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(rx, lineY); ctx.lineTo(rx + 30, lineY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx + 175, lineY); ctx.lineTo(rx + 290, lineY); ctx.stroke();

  ctx.font = '700 16px Arial';
  ctx.fillStyle = '#d4a843';
  ctx.textAlign = 'left';
  ctx.fillText('CARTÃO ', rx + 34, lineY + 6);
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(banco.toUpperCase(), rx + 110, lineY + 6);

  // ── SEPARATOR ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(30,100,60,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(W, headerH);
  ctx.stroke();

  // ── SECTION 2: VALUE BOX ─────────────────────────────────────────────────
  const valY = headerH + 16;
  const valH = 250;
  const pad = 20;

  const valBoxGrd = ctx.createLinearGradient(pad, valY, pad, valY + valH);
  valBoxGrd.addColorStop(0, '#0d1e14');
  valBoxGrd.addColorStop(1, '#091610');
  ctx.fillStyle = valBoxGrd;
  roundRect(ctx, pad, valY, W - pad * 2, valH, 16);
  ctx.fill();

  ctx.strokeStyle = 'rgba(34,197,94,0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad, valY, W - pad * 2, valH, 16);
  ctx.stroke();

  // "VOCÊ TEM" with decorative dashes
  const vtY = valY + 44;
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';

  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 100, vtY); ctx.lineTo(W / 2 - 60, vtY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 60, vtY); ctx.lineTo(W / 2 + 100, vtY); ctx.stroke();
  ctx.fillText('VOCÊ TEM', W / 2, vtY + 5);

  // Large gold value
  const valorStr = formatBRL(valor);
  // Measure to fit
  let fontSize = 88;
  ctx.font = `900 ${fontSize}px Arial`;
  while (ctx.measureText(valorStr).width > W - pad * 4 && fontSize > 48) {
    fontSize -= 4;
    ctx.font = `900 ${fontSize}px Arial`;
  }

  const goldGrd = ctx.createLinearGradient(0, vtY + 10, 0, vtY + 10 + fontSize);
  goldGrd.addColorStop(0, '#fef08a');
  goldGrd.addColorStop(0.3, '#f0c040');
  goldGrd.addColorStop(0.6, '#c9a227');
  goldGrd.addColorStop(1, '#92740f');
  ctx.fillStyle = goldGrd;
  ctx.textAlign = 'center';
  ctx.fillText(valorStr, W / 2, vtY + 14 + fontSize);

  // Gold glow under value
  drawGlowCircle(ctx, W / 2, vtY + 14 + fontSize - 10, 80, 'rgba(200,160,40,0.12)');

  // "DISPONÍVEIS PARA SAQUE" badge
  const badgeY = vtY + 14 + fontSize + 18;
  const badgeW = 320, badgeH = 36, badgeX = (W - badgeW) / 2;
  ctx.fillStyle = '#16a34a';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();
  ctx.font = 'bold 15px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('DISPONÍVEIS PARA SAQUE', W / 2, badgeY + 24);

  // "SAQUE COMPLEMENTAR..." line
  const subtextY = badgeY + badgeH + 30;
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#e5e7eb';
  ctx.textAlign = 'center';
  ctx.fillText('SAQUE COMPLEMENTAR DO SEU CARTÃO', W / 2, subtextY);
  ctx.font = 'bold 17px Arial';
  ctx.fillStyle = '#22c55e';
  ctx.fillText(banco.toUpperCase(), W / 2, subtextY + 24);

  // ── SECTION 3: FEATURES ───────────────────────────────────────────────────
  const featY = valY + valH + 20;
  const featH = 190;
  const colW = (W - pad * 2 - 16) / 3;

  const features = [
    { icon: '🚀', title: 'LIBERAÇÃO\nRÁPIDA', badge: 'EM ATÉ 48H ⏱' },
    { icon: '📊', title: 'SEM AUMENTO\nDE DESCONTO\nNO SEU INSS!', badge: '✕  NÃO AUMENTA' },
    { icon: '💰', title: 'VALOR DEPOSITADO\nDIRETAMENTE\nNA SUA CONTA', badge: '🏦  + SEGURANÇA' },
  ];

  features.forEach((f, i) => {
    const fx = pad + i * (colW + 8);
    const fBg = ctx.createLinearGradient(fx, featY, fx, featY + featH);
    fBg.addColorStop(0, '#0d1e14');
    fBg.addColorStop(1, '#091408');
    ctx.fillStyle = fBg;
    roundRect(ctx, fx, featY, colW, featH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34,197,94,0.25)';
    ctx.lineWidth = 1;
    roundRect(ctx, fx, featY, colW, featH, 12);
    ctx.stroke();

    // Icon circle
    const icX = fx + colW / 2, icY = featY + 36;
    ctx.beginPath();
    ctx.arc(icX, icY, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#14532d';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.icon, icX, icY + 8);

    // Feature title (multi-line)
    const lines = f.title.split('\n');
    ctx.font = 'bold 11.5px Arial';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    const titleStartY = icY + 44;
    lines.forEach((line, li) => {
      ctx.fillText(line, icX, titleStartY + li * 16);
    });

    // Badge
    const bw = colW - 16, bh = 24, bx = fx + 8, by = featY + featH - 34;
    ctx.fillStyle = '#052e14';
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.stroke();

    ctx.font = 'bold 9.5px Arial';
    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'center';
    ctx.fillText(f.badge, bx + bw / 2, by + 16);
  });

  // ── SECTION 4: CTA BOX ───────────────────────────────────────────────────
  const ctaY = featY + featH + 16;
  const ctaH = 120;

  const ctaBg = ctx.createLinearGradient(pad, ctaY, pad, ctaY + ctaH);
  ctaBg.addColorStop(0, '#0f2218');
  ctaBg.addColorStop(1, '#081510');
  ctx.fillStyle = ctaBg;
  roundRect(ctx, pad, ctaY, W - pad * 2, ctaH, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,197,94,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad, ctaY, W - pad * 2, ctaH, 14);
  ctx.stroke();

  // "1" circle
  const oneX = pad + 56, oneY = ctaY + ctaH / 2;
  const oneGrd = ctx.createRadialGradient(oneX, oneY, 8, oneX, oneY, 38);
  oneGrd.addColorStop(0, '#22c55e');
  oneGrd.addColorStop(0.6, '#16a34a');
  oneGrd.addColorStop(1, '#14532d');
  ctx.fillStyle = oneGrd;
  ctx.beginPath();
  ctx.arc(oneX, oneY, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 42px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('1', oneX, oneY + 15);

  // CTA text
  const ctaTX = oneX + 56;
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('DIGITE ', ctaTX, ctaY + 44);

  const digW = ctx.measureText('DIGITE ').width;
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#22c55e';
  ctx.fillText('1', ctaTX + digW, ctaY + 44);

  const oneW = ctx.measureText('1').width;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(' AGORA', ctaTX + digW + oneW, ctaY + 44);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#d1fae5';
  ctx.fillText('E RECEBA O LINK DE CONFIRMAÇÃO', ctaTX, ctaY + 68);
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#22c55e';
  ctx.fillText('E LIBERAÇÃO!', ctaTX, ctaY + 90);

  // WhatsApp icon (circle with WA logo)
  const waX = W - pad - 44, waY = ctaY + ctaH / 2;
  ctx.beginPath();
  ctx.arc(waX, waY, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#25d366';
  ctx.fill();
  ctx.font = '32px serif';
  ctx.textAlign = 'center';
  ctx.fillText('💬', waX, waY + 11);

  // ── SECTION 5: FOOTER ─────────────────────────────────────────────────────
  const footY = ctaY + ctaH + 16;
  const footH = 52;

  ctx.fillStyle = '#0a1510';
  roundRect(ctx, pad, footY, W - pad * 2, footH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,197,94,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, pad, footY, W - pad * 2, footH, 10);
  ctx.stroke();

  const badges = ['🛡️  100% SEGURO', '🔒  SEUS DADOS PROTEGIDOS', '✅  EMPRESA AUTORIZADA'];
  const segW = (W - pad * 2) / 3;
  badges.forEach((b, i) => {
    // Vertical separator
    if (i > 0) {
      ctx.strokeStyle = 'rgba(34,197,94,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + i * segW, footY + 10);
      ctx.lineTo(pad + i * segW, footY + footH - 10);
      ctx.stroke();
    }
    ctx.font = '11px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText(b, pad + i * segW + segW / 2, footY + footH / 2 + 4);
  });

  // Disclaimer
  const discY = footY + footH + 12;
  ctx.font = '10px Arial';
  ctx.fillStyle = 'rgba(156,163,175,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText('*Sujeito à análise e aprovação de crédito.', W / 2, discY);

  return canvas;
}

export const OfferImageGenerator: React.FC<OfferImageGeneratorProps> = ({ lead, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nome, setNome] = useState(lead.name);
  const [valor, setValor] = useState(lead.availableValue);
  const [banco, setBanco] = useState(lead.bank || 'Daycoval');

  const generate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const canvas = generateOfferCanvas({ nome, valor, banco });
        setImageUrl(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error('Erro ao gerar imagem:', e);
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  }, [nome, valor, banco]);

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `oferta_${banco}_${nome.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const copyToClipboard = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('Imagem copiada para área de transferência!');
    } catch {
      download();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ImageIcon size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg">Gerar Imagem de Oferta</h2>
              <p className="text-slate-400 text-xs">Imagem personalizada para WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-0 overflow-auto">
          {/* Controls */}
          <div className="md:w-64 p-5 border-r border-slate-800 flex flex-col gap-4 shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados da Oferta</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Banco</label>
              <input
                type="text"
                value={banco}
                onChange={e => setBanco(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Valor (R$) — atual: {formatBRL(valor)}
              </label>
              <input
                type="number"
                value={valor}
                step="0.01"
                min="0"
                onChange={e => setValor(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={generate}
              disabled={isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Gerando...</>
              ) : (
                <><ImageIcon size={16} /> Gerar Imagem</>
              )}
            </button>

            {imageUrl && (
              <>
                <button
                  onClick={download}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                >
                  <Download size={15} /> Baixar PNG
                </button>
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                >
                  📋 Copiar Imagem
                </button>
              </>
            )}

            <div className="mt-auto pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                💡 A imagem será gerada com os dados acima. Você pode editar os campos e clicar em <strong className="text-slate-400">Gerar Imagem</strong> novamente para atualizar.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 p-5 flex flex-col items-center justify-start gap-3 overflow-auto bg-slate-950/50 min-h-[400px]">
            {!imageUrl && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-slate-500">
                <ImageIcon size={48} className="text-slate-700" />
                <p className="text-sm">Clique em <strong className="text-slate-400">Gerar Imagem</strong> para visualizar</p>
              </div>
            )}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-slate-500">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
                <p className="text-sm text-slate-400">Gerando imagem...</p>
              </div>
            )}
            {imageUrl && !isGenerating && (
              <>
                <p className="text-xs text-slate-500 self-start">Pré-visualização</p>
                <img
                  src={imageUrl}
                  alt="Oferta gerada"
                  className="max-w-full rounded-xl shadow-2xl border border-slate-800"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
