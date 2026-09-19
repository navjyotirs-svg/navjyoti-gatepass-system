'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Users } from 'lucide-react';
import { PublicEmployee } from '@/types/employee';

interface EmployeeSelectorProps {
  employees: PublicEmployee[];
  value: string;
  onChange: (id: string, type: 'employee' | 'department') => void;
  error?: string;
}

export function EmployeeSelector({ employees, value, onChange, error }: EmployeeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedEmployee = employees.find(e => e.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const departments = filtered.filter(e => e.id.startsWith('dept_'));
  const actualEmployees = filtered.filter(e => !e.id.startsWith('dept_'));

  return (
    <div className="flex flex-col space-y-1 relative group z-50" ref={wrapperRef}>
      <label className="text-xs font-semibold tracking-wider text-on-surface-variant group-focus-within:text-primary transition-colors">
        Person to Meet
      </label>
      
      <div 
        className={`relative w-full cursor-pointer min-h-[48px] sm:min-h-[52px] h-auto py-1 rounded-xl border bg-white flex items-center justify-between transition-all overflow-hidden ${error ? 'border-error' : 'border-gray-200 hover:border-[#0133a1]'}`}
        onClick={() => setIsOpen(!isOpen)}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="flex h-full flex-1 min-w-0">
          <span className={`inline-flex items-center justify-center w-10 sm:w-12 shrink-0 border-r bg-[#f4f7fb] text-[#0133a1] self-stretch ${error ? 'border-error' : 'border-gray-200'}`}>
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div className="flex-1 min-w-0 px-3 sm:px-4 flex items-center py-3">
            <span className={`text-[14px] sm:text-base truncate break-words ${selectedEmployee ? 'text-gray-800' : 'text-gray-400'}`}>
              {selectedEmployee ? selectedEmployee.name : 'Select Employee or Department...'}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 mr-3 sm:mr-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {error && <p className="text-xs text-error mt-1">{error}</p>}

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-[60] md:hidden" 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
          />
          
          <div className="fixed left-3 right-3 top-1/2 -translate-y-1/2 max-h-[min(60vh,400px)] max-h-[min(60dvh,400px)] md:absolute md:top-full md:inset-auto md:translate-y-0 md:left-0 md:right-0 md:w-full md:mt-2 md:max-h-[300px] bg-surface-container-lowest border border-outline rounded-xl shadow-xl z-[70] flex flex-col overflow-hidden">
            <div className="p-2 border-b border-outline-variant flex items-center shrink-0">
              <Search className="w-4 h-4 text-on-surface-variant mr-2" />
              <input 
                type="text" 
                className="flex-1 bg-transparent outline-none text-sm text-on-surface"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {departments.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Departments</div>
                  {departments.map(dept => (
                    <div 
                      key={dept.id}
                      className="px-4 py-3 hover:bg-surface-container-low cursor-pointer border-b border-outline-variant last:border-0"
                      onClick={() => {
                        // Remove dept_ prefix to get department code
                        onChange(dept.name, 'department');
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <div className="font-medium text-on-surface break-words">{dept.name}</div>
                      {dept.department && <div className="text-xs text-on-surface-variant break-words">{dept.department}</div>}
                    </div>
                  ))}
                </div>
              )}
              
              {actualEmployees.length > 0 && (
                <div className="py-2 border-t border-outline-variant">
                  <div className="px-4 py-1 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Employees</div>
                  {actualEmployees.map(emp => (
                    <div 
                      key={emp.id}
                      className="px-4 py-3 hover:bg-surface-container-low cursor-pointer border-b border-outline-variant last:border-0"
                      onClick={() => {
                        onChange(emp.id, 'employee');
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <div className="font-medium text-on-surface break-words">{emp.name}</div>
                      {emp.department && <div className="text-xs text-on-surface-variant break-words">{emp.department}</div>}
                    </div>
                  ))}
                </div>
              )}

              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
                  No results found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
