import { useEffect, useState } from 'react';
import { maintApi, type MaintMeta, type Room } from '../../lib/maintenanceApi';

export function useMaintMeta() {
  const [meta, setMeta] = useState<MaintMeta | null>(null);
  useEffect(() => { maintApi.meta().then(setMeta).catch(() => setMeta(null)); }, []);
  return meta;
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  useEffect(() => { maintApi.rooms().then(setRooms).catch(() => setRooms([])); }, []);
  return rooms;
}

export const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open', TRIAGED: 'In triage', ASSIGNED: 'Assigned', ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS: 'In progress', WAITING_PARTS: 'Waiting: parts', WAITING_APPROVAL: 'Waiting: approval',
  WAITING_REQUESTER: 'Waiting: you', RESOLVED: 'Resolved', CONFIRMED: 'Confirmed', CLOSED: 'Closed',
  CANCELLED: 'Cancelled', REOPENED: 'Reopened',
};
