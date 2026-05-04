"use client";

import { useState } from "react";
import { Dashboard } from "../components/Dashboard";
import { LeadTable } from "../components/LeadTable";
import { AddLeadModal } from "../components/AddLeadModal";
import { Plus } from "lucide-react";

// Main landing page for CRM
export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">
          Visão Geral
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-transform shadow-md active:scale-95"
        >
          <Plus size={18} />
          <span>Novo Lead</span>
        </button>
      </div>

      {/* <Dashboard /> */}
      
      <div className="mt-4">
        <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white mb-4">
          Fila de Envio
        </h2>
        <LeadTable />
      </div>

      <AddLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
