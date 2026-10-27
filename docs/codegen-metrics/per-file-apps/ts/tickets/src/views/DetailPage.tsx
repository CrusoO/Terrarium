import React from 'react';
import { useSelectedTicket } from '../hooks/useData.ts';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function DetailPage() {
  const ticket = useSelectedTicket();

  return (
    <AppShell>
      <Navbar title="Ticket Details" />
      <div className="page">
        {ticket ? (
          <div className="entity-card">
            <div>
              <h2>{ticket.subject}</h2>
              <p>
                <strong>ID:</strong> {ticket.id}
              </p>
              <p>
                <strong>Requester:</strong> {ticket.requester}
              </p>
              <p>
                <strong>Status:</strong> <StatusBadge status={ticket.status} />
              </p>
              <p>
                <strong>Opened On:</strong> {ticket.openedOn}
              </p>
            </div>
          </div>
        ) : (
          <div className="page">
            <p>No ticket selected.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
