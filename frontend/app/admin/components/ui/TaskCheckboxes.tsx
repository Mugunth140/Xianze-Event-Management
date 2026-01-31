'use client';

interface TaskCheckboxesProps {
  role: 'admin' | 'coordinator' | 'member';
  selectedTasks: string[];
  onChange: (tasks: string[]) => void;
  disabled?: boolean;
}

// Task definitions with labels
const TASK_DEFINITIONS = {
  verify_payment: {
    label: 'Verify Payments',
    description: 'Can verify payment transactions',
    roles: ['coordinator', 'member'], // Available for these roles
  },
  mark_attendance: {
    label: 'Mark Attendance',
    description: 'Can mark participant attendance',
    roles: ['coordinator', 'member'], // Optional for both
  },
  check_in_participant: {
    label: 'Check-in Participants',
    description: 'Can scan QR and check-in participants',
    roles: ['coordinator'], // Member has this by default
  },
  scan_event_participation: {
    label: 'Scan Event Participation',
    description: 'Can scan participant QR at event halls',
    roles: ['member'], // Coordinator has this by default
  },
  manage_rounds: {
    label: 'Manage Rounds',
    description: 'Can start events and advance rounds',
    roles: ['member'], // Coordinator has this by default
  },
};

// Default tasks per role (these are always enabled, shown as readonly)
const DEFAULT_TASKS: Record<string, string[]> = {
  admin: Object.keys(TASK_DEFINITIONS),
  coordinator: ['scan_event_participation', 'manage_rounds'],
  member: ['check_in_participant'],
};

export default function TaskCheckboxes({
  role,
  selectedTasks,
  onChange,
  disabled = false,
}: TaskCheckboxesProps) {
  // Admin has all tasks implicitly
  if (role === 'admin') {
    return <div className="text-sm text-gray-500 italic">Admins have full access to all tasks</div>;
  }

  const defaultTasks = DEFAULT_TASKS[role] || [];

  const handleToggle = (task: string) => {
    if (selectedTasks.includes(task)) {
      onChange(selectedTasks.filter((t) => t !== task));
    } else {
      onChange([...selectedTasks, task]);
    }
  };

  // Get available tasks for this role
  const availableTasks = Object.entries(TASK_DEFINITIONS).filter(([_, def]) =>
    def.roles.includes(role)
  );

  if (availableTasks.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No optional tasks available for this role</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Show default tasks as readonly */}
      {defaultTasks.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Default Tasks</p>
          {defaultTasks.map((task) => {
            const def = TASK_DEFINITIONS[task as keyof typeof TASK_DEFINITIONS];
            if (!def) return null;
            return (
              <label
                key={task}
                className="flex items-start gap-3 py-2 text-gray-400 cursor-not-allowed"
              >
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600"
                />
                <div>
                  <span className="font-medium">{def.label}</span>
                  <span className="text-xs ml-2">(default)</span>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Show optional tasks as checkboxes */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Optional Tasks</p>
        {availableTasks.map(([task, def]) => {
          const isDefault = defaultTasks.includes(task);
          if (isDefault) return null; // Already shown above

          return (
            <label
              key={task}
              className={`flex items-start gap-3 py-2 rounded-lg px-2 -mx-2 transition-colors ${
                disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-primary-50 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTasks.includes(task)}
                onChange={() => handleToggle(task)}
                disabled={disabled}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium">{def.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">{def.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
