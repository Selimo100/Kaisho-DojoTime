import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class, e.g. "max-w-2xl" */
  maxWidth?: string;
}

/**
 * Einheitliche Modal-Hülle: neutraler Header (Titel + optionaler Untertitel/Icon),
 * scrollbarer Inhalt und optionale Fusszeile. Kein Farbverlauf, dezente Grautöne.
 */
export default function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl border border-kaisho-greyLight`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none flex items-start justify-between gap-4 p-5 border-b border-kaisho-greyLight">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="text-kaisho-blue flex-shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Schliessen"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex-none p-4 border-t border-kaisho-greyLight bg-gray-50 rounded-b-xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
