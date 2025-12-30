import { useState } from 'react';

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano: number;
  fecha_subida: string;
}

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivos: ArchivoAdjunto[];
  title?: string;
  onDeleteFile?: (fileId: number) => void;
  canDelete?: boolean;
}

export default function FileViewerModal({
  isOpen,
  onClose,
  archivos,
  title = "Archivos Adjuntos",
  onDeleteFile,
  canDelete = false
}: FileViewerModalProps) {
  const [selectedFile, setSelectedFile] = useState<ArchivoAdjunto | null>(
    archivos.length > 0 ? archivos[0] : null
  );
  const [showFileList, setShowFileList] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return '🖼️';
    if (tipo === 'application/pdf') return '📄';
    if (tipo.includes('word') || tipo.includes('document')) return '📝';
    return '📎';
  };

  const renderFileViewer = () => {
    if (!selectedFile) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📂</div>
            <p>Selecciona un archivo para visualizar</p>
          </div>
        </div>
      );
    }

    const { tipo_archivo, ruta_archivo, nombre_archivo, id } = selectedFile;

    // Usar directamente la URL presigned que ya viene en ruta_archivo
    const proxyUrl = ruta_archivo;

    if (tipo_archivo.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-2 sm:p-4">
          <div className="text-center w-full">
            <img
              src={proxyUrl}
              alt={nombre_archivo}
              className="max-w-full max-h-64 sm:max-h-96 object-contain rounded-lg shadow-lg mx-auto block"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const container = target.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div class="text-center p-4">
                      <div class="text-4xl sm:text-6xl mb-4">🖼️</div>
                      <h3 class="text-lg sm:text-xl font-semibold mb-2">${nombre_archivo}</h3>
                      <p class="text-gray-600 mb-4 text-sm sm:text-base">Imagen - ${formatFileSize(selectedFile.tamano)}</p>
                      <a href="${proxyUrl}" target="_blank" rel="noopener noreferrer"
                         class="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-lg font-medium">
                        📥 Descargar Imagen
                      </a>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </div>
      );
    }

    if (tipo_archivo === 'application/pdf') {
      return (
        <div className="h-full p-2 sm:p-4">
          <iframe
            src={proxyUrl}
            className="w-full h-full border rounded-lg"
            title={nombre_archivo}
            onError={(e) => {
              console.error('Error loading PDF:', e);
            }}
          />
        </div>
      );
    }

    // Para otros tipos de archivos, mostrar información del archivo
    return (
      <div className="flex items-center justify-center h-full p-4 sm:p-6">
        <div className="text-center max-w-sm sm:max-w-md">
          <div className="text-4xl sm:text-6xl mb-4">{getFileIcon(tipo_archivo)}</div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2 px-2">{nombre_archivo}</h3>
          <p className="text-gray-600 mb-2 text-sm sm:text-base">Tipo: {tipo_archivo}</p>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Tamaño: {formatFileSize(selectedFile.tamano)}</p>
          <a
            href={proxyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
          >
            📥 Descargar Archivo
          </a>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h2 className="text-lg sm:text-xl font-semibold truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Mobile File Selector */}
        <div className="sm:hidden p-3 border-b bg-gray-50">
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => setShowFileList(!showFileList)}
              className="flex-1 flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <span className="text-sm font-medium">
                {selectedFile ? selectedFile.nombre_archivo : 'Seleccionar archivo'}
              </span>
              <span className="text-gray-500">{showFileList ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="px-3 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Ver lista completa"
            >
              📋
            </button>
          </div>
          
          {showFileList && (
            <div className="max-h-48 overflow-y-auto bg-white border rounded-lg">
              {archivos.map((archivo) => (
                <div
                  key={archivo.id}
                  onClick={() => {
                    setSelectedFile(archivo);
                    setShowFileList(false);
                  }}
                  className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                    selectedFile?.id === archivo.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFileIcon(archivo.tipo_archivo)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {archivo.nombre_archivo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(archivo.tamano)}
                      </p>
                    </div>
                    {canDelete && onDeleteFile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(archivo.id);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        title="Eliminar archivo"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row h-[calc(100vh-120px)] sm:h-[70vh]">
          {/* Desktop Sidebar - Lista de archivos */}
          <div className="hidden sm:block w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Archivos ({archivos.length})
              </h3>
              {archivos.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay archivos adjuntos</p>
              ) : (
                <div className="space-y-2">
                  {archivos.map((archivo) => (
                    <div
                      key={archivo.id}
                      onClick={() => setSelectedFile(archivo)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFile?.id === archivo.id
                          ? 'bg-blue-100 border-blue-300 border'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(archivo.tipo_archivo)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {archivo.nombre_archivo}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(archivo.tamano)} • {new Date(archivo.fecha_subida).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                        </div>
                        {canDelete && onDeleteFile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(archivo.id);
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Eliminar archivo"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main content - File viewer */}
          <div className="flex-1 bg-white overflow-hidden">
            {renderFileViewer()}
          </div>
        </div>

        {/* Mobile Sidebar Modal */}
        {showMobileSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 sm:hidden">
            <div className="bg-white rounded-lg shadow-xl w-full mx-4 max-w-md max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Archivos ({archivos.length})</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto p-4">
                {archivos.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay archivos adjuntos</p>
                ) : (
                  <div className="space-y-2">
                    {archivos.map((archivo) => (
                      <div
                        key={archivo.id}
                        onClick={() => {
                          setSelectedFile(archivo);
                          setShowMobileSidebar(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedFile?.id === archivo.id
                            ? 'bg-blue-100 border-blue-300 border'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <span className="text-lg">{getFileIcon(archivo.tipo_archivo)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {archivo.nombre_archivo}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(archivo.tamano)} • {new Date(archivo.fecha_subida).toLocaleDateString('es-CO')}
                              </p>
                            </div>
                          </div>
                          {canDelete && onDeleteFile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFile(archivo.id);
                              }}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="Eliminar archivo"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}