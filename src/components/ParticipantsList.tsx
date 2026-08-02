export interface Participant {
  id: string;
  name: string;
  status: "pending" | "signed";
  timestamp: string;
  fromDocument?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  onRemove?: (id: string) => void;
}

export function ParticipantsList({ participants, onRemove }: ParticipantsListProps) {
  return (
    <div>
      {participants.map((participant) => (
        <div className="participant-row" key={participant.id}>
          <span className="participant-name">{participant.name}</span>

          <span className={"participant-status " + (participant.status === "signed" ? "signed" : "pending")}>
            {participant.status === "signed" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            )}{" "}
            {participant.status === "signed" ? "Pasirašyta" : "Laukiama"}
          </span>

          <span className="participant-date">{participant.timestamp}</span>

          {!participant.fromDocument && onRemove && (
            <button
              type="button"
              className="participant-remove-row"
              aria-label={"Pašalinti " + participant.name}
              onClick={() => onRemove(participant.id)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16"></path>
                <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
