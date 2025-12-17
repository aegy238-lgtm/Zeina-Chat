import React from 'react';
import { Room } from '../types';
import { Users, Mic, BarChart2 } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onClick: (room: Room) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <div 
      onClick={() => onClick(room)}
      className="relative w-full h-32 bg-slate-800/50 rounded-2xl overflow-hidden border border-white/5 active:scale-95 transition-all duration-200 cursor-pointer group shadow-lg"
    >
      {/* Background Image with Blur/Darken */}
      <div className="absolute inset-0">
        <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="absolute inset-0 p-3 flex justify-between items-center">
        
        {/* Right Side: Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Host Avatar (Square with rounded corners + Border) */}
            <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-xl p-[2px] bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-900/30">
                    <img src={room.speakers[0]?.avatar} className="w-full h-full rounded-[10px] object-cover" alt="Host" />
                </div>
                {/* Live Animation Icon */}
                <div className="absolute -bottom-1 -right-1 bg-black/60 backdrop-blur rounded-md p-0.5 border border-white/10 flex items-center gap-0.5">
                    <div className="w-0.5 h-2 bg-green-500 animate-[bounce_1s_infinite]"></div>
                    <div className="w-0.5 h-3 bg-green-500 animate-[bounce_1.2s_infinite]"></div>
                    <div className="w-0.5 h-2 bg-green-500 animate-[bounce_0.8s_infinite]"></div>
                </div>
            </div>

            {/* Texts */}
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm truncate leading-tight">{room.title}</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/5 whitespace-nowrap">
                        {room.category}
                    </span>
                </div>
                
                <p className="text-[10px] text-slate-300 flex items-center gap-1 truncate">
                    <span className="text-amber-400 font-bold">{room.speakers[0]?.name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                    <span>ID: {room.id}</span>
                </p>

                {/* Tags / Mini Info */}
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full border border-white/5 text-[10px] text-slate-300">
                        <Users size={10} className="text-blue-400" />
                        <span>{room.listeners}</span>
                    </div>
                    {room.speakers.length > 1 && (
                         <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full border border-white/5 text-[10px] text-slate-300">
                            <Mic size={10} className="text-green-400" />
                            <span>{room.speakers.length}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Left Side: Enter Button (Visual Cue) */}
        <div className="flex-shrink-0 ml-2">
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <BarChart2 size={16} className="-rotate-90" />
             </div>
        </div>

      </div>
    </div>
  );
};

export default RoomCard;