import React from 'react';
import { Room } from '../types';
import { Users, Mic } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onClick: (room: Room) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <div 
      onClick={() => onClick(room)}
      className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700 active:scale-95 transition-transform duration-200 cursor-pointer relative"
    >
      {/* Category Tag */}
      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white z-10 border border-white/10">
        {room.category}
      </div>

      {/* Image Area */}
      <div className="h-32 w-full relative">
        <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        
        {/* Host Avatar Overlap */}
        <div className="absolute -bottom-4 left-4 border-4 border-slate-800 rounded-full">
           <img src={room.speakers[0]?.avatar} className="w-12 h-12 rounded-full" alt="Host" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 pt-5">
        <h3 className="font-bold text-white text-lg truncate mb-1">{room.title}</h3>
        <div className="flex justify-between items-center text-slate-400 text-xs">
          <div className="flex items-center gap-1">
             <span className="text-amber-400">{room.speakers[0]?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
               <Mic size={12} />
               <span>{room.speakers.length}</span>
            </div>
            <div className="flex items-center gap-1">
               <Users size={12} />
               <span>{room.listeners}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;