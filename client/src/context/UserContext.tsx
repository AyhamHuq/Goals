import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers } from '../api/users';

interface UserContextValue {
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  users: User[];
  usersLoading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const STORAGE_KEY = 'goals_user_id';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUsers().then((fetched) => {
      if (cancelled) return;
      setUsers(fetched);
      setUsersLoading(false);
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        const found = fetched.find((u) => u.id === storedId);
        if (found) setSelectedUserState(found);
      }
    }).catch(() => {
      if (!cancelled) setUsersLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const setSelectedUser = (user: User) => {
    localStorage.setItem(STORAGE_KEY, user.id);
    setSelectedUserState(user);
  };

  return (
    <UserContext.Provider value={{ selectedUser, setSelectedUser, users, usersLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserProvider');
  return ctx;
}
