// Ejemplo de uso del FileViewerModal en la página de préstamos
// Este código muestra cómo reutilizar el modal en diferentes páginas
// Ahora es completamente responsivo para móviles y tablets
//
// Funcionalidades móviles:
// - Selector desplegable rápido para cambiar archivos
// - Botón 📋 para ver la lista completa de archivos en modal separado
// - Sidebar lateral en desktop, modal en móviles

import { useState } from 'react';
import FileViewerModal from '@/components/FileViewerModal';

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano: number;
  fecha_subida: string;
}

function PrestamosPage() {
  const [showFileViewerModal, setShowFileViewerModal] = useState(false);
  const [selectedPagoFiles, setSelectedPagoFiles] = useState<ArchivoAdjunto[]>([]);

  const handleViewPagoFiles = async (pagoId: number) => {
    try {
      const response = await fetch(`/api/archivos_adjuntos/pago_prestamo/${pagoId}`);
      if (response.ok) {
        const archivos = await response.json();
        setSelectedPagoFiles(archivos);
        setShowFileViewerModal(true);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      try {
        const response = await fetch(`/api/archivos_adjuntos/${fileId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          // Actualizar la lista de archivos
          setSelectedPagoFiles(prev => prev.filter(f => f.id !== fileId));
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  return (
    <div className="p-4">
      {/* Tu contenido de préstamos */}
      <button 
        onClick={() => handleViewPagoFiles(123)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
      >
        Ver archivos del pago #123
      </button>

      <FileViewerModal
        isOpen={showFileViewerModal}
        onClose={() => {
          setShowFileViewerModal(false);
          setSelectedPagoFiles([]);
        }}
        archivos={selectedPagoFiles}
        title="Archivos Adjuntos del Pago"
        onDeleteFile={handleDeleteFile}
        canDelete={true} // Permitir eliminación en préstamos
      />
    </div>
  );
}

export default PrestamosPage;