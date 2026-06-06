import React from "react";

export default function HuachipatoLoader({ className = "py-20" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center w-full ${className}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes heartbeat {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
      `}} />
      
      <div className="relative flex items-center justify-center">
        {/* Sombra base estática para dar profundidad */}
        <div className="absolute w-16 h-16 bg-black/5 rounded-full blur-xl animate-pulse"></div>
        
        {/* Logo palpitando */}
        <div className="w-24 h-24 flex items-center justify-center animate-heartbeat z-10 drop-shadow-2xl">
          <img 
            src="https://vectorseek.com/wp-content/uploads/2024/01/Huachipato-FC-Logo-Vector.svg-.png" 
            alt="Cargando..." 
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
      <p className="mt-6 text-sm font-bold text-[#006195] uppercase tracking-widest animate-pulse drop-shadow-sm">
        Cargando Datos...
      </p>
    </div>
  );
}
