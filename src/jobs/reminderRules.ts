type ReminderMode = "until" | "from";
type Urgency = "light" | "asap" | "turbo";

function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null;

  const [hh, mm] = time.split(":").map(Number);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return null;
  }

  return hh * 60 + mm;
}

function nowMinutes(hour: number, minute: number) {
  return hour * 60 + minute;
}

function isHalfHour(hour: number, minute: number) {
  return minute === 0 || minute === 30;
}

export function shouldSendUrgencyReminder(args: {
  urgency: Urgency;
  reminderMode: ReminderMode | string | null | undefined;
  deadlineTime: string | null | undefined;
  hour: number;
  minute: number;
}) {
  const { urgency, deadlineTime, hour, minute } = args;

  const reminderMode: ReminderMode =
    args.reminderMode === "from" ? "from" : "until";

  const now = nowMinutes(hour, minute);
  const deadline = toMinutes(deadlineTime);

  // 🟢 LIGHT
  if (urgency === "light") {
    // sem horário -> fallback 16h
    if (deadline === null) {
      return hour === 16 && minute === 0;
    }

    // entregar até -> 1h antes
    if (reminderMode === "until") {
      return now === deadline - 60;
    }

    // entregar a partir -> no horário
    return now === deadline;
  }

  // 🟡 ASAP
  if (urgency === "asap") {
    // sem horário -> fallback atual
    if (deadline === null) {
      return (
        minute === 0 &&
        (hour === 10 || hour === 12 || hour === 16)
      );
    }

    // entregar até -> 3h / 2h / 1h antes
    if (reminderMode === "until") {
      return (
        now === deadline - 180 ||
        now === deadline - 120 ||
        now === deadline - 60
      );
    }

    // entregar a partir -> hora / +1h / +2h
    return (
      now === deadline ||
      now === deadline + 60 ||
      now === deadline + 120
    );
  }

  // 🔴 TURBO
  if (urgency === "turbo") {
    // turbo só roda em slots de 30min
    if (!isHalfHour(hour, minute)) {
      return false;
    }

    // entregar a partir -> só depois do horário
    if (reminderMode === "from" && deadline !== null) {
      return now >= deadline;
    }

    // entregar até OU sem horário
    return true;
  }

  return false;
}