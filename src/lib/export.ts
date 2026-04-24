import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Lead } from "../types";

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const mapLeadToExportData = (lead: Lead) => ({
  'Nome': lead.name,
  'CPF': lead.cpf,
  'WhatsApp': lead.phone,
  'Banco': lead.bank,
  'Valor Liberado': `R$ ${lead.availableValue.toFixed(2).replace('.', ',')}`,
  'Origem': lead.origin || '-',
  'Data Consulta': formatDateTime(lead.consultDate),
  'Status': lead.status,
  'Fila': lead.queue,
  'Última Ação': lead.lastAction,
  'Último Envio': formatDateTime(lead.lastSendDate)
});

export const exportToExcel = (leads: Lead[], filename = "lkzap_leads") => {
  if (!leads.length) return;
  const data = leads.map(mapLeadToExportData);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (leads: Lead[], filename = "lkzap_leads") => {
  if (!leads.length) return;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(14);
  doc.text("Relatório de Leads - CRM LKZap", 14, 15);
  doc.setFontSize(10);
  doc.text(`Total de registros: ${leads.length} | Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

  const data = leads.map(mapLeadToExportData);
  const columns = Object.keys(data[0]);
  const rows = data.map(obj => Object.values(obj));

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [5, 150, 105] }, // Emerald-600
  });

  doc.save(`${filename}.pdf`);
};
