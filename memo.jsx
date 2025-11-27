import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Archive, 
  Clock, 
  CheckCircle2, 
  Layout, 
  MoreVertical, 
  X,
  RefreshCw,
  Search,
  Settings,
  Image as ImageIcon,
  Palette,
  Zap,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown, // 新增引入
  AlertTriangle,
  Flag,
  List,
  Filter,
  GripVertical,
  Upload,
  Droplet,
  Check,
  ArrowDownUp // 新增引入，用于排序图标
} from 'lucide-react';

// --- 工具函数 ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = date - now;
  
  let dateStr;
  if (date.toDateString() === now.toDateString()) {
    dateStr = `今天 ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  } else {
    dateStr = new Intl.DateTimeFormat('zh-CN', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  }

  if (diff < 0) return `${dateStr} (已过期)`;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let duration = '';
  if (days > 0) {
    duration = `${days}天${hours}小时`;
  } else if (hours > 0) {
    duration = `${hours}小时${minutes}分`;
  } else {
    duration = `${minutes}分`;
    if (minutes <= 0) duration = '即将';
  }

  return `${dateStr} (剩${duration})`;
};

const formatArchiveDateSimple = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

const calculateUrgency = (deadline) => {
  if (!deadline) return 0;
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const diff = end - now;
  if (diff < 0) return -1;
  const maxTime = 3 * 24 * 60 * 60 * 1000; 
  return 1 - Math.min(Math.max(diff / maxTime, 0), 1);
};

// 增强版 Markdown 解析器
const parseMarkdown = (text) => {
  if (!text) return '';
  
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    let safeLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    safeLine = safeLine
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-white drop-shadow-sm">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-blue-200 font-serif">$1</em>')
      .replace(/~~(.*?)~~/g, '<del class="line-through text-white/40 decoration-white/40">$1</del>');

    const listMatch = safeLine.match(/^\s*-\s+(.*)$/);

    if (listMatch) {
      if (!inList) {
        html += '<ul class="list-disc list-inside my-1 pl-1 space-y-0.5">';
        inList = true;
      }
      html += `<li class="marker:text-white/50 pl-1">${listMatch[1]}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (safeLine.trim() === '') {
        html += '<div class="h-3"></div>';
      } else {
        html += `<div class="min-h-[1.4em]">${safeLine}</div>`;
      }
    }
  }

  if (inList) {
    html += '</ul>';
  }
  
  return html;
};

// --- 自定义组件 ---

