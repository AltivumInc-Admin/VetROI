import React, { useState, useEffect, useRef } from 'react';
import './SlashCommandMenu.css';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  shortcut?: string;
}

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  commands: Command[];
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ position, onClose, commands }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on search term
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  return (
    <div 
      ref={menuRef}
      className="slash-command-menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="slash-command-header">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search commands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="slash-command-input"
        />
      </div>
      
      <div className="slash-command-list">
        {filteredCommands.length === 0 ? (
          <div className="slash-command-empty">No commands found</div>
        ) : (
          filteredCommands.map((command, index) => (
            <div
              key={command.id}
              className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                command.action();
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="slash-command-icon">{command.icon}</span>
              <div className="slash-command-content">
                <div className="slash-command-label">{command.label}</div>
                <div className="slash-command-description">{command.description}</div>
              </div>
              {command.shortcut && (
                <span className="slash-command-shortcut">{command.shortcut}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};