'use client';

import { useState, useEffect } from 'react';
import { requestFirebaseNotificationPermission, messaging } from '@/lib/client/firebase';
import { getToken } from 'firebase/messaging';
import { registerPushDevice, unregisterPushDevice, sendTestPushNotification } from '@/app/actions/employeeDevice';
import { getActiveEmployees } from '@/lib/data/employees';
import { PublicEmployee } from '@/types/employee';

export default function NotificationsPage() {
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      const data = await getActiveEmployees();
      if (data) setEmployees(data);
    }
    loadEmployees();
    
    // Check if permission is already granted and a token exists
    async function checkExistingRegistration() {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted' && messaging) {
          try {
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            if (token) {
              setCurrentToken(token);
              setIsRegistered(true);
            }
          } catch (e) {
            console.error('Failed to get existing token:', e);
          }
        }
      }
    }
    checkExistingRegistration();
  }, []);

  const handleEnableNotifications = async () => {
    if (!selectedEmployeeId) {
      alert("Please select an employee identity first.");
      return;
    }

    setIsLoading(true);
    setStatus('Requesting permission...');
    try {
      const token = await requestFirebaseNotificationPermission();
      if (token) {
        setStatus('Token received. Saving to database...');
        const result = await registerPushDevice(selectedEmployeeId, token, 'Web Browser');
        if (result.success) {
          setCurrentToken(token);
          setIsRegistered(true);
          setStatus('');
        } else {
          setStatus('Failed to save device token.');
        }
      } else {
        setStatus('Permission denied or FCM failed.');
      }
    } catch (e) {
      console.error(e);
      setStatus('Error occurred while setting up notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!currentToken) return;
    setIsLoading(true);
    setStatus('Disabling notifications...');
    try {
      const result = await unregisterPushDevice(currentToken);
      if (result.success) {
        setIsRegistered(false);
        setCurrentToken(null);
        setStatus('Notifications disabled successfully.');
      } else {
        setStatus('Failed to disable notifications.');
      }
    } catch (e) {
      console.error(e);
      setStatus('Error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!currentToken) return;
    setStatus('Dispatching test notification...');
    try {
      const result = await sendTestPushNotification(currentToken);
      if (result.success) {
        setStatus('Test notification dispatched by Firebase!');
      } else {
        setStatus('Failed to dispatch test notification: ' + result.error);
      }
    } catch {
      setStatus('Error dispatching test notification.');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-md mx-auto overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4">Navjyoti</h1>
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 leading-tight">Device Setup / Notification Settings</h2>

      {isRegistered ? (
        <div className="bg-surface-variant p-6 rounded-xl border border-outline">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-bold">Notifications Enabled</h3>
          </div>
          <p className="mb-6 text-on-surface-variant font-medium">
            This device is registered for visitor alerts.
          </p>
          <p className="mb-6 text-on-surface-variant">
            You may close this page. Future visitor requests will be delivered automatically to this device.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTestNotification}
              className="w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-xl min-h-[48px] text-sm sm:text-base"
            >
              Send Test Notification
            </button>
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="w-full border border-error text-error font-bold py-3 px-4 rounded-xl disabled:opacity-50 min-h-[48px] text-sm sm:text-base"
            >
              Disable Notifications
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold mb-2">Enable Visitor Notifications</h3>
          <p className="mb-6 text-on-surface-variant">
            Set up this device once to receive visitor approval alerts. After setup, you can close this page.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select your identity (QA/Demo only):</label>
            <select 
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full p-3 rounded-lg border border-outline bg-surface text-on-surface disabled:opacity-50 min-h-[48px] text-[16px]"
              disabled={employees.length === 0}
            >
              <option value="">
                {employees.length === 0 ? "Loading employees..." : "-- Select Employee --"}
              </option>
              {employees.map(emp => (
                 <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <p className="text-xs mt-2 text-on-surface-variant">
              In production, device registration will be protected via authenticated employee identity.
            </p>
          </div>

          <button
            onClick={handleEnableNotifications}
            disabled={isLoading || !selectedEmployeeId}
            className="w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-xl mb-4 disabled:opacity-50 min-h-[48px] text-sm sm:text-base"
          >
            {isLoading ? 'Processing...' : 'Enable Notifications'}
          </button>
        </div>
      )}

      {status && (
        <p className="mt-4 text-sm font-medium p-4 bg-surface-variant rounded-lg text-center">
          {status}
        </p>
      )}
    </div>
  );
}