const CustomDatePicker = ({ currentDate, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(currentDate ? new Date(currentDate) : new Date());
  const [selectedDate, setSelectedDate] = useState(currentDate ? new Date(currentDate) : new Date());
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); 
  
  const handleDateClick = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(viewDate.getFullYear());
    newDate.setMonth(viewDate.getMonth());
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type, delta) => {
    const newDate = new Date(selectedDate);
    if (type === 'hour') newDate.setHours(newDate.getHours() + delta);
    if (type === 'minute') newDate.setMinutes(newDate.getMinutes() + delta);
    setSelectedDate(newDate);
  };

  const handleWheel = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const step = type === 'minute' ? (e.shiftKey ? 1 : 5) : 1; 
    handleTimeChange(type, delta * step);
  };

  const handleConfirm = () => {
    const localIso = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    onChange(localIso);
    onClose();
  };

  const changeMonth = (delta) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  return (
    <div className="fixed right-20 bottom-20 w-64 bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl p-4 z-[100] animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded text-white/70"><ChevronLeft size={16}/></button>
        <span className="font-bold text-white text-sm">
          {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
        </span>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded text-white/70"><ChevronRight size={16}/></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4 text-center">
        {['日','一','二','三','四','五','六'].map(d => <div key={d} className="text-[10px] text-white/30 mb-2">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
          const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth();
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all
                ${isSelected ? 'bg-blue-600 text-white font-bold shadow-lg' : 'text-white/80 hover:bg-white/10'}
                ${isToday && !isSelected ? 'border border-blue-500/50 text-blue-400' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="border-t border-white/10 my-3"></div>

      <div className="flex justify-center items-center gap-4 mb-4">
         <div 
            className="flex flex-col items-center group cursor-ns-resize" 
            onWheel={(e) => handleWheel(e, 'hour')}
         >
            <button onClick={() => handleTimeChange('hour', 1)} className="text-white/20 hover:text-white"><ChevronLeft className="rotate-90" size={14}/></button>
            <div className="text-xl font-mono font-bold text-white my-1 w-10 text-center bg-white/5 rounded border border-transparent hover:border-white/20 transition-colors" title="滚动鼠标滚轮调整">
              {selectedDate.getHours().toString().padStart(2, '0')}
            </div>
            <button onClick={() => handleTimeChange('hour', -1)} className="text-white/20 hover:text-white"><ChevronRight className="rotate-90" size={14}/></button>
            <span className="text-[10px] text-white/30">时</span>
         </div>
         <div className="text-white/30 pb-4">:</div>
         <div 
            className="flex flex-col items-center group cursor-ns-resize"
            onWheel={(e) => handleWheel(e, 'minute')}
         >
            <button onClick={() => handleTimeChange('minute', 5)} className="text-white/20 hover:text-white"><ChevronLeft className="rotate-90" size={14}/></button>
            <div className="text-xl font-mono font-bold text-white my-1 w-10 text-center bg-white/5 rounded border border-transparent hover:border-white/20 transition-colors" title="滚动鼠标滚轮调整">
              {selectedDate.getMinutes().toString().padStart(2, '0')}
            </div>
            <button onClick={() => handleTimeChange('minute', -5)} className="text-white/20 hover:text-white"><ChevronRight className="rotate-90" size={14}/></button>
            <span className="text-[10px] text-white/30">分</span>
         </div>
      </div>

      <div className="flex justify-between items-center">
         <button onClick={() => { onChange(''); onClose(); }} className="text-xs text-red-400 hover:text-red-300 px-2">清除</button>
         <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-white/50 hover:text-white px-3 py-1.5">取消</button>
            <button onClick={handleConfirm} className="text-xs bg-white text-black font-bold px-3 py-1.5 rounded-lg hover:bg-gray-200">确定</button>
         </div>
      </div>
    </div>
  );
};

// 2. 便签组件
const Note = ({ 
  note, 
  onUpdate, 
  onArchive, 
  onSelect, 
  containerRef, 
  zIndex, 
  setGlobalDragState 
}) => {
  const noteRef = useRef(null);
  const [urgency, setUrgency] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // 用于强制刷新定时器显示的 tick
  const [tick, setTick] = useState(0);
  
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.left = `${note.x}px`;
      noteRef.current.style.top = `${note.y}px`;
    }
  }, [note.x, note.y]);

  useEffect(() => {
    const updateUrgency = () => {
      setUrgency(calculateUrgency(note.deadline));
      setTick(t => t + 1); // Force update timer text
    };
    updateUrgency();
    const interval = setInterval(updateUrgency, 60000);
    return () => clearInterval(interval);
  }, [note.deadline]);

  // --- 拖拽逻辑 (Mouse) ---
  const handleMouseDown = (e) => {
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
    
    e.stopPropagation();
    onSelect(note.id);
    
    const rect = noteRef.current.getBoundingClientRect();
    
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    startDrag();

    const handleMouseMove = (moveEvent) => {
      moveDrag(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = (upEvent) => {
      endDrag(upEvent.clientX, upEvent.clientY);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    setShowMenu(false);
    setShowDatePicker(false);
  };

  // --- 拖拽逻辑 (Touch) ---
  const handleTouchStart = (e) => {
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
    e.stopPropagation();
    
    onSelect(note.id);
    const touch = e.touches[0];
    const rect = noteRef.current.getBoundingClientRect();

    dragOffset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };

    startDrag();

    const handleTouchMove = (moveEvent) => {
      const touchMove = moveEvent.touches[0];
      moveDrag(touchMove.clientX, touchMove.clientY);
    };

    const handleTouchEnd = (endEvent) => {
      const touchEnd = endEvent.changedTouches[0];
      endDrag(touchEnd.clientX, touchEnd.clientY);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    setShowMenu(false);
    setShowDatePicker(false);
  }

  // --- 通用拖拽核心 ---
  const startDrag = () => {
    noteRef.current.style.zIndex = 9999;
    noteRef.current.style.transition = 'none'; 
    noteRef.current.style.transform = 'scale(1.02) rotate(1deg)';
  };

  const moveDrag = (clientX, clientY) => {
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    let newX = clientX - containerRect.left - dragOffset.current.x + container.scrollLeft;
    let newY = clientY - containerRect.top - dragOffset.current.y + container.scrollTop;
    
    newX = Math.max(0, newX); 
    newY = Math.max(0, newY);

    noteRef.current.style.left = `${newX}px`;
    noteRef.current.style.top = `${newY}px`;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const isOverArchive = (clientX > w - 150 && clientY > h - 150);
    setGlobalDragState(isOverArchive); 
  };

  const endDrag = (clientX, clientY) => {
    if (noteRef.current) {
      noteRef.current.style.zIndex = zIndex;
      noteRef.current.style.transition = ''; 
      noteRef.current.style.transform = 'scale(1) rotate(0deg)';
    }

    setGlobalDragState(false);

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (clientX > w - 150 && clientY > h - 150) {
      onArchive(note.id);
    } else {
      const finalX = parseFloat(noteRef.current.style.left);
      const finalY = parseFloat(noteRef.current.style.top);
      onUpdate(note.id, { x: finalX, y: finalY });
    }
  };

  const getPriorityStyle = () => {
    switch(note.importance) {
      case 'high': 
        return {
          wrapper: 'border-red-500 border-2 shadow-[0_0_30px_rgba(220,38,38,0.4)]',
          bg: 'bg-black/80',
          title: 'text-red-100 drop-shadow-md',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'medium': 
        return {
          wrapper: 'border-blue-400 border shadow-[0_0_15px_rgba(59,130,246,0.2)]',
          bg: 'bg-slate-900/70',
          title: 'text-blue-50',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'low':
      default:
        return {
          wrapper: 'border-white/10 hover:border-white/20',
          bg: 'bg-gray-900/50',
          title: 'text-white',
          badge: 'bg-white/5 text-white/50 border-white/5'
        };
    }
  };

  const pStyle = getPriorityStyle();

  if (urgency > 0.8) {
    pStyle.wrapper += ' animate-pulse-slow border-red-500 shadow-red-900/50';
  } else if (urgency === -1) {
    pStyle.wrapper = 'border-white/5 bg-gray-800/80 grayscale opacity-80';
    pStyle.title = 'text-gray-400 line-through';
  }

  const getPriorityLabel = () => {
    switch (note.importance) {
      case 'high': return { text: 'CRITICAL', icon: <AlertTriangle size={10} /> };
      case 'medium': return { text: 'IMPORTANT', icon: <Flag size={10} /> };
      default: return { text: 'NORMAL', icon: <Layout size={10} /> };
    }
  };
  const labelInfo = getPriorityLabel();

  return (
    <div
      ref={noteRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute w-72 min-h-[220px] rounded-xl flex flex-col p-5 shadow-2xl cursor-grab active:cursor-grabbing group 
        backdrop-blur-xl transition-shadow duration-200
        ${pStyle.wrapper} ${pStyle.bg}
      `}
      style={{ zIndex }} 
    >
      {note.importance === 'high' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-0">
           <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_10px,transparent_10px,transparent_20px)] opacity-50"></div>
           <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_10px,transparent_10px,transparent_20px)] opacity-50"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
           <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${pStyle.badge}`}>
             {labelInfo.icon}
             {labelInfo.text}
           </div>
           
           {urgency > 0 && urgency !== -1 && (
             <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-orange-500/10 text-orange-400 border-orange-500/20">
               <Clock size={10} /> {urgency > 0.8 ? 'URGENT' : 'ACTIVE'}
             </div>
           )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onArchive(note.id); }}
          className="text-white/20 hover:text-green-400 transition-colors"
          title="完成归档"
        >
          <CheckCircle2 size={18} />
        </button>
      </div>

      {/* Body: Markdown 支持 */}
      <div className="relative z-10 flex-1 flex flex-col">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          placeholder="Title"
          className={`bg-transparent border-none text-xl font-bold placeholder-white/10 focus:outline-none mb-3 w-full ${pStyle.title}`}
        />
        
        {isEditing ? (
          <textarea
            autoFocus
            value={note.content}
            onChange={(e) => onUpdate(note.id, { content: e.target.value })}
            onBlur={() => setIsEditing(false)}
            placeholder="Take a note (Supports Markdown: **bold**, *italic*, - list)"
            className="bg-transparent border-none resize-none flex-grow text-sm text-white/90 placeholder-white/10 focus:outline-none w-full scrollbar-hide font-light leading-relaxed tracking-wide min-h-[100px]"
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="flex-grow text-sm text-white/80 font-light leading-relaxed tracking-wide min-h-[100px] cursor-text"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(note.content) || '<span class="text-white/10">点击添加内容 (支持 Markdown)</span>' }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
        <div className="relative">
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors 
              ${note.deadline ? 'text-blue-300 bg-blue-500/10' : 'text-white/30 hover:bg-white/5'}
            `}
          >
            <CalendarIcon size={12} />
            <span>{note.deadline ? formatDate(note.deadline) : '设定时间'}</span>
          </button>
          
          {showDatePicker && (
            <CustomDatePicker 
              currentDate={note.deadline} 
              onChange={(val) => onUpdate(note.id, { deadline: val })}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${note.importance !== 'low' ? 'text-white' : 'text-white/30 hover:text-white'}`}
          >
            <MoreVertical size={14}/>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 bottom-8 w-32 bg-[#1a1a1a] rounded-lg p-1 border border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
               <div className="px-2 py-1 text-[10px] text-white/30 font-bold uppercase tracking-widest">Priority</div>
               <button onClick={() => { onUpdate(note.id, { importance: 'high' }); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 rounded flex items-center gap-2"><Zap size={12} /> High</button>
               <button onClick={() => { onUpdate(note.id, { importance: 'medium' }); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-white/5 rounded flex items-center gap-2"><Flag size={12} /> Medium</button>
               <button onClick={() => { onUpdate(note.id, { importance: 'low' }); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-white/50 hover:bg-white/5 rounded flex items-center gap-2"><Layout size={12} /> Normal</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. 全屏归档
const FullscreenArchive = ({ notes, onClose, onRestore, onDelete, onReorder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  
  const filteredNotes = notes.filter(n => 
    (n.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (n.content?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e, id) => {
    setDraggedNoteId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetId) return;
    if (searchTerm) return; // Disable reordering while searching
    onReorder(draggedNoteId, targetId);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedNoteId(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0a] animate-in fade-in slide-in-from-bottom-10 duration-300 flex flex-col">
       {/* 背景 */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black pointer-events-none"></div>
       
       {/* Header */}
       <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
               <Archive size={20} className="text-blue-400" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">归档清单 <span className="text-white/20 font-normal text-sm px-2 bg-white/5 rounded-full">{notes.length}</span></h1>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14}/>
              <input 
                type="text" 
                placeholder="搜索历史..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-white/20 w-64 transition-all"
              />
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
       </div>

       {/* List Header */}
       <div className="relative z-10 grid grid-cols-12 gap-4 px-12 py-3 text-xs font-bold text-white/30 uppercase tracking-widest border-b border-white/5">
          <div className="col-span-2 pl-8">标题</div>
          <div className="col-span-4">内容</div>
          <div className="col-span-2">截止时间</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-2 text-right">操作</div>
       </div>

       {/* List Body - 这里应用了 custom-scrollbar */}
       <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/20 mt-20">
               <List size={48} strokeWidth={1} className="mb-4"/>
               <p>没有找到相关记录</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
               {filteredNotes.map(note => {
                 const isExpired = note.deadline && new Date(note.archivedAt) > new Date(note.deadline);
                 const isDragging = draggedNoteId === note.id;
                 
                 return (
                   <div 
                     key={note.id} 
                     draggable={!searchTerm}
                     onDragStart={(e) => handleDragStart(e, note.id)}
                     onDragOver={(e) => handleDragOver(e, note.id)}
                     onDrop={handleDrop}
                     className={`grid grid-cols-12 gap-4 px-12 py-4 hover:bg-white/[0.02] transition-all group items-center
                       ${isDragging ? 'opacity-50 bg-white/[0.05]' : ''}
                       ${!searchTerm ? 'cursor-grab active:cursor-grabbing' : ''}
                     `}
                   >
                      <div className="col-span-2 font-bold text-white/90 truncate flex items-center gap-2">
                         {!searchTerm && <GripVertical size={14} className="text-white/10 group-hover:text-white/30 mr-2 flex-shrink-0 transition-colors"/>}
                         {note.importance === 'high' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>}
                         {note.importance === 'medium' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>}
                         {note.title || <span className="text-white/30 italic">无标题</span>}
                      </div>
                      <div className="col-span-4 text-sm text-white/50 truncate font-light">
                         {note.content || '...'}
                      </div>
                      <div className="col-span-2 text-xs text-white/30 font-mono">
                         {formatArchiveDateSimple(note.deadline)}
                      </div>
                      <div className="col-span-2 text-xs font-bold">
                         {isExpired ? (
                           <span className="text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">
                             <AlertTriangle size={12}/> 已过期
                           </span>
                         ) : (
                           <span className="text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded w-fit border border-green-500/20">
                             <CheckCircle2 size={12}/> 已完成
                           </span>
                         )}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onRestore(note)} className="p-2 hover:bg-blue-500/20 text-blue-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1">
                           <RefreshCw size={14}/> 恢复
                         </button>
                         <button onClick={() => onDelete(note.id)} className="p-2 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-lg transition-colors">
                           <Trash2 size={14}/>
                         </button>
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
       </div>
    </div>
  );
};

// 4. 侧边栏 (Fixed positioning to stay on screen)
const Sidebar = ({ desktops, currentDeskId, setCurrentDeskId, addDesktop, deleteDesktop, onReorderDesktops }) => {
  const [draggedDeskId, setDraggedDeskId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedDeskId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (!draggedDeskId || draggedDeskId === targetId) return;
    onReorderDesktops(draggedDeskId, targetId);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedDeskId(null);
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 z-[60] group flex flex-col h-full">
       <div className="absolute inset-0 w-16 group-hover:w-64 bg-black/20 backdrop-blur-sm group-hover:bg-black/80 group-hover:backdrop-blur-xl border-r border-white/5 transition-[width,background] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
       
       <div className="relative w-16 group-hover:w-64 pt-20 pb-8 flex flex-col h-full transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden">
          {/* 这里应用了 custom-scrollbar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3">
              {desktops.map(desk => {
                const isActive = currentDeskId === desk.id;
                const isDragging = draggedDeskId === desk.id;
                
                return (
                  <div
                    key={desk.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, desk.id)}
                    onDragOver={(e) => handleDragOver(e, desk.id)}
                    onDrop={handleDrop}
                    onClick={() => setCurrentDeskId(desk.id)}
                    className={`relative w-full h-12 rounded-xl flex items-center transition-all duration-200 shrink-0 mb-2 cursor-pointer
                      ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}
                      ${isDragging ? 'opacity-50 border border-dashed border-white/30' : ''}
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center pointer-events-none -ml-1">
                        <div className="w-10 h-10 rounded-full border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-500/10"></div>
                      </div>
                    )}
                    
                    <div className="absolute left-0 top-0 w-10 h-12 flex items-center justify-center pointer-events-none">
                       <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 font-bold text-xs border border-white/5 shadow-sm">
                         {desk.name.charAt(0)}
                       </div>
                    </div>

                    <div className="ml-12 flex-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 overflow-hidden pr-2">
                       <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                         {desk.name}
                       </span>
                       
                       <div className="flex items-center gap-1">
                          <GripVertical size={14} className="text-white/20 cursor-grab active:cursor-grabbing hover:text-white"/>
                          {desktops.length > 1 && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); deleteDesktop(desk.id); }}
                              className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                )
              })}
              
              <button 
                onClick={addDesktop}
                className="w-full h-12 rounded-xl border border-dashed border-white/10 text-white/20 hover:text-white hover:border-white/30 flex items-center justify-center group/add transition-all shrink-0 mt-4"
              >
                 <Plus size={20} className="group-hover/add:rotate-90 transition-transform"/>
                 <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden delay-75">新建桌面</span>
              </button>
          </div>
       </div>
    </div>
  );
};

// 右下角按钮 (Fixed)
const ArchiveButton = ({ onDropActive, onClick, noteCount }) => {
  return (
    <div 
      onClick={onClick}
      className={`fixed bottom-8 right-8 w-20 h-20 rounded-full flex items-center justify-center 
      cursor-pointer group z-[50] transition-all duration-300 ease-out
      ${onDropActive 
        ? 'scale-125 bg-red-500/20 border-red-500 border-2 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse' 
        : 'bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-110 shadow-2xl'}
      `}
    >
       <Archive 
         size={28} 
         className={`transition-all duration-300 ${onDropActive ? 'text-red-400 scale-110' : 'text-white/60 group-hover:text-white'}`} 
       />
       {!onDropActive && noteCount > 0 && (
         <div className="absolute top-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#121212]">
           {noteCount}
         </div>
       )}
    </div>
  );
};

// 桌面设置
const DesktopSettingsModal = ({ desk, onClose, onUpdate }) => {
  const [bgType, setBgType] = useState(desk.bgType || 'gradient');
  const [inputValue, setInputValue] = useState(desk.bgValue || desk.theme || '');
  
  const gradients = [
    'from-slate-900 via-purple-900 to-slate-900',
    'from-gray-900 via-blue-900 to-gray-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-green-900 via-teal-900 to-emerald-900',
    'from-rose-900 via-red-900 to-orange-900',
    'from-black to-gray-800'
  ];

  const solidColors = [
    '#000000',
    '#1a1a1a', 
    '#3f3f46', 
    '#0f172a', 
    '#1e1b4b', 
    '#312e81', 
    '#450a0a', 
    '#052e16', 
    '#172554', 
  ];

  const handleSave = () => {
    onUpdate(desk.id, {
      ...desk,
      bgType,
      bgValue: inputValue,
      theme: bgType === 'gradient' ? inputValue : '' 
    });
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setInputValue(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a1a1a] w-[420px] rounded-2xl border border-white/10 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Settings size={18}/> 桌面设置</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20}/></button>
        </div>

        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button 
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${bgType === 'gradient' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            onClick={() => setBgType('gradient')}
          >
            <Palette size={14}/> 渐变
          </button>
          <button 
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${bgType === 'solid' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            onClick={() => setBgType('solid')}
          >
            <Droplet size={14}/> 纯色
          </button>
          <button 
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${bgType === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            onClick={() => setBgType('image')}
          >
            <ImageIcon size={14}/> 图片
          </button>
        </div>

        <div className="min-h-[240px]">
          {/* 这里应用了 custom-scrollbar */}
          {bgType === 'gradient' && (
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {gradients.map((g, idx) => (
                <div 
                  key={idx}
                  onClick={() => setInputValue(g)}
                  className={`h-16 rounded-lg bg-gradient-to-br ${g} cursor-pointer border-2 transition-all ${inputValue === g ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:border-white/50'}`}
                />
              ))}
            </div>
          )}

          {bgType === 'solid' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                 {solidColors.map((color) => (
                   <button
                     key={color}
                     onClick={() => setInputValue(color)}
                     style={{ backgroundColor: color }}
                     className={`h-12 rounded-lg border-2 transition-all ${inputValue === color ? 'border-white scale-110 shadow-lg' : 'border-white/10 hover:border-white/50'}`}
                   />
                 ))}
              </div>
              
              <div className="pt-4 border-t border-white/10">
                 <label className="text-xs text-white/50 mb-2 block">自定义颜色 (Hex)</label>
                 <div className="flex gap-3">
                   <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
                      <input 
                        type="color" 
                        value={inputValue.startsWith('#') ? inputValue : '#000000'}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                      />
                   </div>
                   <input 
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-sm font-mono focus:border-blue-500 outline-none uppercase"
                      placeholder="#000000"
                   />
                 </div>
              </div>
            </div>
          )}

          {bgType === 'image' && (
            <div className="space-y-4">
               <div>
                 <label className="text-xs text-white/50 block mb-2">上传本地图片</label>
                 <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="flex flex-col items-center">
                       <Upload className="text-white/30 group-hover:text-blue-400 mb-2" size={24}/>
                       <span className="text-xs text-white/50 group-hover:text-white">点击选择文件</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                 </label>
               </div>
               
               <div className="relative flex items-center gap-2 my-2">
                 <div className="h-[1px] bg-white/10 flex-1"></div>
                 <span className="text-[10px] text-white/30">OR</span>
                 <div className="h-[1px] bg-white/10 flex-1"></div>
               </div>

               <div>
                 <label className="text-xs text-white/50 block mb-2">图片链接 (URL)</label>
                 <input 
                    type="text" 
                    value={inputValue.startsWith('data:') ? '' : inputValue} 
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                 />
               </div>
               
               {inputValue && (
                 <div className="mt-2">
                   <p className="text-[10px] text-white/30 mb-1">预览:</p>
                   <div className="h-20 w-full rounded-lg border border-white/10 bg-cover bg-center" style={{ backgroundImage: `url(${inputValue})` }}></div>
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MindSpaceApp() {
  const [desktops, setDesktops] = useState(() => {
    const saved = localStorage.getItem('mindspace_desktops');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(d => ({
        ...d,
        bgType: d.bgType || 'gradient',
        bgValue: d.bgValue || d.theme || 'from-slate-900 via-purple-900 to-slate-900'
      }));
    }
    return [{ 
      id: 'desk-1', 
      name: '工作台', 
      bgType: 'gradient', 
      bgValue: 'from-slate-900 via-purple-900 to-slate-900' 
    }];
  });
  
  const [currentDeskId, setCurrentDeskId] = useState(() => desktops[0]?.id || 'desk-1');
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('mindspace_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [archivedNotes, setArchivedNotes] = useState(() => {
    const saved = localStorage.getItem('mindspace_archived');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showArchive, setShowArchive] = useState(false);
  const [showDeskSettings, setShowDeskSettings] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isDragOverArchive, setIsDragOverArchive] = useState(false);
  const [arrangeType, setArrangeType] = useState('time');
  const [showArrangeMenu, setShowArrangeMenu] = useState(false);
  
  const [canvasHeight, setCanvasHeight] = useState('100vh');
  
  const containerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mindspace_notes', JSON.stringify(notes));
    localStorage.setItem('mindspace_desktops', JSON.stringify(desktops));
    localStorage.setItem('mindspace_archived', JSON.stringify(archivedNotes));
    
    const currentDeskNotes = notes.filter(n => n.deskId === currentDeskId);
    if (currentDeskNotes.length > 0) {
      const maxBottom = Math.max(...currentDeskNotes.map(n => n.y + 400)); 
      const newHeight = Math.max(window.innerHeight, maxBottom);
      setCanvasHeight(`${newHeight}px`);
    } else {
      setCanvasHeight('100vh');
    }
  }, [notes, desktops, archivedNotes, currentDeskId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch(e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          addNote();
          break;
        case 'delete':
        case 'backspace':
          if (selectedNoteId) {
            e.preventDefault();
            archiveNote(selectedNoteId);
          }
          break;
        case 'escape':
          e.preventDefault();
          setShowArchive(false);
          setShowDeskSettings(false);
          setSelectedNoteId(null);
          setShowFilterMenu(false);
          setShowArrangeMenu(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, notes, currentDeskId]);

  const addNote = (coords) => {
    const container = containerRef.current;
    const scrollTop = container ? container.scrollTop : 0;
    
    let x, y;
    if (coords) {
        x = coords.x;
        y = coords.y;
    } else {
        x = Math.random() * (window.innerWidth - 400) + 150;
        y = scrollTop + Math.random() * (window.innerHeight - 400) + 100;
    }

    const newNote = {
      id: generateId(),
      deskId: currentDeskId,
      x,
      y,
      title: '',
      content: '',
      importance: 'low', 
      createdAt: new Date().toISOString(),
      deadline: null,
    };
    const maxZ = notes.length > 0 ? Math.max(...notes.map(n => n.zIndex || 0)) : 0;
    setNotes(prev => [...prev, { ...newNote, zIndex: maxZ + 1 }]);
    setSelectedNoteId(newNote.id);
  };

  const handleDoubleClick = (e) => {
    // Ensure user double-clicked on the background and not on a note or sidebar
    if (e.target !== containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Calculate coordinates relative to container content (including scroll)
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    // Center note on cursor (approx half width 144px, half min-height 100px)
    addNote({ x: x - 144, y: y - 100 });
  };

  const updateNote = (id, updates) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const archiveNote = (id) => {
    const noteToArchive = notes.find(n => n.id === id);
    if (noteToArchive) {
      setArchivedNotes(prev => [ { ...noteToArchive, archivedAt: new Date().toISOString() }, ...prev]);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNoteId === id) setSelectedNoteId(null);
    }
  };

  const restoreNote = (note) => {
     const maxZ = notes.length > 0 ? Math.max(...notes.map(n => n.zIndex || 0)) : 0;
     setNotes(prev => [...prev, { ...note, x: 300, y: 300, deskId: currentDeskId, zIndex: maxZ + 1 }]);
     setArchivedNotes(prev => prev.filter(n => n.id !== note.id));
  };
  
  const deleteArchivedNote = (id) => {
     setArchivedNotes(prev => prev.filter(n => n.id !== id));
  };

  const deleteDesktop = (id) => {
    if (desktops.length <= 1) return;
    const newDesks = desktops.filter(d => d.id !== id);
    setDesktops(newDesks);
    setCurrentDeskId(newDesks[0].id);
    
    // 1. Archive active notes from deleted desktop to the new default desktop
    const notesToRemove = notes.filter(n => n.deskId === id);
    const newArchivedNotesFromActive = notesToRemove.map(n => ({
        ...n,
        deskId: newDesks[0].id, // Transfer to new desktop so they appear in its archive
        archivedAt: new Date().toISOString()
    }));

    // 2. Migrate existing archived notes from deleted desktop to the new default desktop
    // This ensures they don't become "orphaned" and invisible
    setArchivedNotes(prev => {
        const migratedExisting = prev.map(n => n.deskId === id ? { ...n, deskId: newDesks[0].id } : n);
        return [...migratedExisting, ...newArchivedNotesFromActive];
    });

    setNotes(prev => prev.filter(n => n.deskId !== id));
  };

  const addDesktop = () => {
    const newDesk = {
      id: generateId(),
      name: `桌面 ${desktops.length + 1}`,
      bgType: 'gradient',
      bgValue: 'from-gray-900 via-blue-900 to-gray-900'
    };
    setDesktops(prev => [...prev, newDesk]);
    setCurrentDeskId(newDesk.id);
  };

  const updateDesktop = (id, updates) => {
    setDesktops(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleReorderDesktops = (draggedId, targetId) => {
    const draggedIndex = desktops.findIndex(d => d.id === draggedId);
    const targetIndex = desktops.findIndex(d => d.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newDesktops = [...desktops];
    const [draggedItem] = newDesktops.splice(draggedIndex, 1);
    newDesktops.splice(targetIndex, 0, draggedItem);
    
    setDesktops(newDesktops);
  };

  const handleReorderArchivedNotes = (draggedId, targetId) => {
    if (draggedId === targetId) return;

    setArchivedNotes(prev => {
      const newNotes = [...prev];
      const draggedIndex = newNotes.findIndex(n => n.id === draggedId);
      if (draggedIndex === -1) return prev;
      
      const [draggedNote] = newNotes.splice(draggedIndex, 1);
      
      const targetIndex = newNotes.findIndex(n => n.id === targetId);
      if (targetIndex === -1) {
        newNotes.push(draggedNote);
      } else {
        newNotes.splice(targetIndex, 0, draggedNote);
      }
      
      return newNotes;
    });
  };

  const autoArrange = () => {
    const currentNotes = notes.filter(n => n.deskId === currentDeskId);
    
    // 排序逻辑
    const sortedNotes = [...currentNotes].sort((a, b) => {
        if (arrangeType === 'time') {
            // 有截止时间 < 无截止时间
            if (a.deadline && !b.deadline) return -1;
            if (!a.deadline && b.deadline) return 1;
            // 剩余时间少 < 剩余时间多
            if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
            return 0;
        } else {
            // 优先级排序: High > Medium > Low
            const pMap = { high: 3, medium: 2, low: 1 };
            const pa = pMap[a.importance] || 1;
            const pb = pMap[b.importance] || 1;
            return pb - pa; // 降序
        }
    });

    const cols = Math.floor((window.innerWidth - 100) / 300);
    
    const updatedNotes = notes.map(n => {
      if (n.deskId !== currentDeskId) return n;
      
      const index = sortedNotes.findIndex(sn => sn.id === n.id);
      if (index === -1) return n;

      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...n,
        x: col * 290 + 100, 
        y: row * 240 + 100
      };
    });
    setNotes(updatedNotes);
  };

  const handleNoteSelect = (id) => {
    setSelectedNoteId(id);
    const maxZ = notes.length > 0 ? Math.max(...notes.map(n => n.zIndex || 0)) : 0;
    const targetNote = notes.find(n => n.id === id);
    if (targetNote && targetNote.zIndex < maxZ) {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: maxZ + 1 } : n));
    }
  };

  const currentDesk = desktops.find(d => d.id === currentDeskId) || desktops[0];
  
  const filteredNotes = notes.filter(n => {
    const matchesDesk = n.deskId === currentDeskId;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPriority === 'all' || n.importance === filterPriority;
    
    return matchesDesk && matchesSearch && matchesFilter;
  });
  
  const currentDeskArchivedNotes = archivedNotes.filter(n => n.deskId === currentDeskId);

  const backgroundStyle = useMemo(() => {
    if (currentDesk.bgType === 'image') {
      return {
        backgroundImage: `url(${currentDesk.bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: canvasHeight
      };
    }
    if (currentDesk.bgType === 'solid') {
      return {
        backgroundColor: currentDesk.bgValue,
        height: canvasHeight
      };
    }
    return { height: canvasHeight };
  }, [currentDesk, canvasHeight]);

  const bgGradientClass = currentDesk.bgType === 'gradient' ? `bg-gradient-to-br ${currentDesk.bgValue}` : 'bg-black';

  return (
    <div 
      ref={containerRef}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full min-h-screen overflow-x-hidden overflow-y-auto custom-scrollbar ${bgGradientClass} transition-all duration-700 ease-in-out`}
      style={backgroundStyle}
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1); 
          border-radius: 10px;
          backdrop-filter: blur(4px);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3); 
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
      `}</style>

      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" style={{ height: canvasHeight }}></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" style={{ height: canvasHeight }}></div>
      
      <Sidebar 
        desktops={desktops}
        currentDeskId={currentDeskId}
        setCurrentDeskId={setCurrentDeskId}
        addDesktop={addDesktop}
        deleteDesktop={deleteDesktop}
        onReorderDesktops={handleReorderDesktops}
      />

      <div className="fixed top-6 left-24 right-6 h-16 flex items-center justify-between z-40 pointer-events-none">
         <div className="flex items-center space-x-4 pointer-events-auto bg-black/20 backdrop-blur-lg px-6 py-2 rounded-full border border-white/5 shadow-2xl">
             <input
               type="text"
               value={currentDesk.name}
               onChange={(e) => updateDesktop(currentDesk.id, { name: e.target.value })}
               className="text-xl font-bold text-white tracking-wider bg-transparent border-b border-transparent hover:border-white/30 focus:border-white/50 focus:outline-none transition-colors w-auto min-w-[50px] max-w-[200px]"
             />

            <button 
              onClick={() => setShowDeskSettings(true)}
              className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
              title="设置桌面背景"
            >
              <Palette size={18} />
            </button>
            
            <div className="h-4 w-[1px] bg-white/20"></div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                type="text" 
                placeholder="搜索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none py-1 pl-8 pr-2 text-sm text-white placeholder-white/20 focus:outline-none w-32 focus:w-48 transition-all"
              />
            </div>

            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                className={`p-2 rounded-full transition-colors ${filterPriority !== 'all' ? 'text-blue-400 bg-blue-500/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                title="筛选优先级"
              >
                <Filter size={18} />
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)}></div>
                  <div className="absolute right-0 top-10 w-32 bg-[#1a1a1a] rounded-lg p-1 border border-white/10 shadow-xl z-50">
                     <button onClick={() => { setFilterPriority('all'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 rounded flex items-center gap-2">
                       <List size={12}/> 全部
                       {filterPriority === 'all' && <Check size={12} className="ml-auto text-blue-400"/>}
                     </button>
                     <button onClick={() => { setFilterPriority('high'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 rounded flex items-center gap-2">
                       <Zap size={12}/> 高优先级
                       {filterPriority === 'high' && <Check size={12} className="ml-auto"/>}
                     </button>
                     <button onClick={() => { setFilterPriority('medium'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-white/5 rounded flex items-center gap-2">
                       <Flag size={12}/> 中优先级
                       {filterPriority === 'medium' && <Check size={12} className="ml-auto"/>}
                     </button>
                     <button onClick={() => { setFilterPriority('low'); setShowFilterMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-white/50 hover:bg-white/5 rounded flex items-center gap-2">
                       <Layout size={12}/> 普通
                       {filterPriority === 'low' && <Check size={12} className="ml-auto"/>}
                     </button>
                  </div>
                </>
              )}
            </div>
         </div>

         <div className="flex items-center space-x-3 pointer-events-auto">
            {/* 智能整理按钮 (组合按钮) */}
            <div className="relative flex items-center bg-black/20 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/5 transition-all">
                <button 
                  onClick={autoArrange}
                  className="p-3 text-white rounded-l-full hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
                  title={`智能整理 (${arrangeType === 'time' ? '按剩余时间' : '按优先级'})`}
                >
                  <RefreshCw size={18} />
                </button>
                <div className="w-[1px] h-4 bg-white/20"></div>
                <button
                  onClick={() => setShowArrangeMenu(!showArrangeMenu)}
                  className="p-3 text-white/70 hover:text-white rounded-r-full hover:bg-white/10 active:scale-95 transition-all"
                >
                  <ChevronDown size={14} />
                </button>

                {/* 排序方式菜单 */}
                {showArrangeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowArrangeMenu(false)}></div>
                    <div className="absolute right-0 top-14 w-40 bg-[#1a1a1a] rounded-lg p-1 border border-white/10 shadow-xl z-50">
                       <div className="px-3 py-2 text-[10px] text-white/40 font-bold uppercase tracking-widest">排序方式</div>
                       <button onClick={() => { setArrangeType('time'); setShowArrangeMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 rounded flex items-center gap-2">
                         <Clock size={12}/> 按剩余时间
                         {arrangeType === 'time' && <Check size={12} className="ml-auto text-blue-400"/>}
                       </button>
                       <button onClick={() => { setArrangeType('priority'); setShowArrangeMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 rounded flex items-center gap-2">
                         <ArrowDownUp size={12}/> 按优先级
                         {arrangeType === 'priority' && <Check size={12} className="ml-auto text-blue-400"/>}
                       </button>
                    </div>
                  </>
                )}
            </div>

            <button 
              onClick={() => addNote()} 
              className="px-6 py-3 bg-white text-black rounded-full font-bold flex items-center space-x-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <Plus size={18} />
              <span>新建便签 (N)</span>
            </button>
         </div>
      </div>

      {showDeskSettings && (
        <DesktopSettingsModal 
          desk={currentDesk} 
          onClose={() => setShowDeskSettings(false)} 
          onUpdate={updateDesktop}
        />
      )}

      <div className="absolute inset-0 z-0" style={{ height: canvasHeight }}>
        {filteredNotes.map((note) => (
          <Note
            key={note.id}
            note={note}
            zIndex={note.zIndex || 1}
            containerRef={containerRef}
            onUpdate={updateNote}
            onArchive={archiveNote}
            onSelect={handleNoteSelect}
            setGlobalDragState={setIsDragOverArchive}
          />
        ))}
      </div>

      <ArchiveButton 
        onDropActive={isDragOverArchive} 
        onClick={() => setShowArchive(true)}
        noteCount={currentDeskArchivedNotes.length}
      />

      {showArchive && (
        <FullscreenArchive 
          notes={currentDeskArchivedNotes} 
          onClose={() => setShowArchive(false)}
          onRestore={restoreNote}
          onDelete={deleteArchivedNote}
          onReorder={handleReorderArchivedNotes}
        />
      )}
    </div>
  );
}
