import type { jsPDF } from 'jspdf';
import { BathroomLog, Caregiver, LogType, Profile } from '../types';
import { GOAL_OPTIONS, TELLS_OPTIONS, formatAge } from '../constants';

export type ReportPeriod = 'week' | 'month' | 'all';

export const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'week', label: 'Últimos 7 días' },
  { value: 'month', label: 'Últimos 30 días' },
  { value: 'all', label: 'Todo' },
];

const PRIMARY: [number, number, number] = [59, 130, 246];
const TEXT: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [241, 245, 249];
const GREEN: [number, number, number] = [22, 163, 74];
const AMBER: [number, number, number] = [217, 119, 6];
const ROSE: [number, number, number] = [225, 29, 72];

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Las fuentes estándar del PDF solo cubren Latin-1: se quitan emojis y símbolos raros de las notas. */
const clean = (s: string): string =>
  s.replace(/[^ -~ -ÿ–—‘’“”•…]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const typeLabel = (t: LogType) => (t === LogType.PEE ? 'Pis' : t === LogType.POOP ? 'Caca' : 'Pis y caca');
const resultLabel = (l: BathroomLog) => (l.accident ? 'Accidente' : l.success ? 'Logrado' : 'No salió');
const initiativeLabel = (l: BathroomLog) =>
  l.initiative === 'asked' ? 'Avisó solo' : l.initiative === 'taken' ? 'Lo llevaron' : '-';

export const filterByPeriod = (logs: BathroomLog[], period: ReportPeriod, now = Date.now()): BathroomLog[] => {
  if (period === 'all') return [...logs];
  const days = period === 'week' ? 7 : 30;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return logs.filter(l => l.timestamp >= start.getTime());
};

const pct = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '-');

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'peque';

export const reportFilename = (profile: Profile, now = Date.now()) =>
  `informe_nappy_${slug(profile.name)}_${dayKey(now)}.pdf`;

