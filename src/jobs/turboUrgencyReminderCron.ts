// src/jobs/turboUrgencyReminderCron.ts
import { WebClient } from "@slack/web-api";
import { prisma } from "../lib/prisma";
import { notifyTaskUrgencyReminder } from "../services/notifyTaskUrgencyReminder";
import { shouldSendUrgencyReminder } from "./reminderRules";

const SAO_PAULO_TZ = "America/Sao_Paulo";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getSaoPauloNowParts(now = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  return { dateIso: `${year}-${pad2(month)}-${pad2(day)}`, hour, minute };
}

function saoPauloMidnightUtc(dateIso: string) {
  return new Date(`${dateIso}T03:00:00.000Z`);
}

export async function runTurboUrgencyReminderCron() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("Missing SLACK_BOT_TOKEN");

  const slack = new WebClient(token);
  const { dateIso, hour, minute } = getSaoPauloNowParts(new Date());

  const force = process.env.FORCE_TURBO_REMINDER === "1";

  if (!force && minute !== 0 && minute !== 30) {
    console.log(
      `[turbo-reminder] outside half-hour slot: ${dateIso} ${pad2(hour)}:${pad2(minute)} (SP)`
    );
    return;
  }

  const slot = force
    ? process.env.FORCE_TURBO_SLOT ?? "TURBO_FORCED"
    : `TURBO_${pad2(hour)}:${pad2(minute)}`;

  const startUtc = saoPauloMidnightUtc(dateIso);
  const endUtc = new Date(startUtc);
  endUtc.setUTCDate(endUtc.getUTCDate() + 1);

  const turboTasks = await prisma.task.findMany({
    where: {
      status: { not: "done" },
      urgency: "turbo" as any,
      term: { not: null, lt: endUtc },
      reminders: { none: { dateIso, slot } },
    },
    select: {
      id: true,
      title: true,
      deadlineTime: true,
      reminderMode: true,
      responsible: true,
      slackOpenChannelId: true,
      slackOpenMessageTs: true,
    },
  });

  type TurboReminderTask = (typeof turboTasks)[number];

  const filteredTasks = turboTasks.filter((t: TurboReminderTask) =>
    shouldSendUrgencyReminder({
      urgency: "turbo",
      reminderMode: t.reminderMode,
      deadlineTime: t.deadlineTime,
      hour,
      minute,
    })
  );

  if (!filteredTasks.length) {
    console.log(`[turbo-reminder] no turbo tasks for ${dateIso} • slot=${slot}`);
    return;
  }

  console.log(
    `[turbo-reminder] sending reminders: ${filteredTasks.length} tasks • slot=${slot} • date=${dateIso}`
  );

  await Promise.allSettled(
    filteredTasks.map(async (t: TurboReminderTask) => {
      const freshTask = await prisma.task.findUnique({
        where: { id: t.id },
        select: { status: true },
      });

      if (freshTask?.status !== "pending") return;

      let logId: string | null = null;

      try {
        const log = await prisma.taskReminderLog.create({
          data: { taskId: t.id, dateIso, slot },
          select: { id: true },
        });
        logId = log.id;
      } catch (e: any) {
        if (e?.code === "P2002") return;
        throw e;
      }

      try {
        await notifyTaskUrgencyReminder({
          slack,
          dateIso,
          slot,
          task: {
            id: t.id,
            title: t.title,
            responsibleSlackId: t.responsible,
            deadlineTime: t.deadlineTime ?? null,
            slackOpenChannelId: t.slackOpenChannelId,
            slackOpenMessageTs: t.slackOpenMessageTs,
          },
        });
      } catch (err) {
        if (logId) {
          await prisma.taskReminderLog.delete({ where: { id: logId } }).catch(() => void 0);
        }
        throw err;
      }
    })
  );
}

if (require.main === module) {
  runTurboUrgencyReminderCron()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error("[turbo-reminder] failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}