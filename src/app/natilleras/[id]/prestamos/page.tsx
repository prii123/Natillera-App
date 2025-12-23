
"use client";

import { useState } from "react";
import PrestamosCreador from "@/components/prestamos/PrestamosCreador";
import PrestamosMiembro from "@/components/prestamos/PrestamosMiembro";
import { NatilleraProvider, useNatillera } from "@/contexts/NatilleraContext";
import Navbar from "@/components/Navbar";

function PrestamosPageContent() {
  const { natillera, user, userRole, isLoading, error } = useNatillera();

  // Skeletons
  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (error || !natillera || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{error || 'Natillera no encontrada'}</div>
      </div>
    );
  }

  if (userRole === 'creator') {
    return (
      <>
        <PrestamosCreador natillera={natillera} user={user} />
      </>
    );
  }

  if (userRole === 'member') {
    return (
      <>
        <PrestamosMiembro natillera={natillera} user={user} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">No tienes acceso a los préstamos de esta natillera.</div>
    </div>
  );
}

export default function PrestamosPage() {
  return (
    <NatilleraProvider>
      <PrestamosPageContent />
    </NatilleraProvider>
  );
}