export const buildReport = async (
  profile: Profile,
  allLogs: BathroomLog[],
  caregivers: Caregiver[],
  period: ReportPeriod,
  now = Date.now()
): Promise<Blob> => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc: jsPDF = new jsPDF({ unit: 'mm', format: 'a4' });

  const logs = filterByPeriod(allLogs, period, now).sort((a, b) => a.timestamp - b.timestamp);
  const total = logs.length;
  const success = logs.filter(l => l.success).length;
  const accidents = logs.filter(l => l.accident).length;
  const notDone = total - success - accidents;

  const first = logs[0]?.timestamp;
  const last = logs[logs.length - 1]?.timestamp;
  const periodText =
    total === 0
      ? PERIOD_OPTIONS.find(p => p.value === period)!.label
      : `${fmtDate(first!)} al ${fmtDate(last!)}`;

  let y = 0;
  const lastY = () => (doc as any).lastAutoTable.finalY as number;
  const ensureSpace = (h: number) => {
    if (y + h > PAGE_H - 20) {
      doc.addPage();
      y = 20;
    }
  };
  const heading = (text: string) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...TEXT);
    doc.text(text, MARGIN, y);
    y += 3;
  };
  const table = (opts: Record<string, any>) => {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: 20 },
      styles: { font: 'helvetica', fontSize: 9, textColor: TEXT, cellPadding: 2 },
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT },
      // El encabezado hereda la alineación de su columna (números a la derecha).
      didParseCell: (d: any) => {
        if (d.section === 'head') {
          const align = opts.columnStyles?.[d.column.index]?.halign;
          if (align) d.cell.styles.halign = align;
        }
      },
      ...opts,
    });
    y = lastY() + 8;
  };

  // Encabezado
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, PAGE_W, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Nappy', MARGIN, 14.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Informe de seguimiento: dejar el pañal', PAGE_W - MARGIN, 14, { align: 'right' });

  y = 34;
  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(clean(profile.name) || 'Peque', MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Período: ${periodText}   ·   Generado el ${fmtDate(now)}`, MARGIN, y);
  y += 6;

  // Datos del peque
  const goal = GOAL_OPTIONS.find(g => g.value === profile.goal)?.label ?? '-';
  const goalText = profile.goal === 'both' ? 'Pis y caca' : goal;
  const tells = TELLS_OPTIONS.find(t => t.value === profile.tellsNeed)?.label ?? '-';
  const sexText = profile.sex === 'girl' ? 'Nena' : profile.sex === 'boy' ? 'Nene' : '-';
  table({
    theme: 'plain',
    body: [
      ['Edad', formatAge(profile.ageMonths), 'Sexo', sexText],
      ['Objetivo', goalText, 'Pañal para dormir', profile.nightDiaper ? 'Sí' : 'No'],
      ['Avisa cuando tiene ganas', tells, '', ''],
    ],
    alternateRowStyles: {},
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 48, textColor: MUTED },
      1: { cellWidth: 42 },
      2: { fontStyle: 'bold', cellWidth: 38, textColor: MUTED },
      3: { cellWidth: 'auto' },
    },
  });

  // Resumen
  heading('Resumen del período');
  y += 3;
  const boxes: { label: string; value: string; sub: string; color: [number, number, number] }[] = [
    { label: 'Registros', value: String(total), sub: ' ', color: PRIMARY },
    { label: 'Logrados', value: String(success), sub: pct(success, total), color: GREEN },
    { label: 'No salió', value: String(notDone), sub: pct(notDone, total), color: AMBER },
    { label: 'Accidentes', value: String(accidents), sub: pct(accidents, total), color: ROSE },
  ];
  const gap = 4;
  const boxW = (CONTENT_W - gap * 3) / 4;
  boxes.forEach((b, i) => {
    const x = MARGIN + i * (boxW + gap);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...b.color);
    doc.text(b.value, x + boxW / 2, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(`${b.label}${b.sub.trim() ? '  ·  ' + b.sub : ''}`, x + boxW / 2, y + 17, { align: 'center' });
  });
  y += 22 + 8;

  if (total === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('No hay registros en este período.', MARGIN, y);
  } else {
    const count = (pred: (l: BathroomLog) => boolean) => logs.filter(pred).length;
    heading('Tipo e iniciativa');
    y += 2;
    table({
      head: [['Indicador', 'Cantidad', '% del total']],
      body: [
        ['Pis', count(l => l.type === LogType.PEE), pct(count(l => l.type === LogType.PEE), total)],
        ['Caca', count(l => l.type === LogType.POOP), pct(count(l => l.type === LogType.POOP), total)],
        ['Pis y caca', count(l => l.type === LogType.BOTH), pct(count(l => l.type === LogType.BOTH), total)],
        ['Avisó solo', count(l => l.initiative === 'asked'), pct(count(l => l.initiative === 'asked'), total)],
        ['Lo llevaron los cuidadores', count(l => l.initiative === 'taken'), pct(count(l => l.initiative === 'taken'), total)],
        ['Sin dato de iniciativa', count(l => !l.initiative), pct(count(l => !l.initiative), total)],
      ],
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });

    // Franja horaria
    const bands = [
      { name: 'Mañana (06 a 12 h)', test: (h: number) => h >= 6 && h < 12 },
      { name: 'Tarde (12 a 19 h)', test: (h: number) => h >= 12 && h < 19 },
      { name: 'Noche (19 a 06 h)', test: (h: number) => h >= 19 || h < 6 },
    ];
    heading('Por franja horaria');
    y += 2;
    table({
      head: [['Franja', 'Registros', 'Logrados', 'Accidentes']],
      body: bands.map(b => {
        const inBand = logs.filter(l => b.test(new Date(l.timestamp).getHours()));
        return [b.name, inBand.length, inBand.filter(l => l.success).length, inBand.filter(l => l.accident).length];
      }),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    // Por día
    const byDay = new Map<string, BathroomLog[]>();
    logs.forEach(l => {
      const k = dayKey(l.timestamp);
      byDay.set(k, [...(byDay.get(k) ?? []), l]);
    });
    heading('Evolución por día');
    y += 2;
    table({
      head: [['Fecha', 'Registros', 'Logrados', 'No salió', 'Accidentes', '% logrado']],
      body: [...byDay.entries()].map(([, dayLogs]) => {
        const s = dayLogs.filter(l => l.success).length;
        const a = dayLogs.filter(l => l.accident).length;
        return [fmtDate(dayLogs[0].timestamp), dayLogs.length, s, dayLogs.length - s - a, a, pct(s, dayLogs.length)];
      }),
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
      },
    });

    // Por cuidador
    const names = new Map(caregivers.map(c => [c.id, clean(c.name) || 'Cuidador']));
    const byCaregiver = new Map<string, BathroomLog[]>();
    logs.forEach(l => byCaregiver.set(l.caregiverId, [...(byCaregiver.get(l.caregiverId) ?? []), l]));
    heading('Por cuidador');
    y += 2;
    table({
      head: [['Cuidador', 'Registros', 'Logrados', '% logrado']],
      body: [...byCaregiver.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .map(([id, cl]) => {
          const s = cl.filter(l => l.success).length;
          return [names.get(id) ?? 'Sin dato', cl.length, s, pct(s, cl.length)];
        }),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    // Detalle
    heading('Detalle de registros');
    y += 2;
    table({
      head: [['Fecha', 'Hora', 'Tipo', 'Resultado', 'Acompañó', 'Iniciativa', 'Observaciones']],
      body: logs.map(l => [
        fmtDate(l.timestamp),
        fmtTime(l.timestamp),
        typeLabel(l.type),
        resultLabel(l),
        names.get(l.caregiverId) ?? '-',
        initiativeLabel(l),
        clean(l.notes ?? ''),
      ]),
      styles: { font: 'helvetica', fontSize: 8, textColor: TEXT, cellPadding: 1.8, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 20 }, 1: { cellWidth: 12 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 },
        4: { cellWidth: 24 }, 5: { cellWidth: 24 }, 6: { cellWidth: 'auto' },
      },
    });
  }

  // Pie de página en todas las hojas
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, PAGE_H - 16, PAGE_W - MARGIN, PAGE_H - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      'Generado por Nappy con registros cargados por la familia. Es información de apoyo y no reemplaza una evaluación profesional.',
      MARGIN, PAGE_H - 11
    );
    doc.text(`Página ${i} de ${pages}`, PAGE_W - MARGIN, PAGE_H - 11, { align: 'right' });
  }

  return doc.output('blob');
};

/** Comparte el PDF (celular) o lo descarga (escritorio / si compartir no está disponible). */
export const deliverPdf = async (blob: Blob, filename: string): Promise<void> => {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Informe Nappy' });
      return;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return; // el usuario canceló
      console.warn('Share API falló, descargando:', err);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
