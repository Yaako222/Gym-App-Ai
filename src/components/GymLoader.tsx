import { motion } from 'motion/react';
import { Dumbbell } from 'lucide-react';

export default function GymLoader() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glowing aura */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#FF0050]/40 rounded-full blur-2xl"
        />
        
        {/* Main Icon */}
        <Dumbbell className="w-20 h-20 text-white relative z-10" />

        {/* Laser Scanner */}
        <motion.div
          animate={{ top: ['-10%', '110%', '-10%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute left-[-20%] right-[-20%] h-1 bg-[#1d7a82] shadow-[0_0_25px_8px_rgba(29,122,130,0.9)] z-20"
        />
      </div>
      
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="mt-12 flex flex-col items-center gap-3"
      >
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF0050] to-[#1d7a82] tracking-widest uppercase">
          Warming Up
        </h2>
        <div className="flex gap-1.5 items-end h-6">
          <motion.div animate={{ height: ['20%', '100%', '20%'] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 bg-[#FF0050] rounded-full" />
          <motion.div animate={{ height: ['20%', '100%', '20%'] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 bg-[#1d7a82] rounded-full" />
          <motion.div animate={{ height: ['20%', '100%', '20%'] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 bg-[#FF0050] rounded-full" />
          <motion.div animate={{ height: ['20%', '100%', '20%'] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} className="w-1.5 bg-[#1d7a82] rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}
