// src/services/publishHome.ts
import type { WebClient } from "@slack/web-api";
import { prisma } from "../lib/prisma";

import { homeTasksBlocks } from "../views/homeTasksBlocks";
import { homeHeaderActionsBlocks } from "../views/homeHeaderActions";

import type { Prisma } from "../generated/prisma/browser";

const SAO_PAULO_TZ = "America/Sao_Paulo";

// ✅ limites
const MAX_BLOCKS = 100;
const TODAY_MAX = 20;
const TOMORROW_MAX = 20;
const FUTURE_PAGE_SIZE = 10;

// =========================================================
// ✅ Slack ID -> Nome (cache)
// =========================================================
const slackNameCache = new Map<string, string>();

async function getSlackDisplayName(slack: WebClient, userId: string): Promise<string> {
  if (!userId) return "";
  if (slackNameCache.has(userId)) return slackNameCache.get(userId)!;

  try {
    const res = await slack.users.info({ user: userId });
    const u: any = (res as any)?.user;

    const name =
      (u?.profile?.display_name as string) ||
      (u?.profile?.real_name as string) ||
      (u?.real_name as string) ||
      (u?.name as string) ||
      userId;

    const finalName = String(name).trim() || userId;
    slackNameCache.set(userId, finalName);
    return finalName;
  } catch {
    slackNameCache.set(userId, userId);
    return userId;
  }
}

async function resolveSlackNames(slack: WebClient, ids: Array<string | null | undefined>) {
  const unique = Array.from(new Set((ids ?? []).filter(Boolean).map(String)));
  const map = new Map<string, string>();

  await Promise.all(
    unique.map(async (id) => {
      map.set(id, await getSlackDisplayName(slack, id));
    })
  );

  return map;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getSaoPauloTodayIso(now = new Date()) {
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

  return `${year}-${pad2(month)}-${pad2(day)}`; // YYYY-MM-DD
}

function addDaysIso(iso: string, days: number) {
  const base = new Date(`${iso}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function termIso(term: Date | null) {
  if (!term || Number.isNaN(term.getTime())) return null;
  return term.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function bucketByIso(taskTerm: Date | null, todayIso: string) {
  const tIso = termIso(taskTerm);
  if (!tIso) return "future";

  const tomorrowIso = addDaysIso(todayIso, 1);
  const dayAfterIso = addDaysIso(todayIso, 2);

  if (tIso < todayIso) return "overdue";
  if (tIso === todayIso) return "today";
  if (tIso === tomorrowIso) return "tomorrow";
  if (tIso >= dayAfterIso) return "future";
  return "future";
}

// ✅ ordenação: turbo > asap > light, depois data (term), depois createdAt desc
// ✅ ordenação: data (term ASC), depois urgência (turbo > asap > light), depois createdAt DESC
const URGENCY_RANK: Record<string, number> = { turbo: 0, asap: 1, light: 2 };

function timeMs(term: Date | null) {
  if (!term || Number.isNaN(term.getTime())) return Number.POSITIVE_INFINITY;
  return term.getTime();
}

function sortTasks<A extends { urgency: string; term: Date | null; createdAt?: Date | null }>(arr: A[]) {
  return [...arr].sort((a, b) => {
    const ta = timeMs(a.term);
    const tb = timeMs(b.term);
    if (ta !== tb) return ta - tb;

    const ra = URGENCY_RANK[a.urgency] ?? 99;
    const rb = URGENCY_RANK[b.urgency] ?? 99;
    if (ra !== rb) return ra - rb;

    const ca = a.createdAt ? a.createdAt.getTime() : 0;
    const cb = b.createdAt ? b.createdAt.getTime() : 0;
    return cb - ca;
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const safePage = clamp(page ?? 0, 0, maxPage);
  const start = safePage * pageSize;
  const end = start + pageSize;
  return { total, page: safePage, pageSize, items: items.slice(start, end) };
}

type HomePaginationState = {
  myTodayPage: number;
  myTomorrowPage: number;
  myFuturePage: number;

  delegatedTodayPage: number;
  delegatedTomorrowPage: number;
  delegatedFuturePage: number;

  ccTodayPage: number;
  ccTomorrowPage: number;
  ccFuturePage: number;

  myDelegatorFilter: string | null;
  myCcFilter: string | null;

  delegatedResponsibleFilter: string | null;
  ccResponsibleFilter: string | null;
  delegatedCcFilter: string | null;
};

const DEFAULT_STATE: HomePaginationState = {
  myTodayPage: 0,
  myTomorrowPage: 0,
  myFuturePage: 0,

  delegatedTodayPage: 0,
  delegatedTomorrowPage: 0,
  delegatedFuturePage: 0,

  ccTodayPage: 0,
  ccTomorrowPage: 0,
  ccFuturePage: 0,

  myDelegatorFilter: null,
  myCcFilter: null,

  delegatedResponsibleFilter: null,
  ccResponsibleFilter: null,
  delegatedCcFilter: null,
};

type RawTask = {
  id: string;
  title: string;
  description: string | null;
  delegation: string;
  responsible: string;
  term: Date | null;
  urgency: "light" | "asap" | "turbo";
  recurrence: string | null;
  status: string;
  createdAt: Date;

  carbonCopies?: Array<{
    slackUserId: string;
  }>;
};

export async function publishHome(
  slack: WebClient,
  userId: string,
  opts?: { state?: Partial<HomePaginationState> }
) {
  const userSlackId = userId;

  const state: HomePaginationState = {
    ...DEFAULT_STATE,
    ...(opts?.state ?? {}),
  };

  // =========================================================
  // 1) Datas base
  // =========================================================
  const now = new Date();
  const todayIso = getSaoPauloTodayIso(now);
  const todayUtc = new Date(`${todayIso}T00:00:00.000Z`);

  const visibleWhere: Prisma.TaskWhereInput = {
    OR: [{ dependsOnId: null }, { dependsOn: { status: "done" } }],
  };

  const excludeSelfDelegatedFromResponsible: Prisma.TaskWhereInput = {
    delegation: { not: userSlackId },
  };

  // =========================================================
  // 2) Minhas tarefas (responsible)
  // =========================================================
  const myTasksRaw = (await prisma.task.findMany({
    where: {
      responsible: userSlackId,
      status: { notIn: ["done", "cancelled"] },
      AND: [visibleWhere, excludeSelfDelegatedFromResponsible],
    },
    select: {
      id: true,
      title: true,
      description: true,
      delegation: true,
      responsible: true,
      term: true,
      urgency: true,
      recurrence: true,
      status: true,
      createdAt: true,
      carbonCopies: {
        select: {
          slackUserId: true,
        },
      },
    },
  })) as unknown as RawTask[];

  const myTasksUnfiltered = sortTasks(myTasksRaw);

  const myTasks = myTasksUnfiltered.filter((t) => {
    if (
      state.myDelegatorFilter &&
      t.delegation !== state.myDelegatorFilter
    ) {
      return false;
    }

    if (
      state.myCcFilter &&
      !t.carbonCopies?.some(
        (c) => c.slackUserId === state.myCcFilter
      )
    ) {
      return false;
    }

    return true;
  });

  const myDelegationNameMap = await resolveSlackNames(
    slack,
    myTasks.map((t) => t.delegation)
  );

  const myDelegatorOptions = Array.from(
    new Set(myTasksUnfiltered.map((t) => t.delegation))
  )
    .filter(Boolean)
    .map((slackId) => ({
      slackId,
      name: myDelegationNameMap.get(slackId) ?? slackId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const myCcNameMap = await resolveSlackNames(
    slack,
    Array.from(
      new Set(
        myTasksUnfiltered.flatMap(
          (t) => t.carbonCopies?.map((c) => c.slackUserId) ?? []
        )
      )
    )
  );

  const myCcOptions = Array.from(
    new Set(
      myTasksUnfiltered.flatMap(
        (t) => t.carbonCopies?.map((c) => c.slackUserId) ?? []
      )
    )
  )
    .filter(Boolean)
    .map((slackId) => ({
      slackId,
      name: myCcNameMap.get(slackId) ?? slackId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const myTodayAll = myTasks.filter((t) => bucketByIso(t.term, todayIso) === "today");
  const myTomorrowAll = myTasks.filter((t) => bucketByIso(t.term, todayIso) === "tomorrow");
  const myFutureAll = myTasks.filter((t) => bucketByIso(t.term, todayIso) === "future");

  const myTodayPag = paginate(
    myTodayAll,
    state.myTodayPage,
    TODAY_MAX
  );

  const myTomorrowPag = paginate(
    myTomorrowAll,
    state.myTomorrowPage,
    TOMORROW_MAX
  );
  const tasksToday = myTodayPag.items.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    delegation: t.delegation,
    delegationName: myDelegationNameMap.get(t.delegation) ?? null,
    term: t.term,
    urgency: t.urgency,
  }));

  const tasksTomorrow = myTomorrowPag.items.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    delegation: t.delegation,
    delegationName: myDelegationNameMap.get(t.delegation) ?? null,
    term: t.term,
    urgency: t.urgency,
  }));

  const myFuturePag = paginate(myFutureAll, state.myFuturePage, FUTURE_PAGE_SIZE);

  const tasksFuture = myFuturePag.items.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    delegation: t.delegation,
    delegationName: myDelegationNameMap.get(t.delegation) ?? null,
    term: t.term,
    urgency: t.urgency,
  }));

  // (mantido por compatibilidade)
  const tasksOverdue: any[] = [];

  // =========================================================
  // 3) Delegadas por mim (delegation)
  // =========================================================
  const delegatedRaw = (await prisma.task.findMany({
    where: {
      delegation: userSlackId,
      status: { notIn: ["done", "cancelled"] },
      AND: [visibleWhere],
    },
    select: {
      id: true,
      title: true,
      description: true,
      term: true,
      urgency: true,
      responsible: true,
      createdAt: true,

      carbonCopies: {
        select: {
          slackUserId: true,
        },
      },
    },
    take: 200,
  })) as unknown as Array<{
    id: string;
    title: string;
    description: string | null;
    term: Date | null;
    urgency: "light" | "asap" | "turbo";
    responsible: string;
    createdAt: Date;
    carbonCopies?: Array<{
      slackUserId: string;
    }>;
  }>;

  const delegatedUnfiltered = sortTasks(delegatedRaw);

  const delegated = delegatedUnfiltered.filter((t) => {
    if (
      state.delegatedResponsibleFilter &&
      t.responsible !== state.delegatedResponsibleFilter
    ) {
      return false;
    }

    if (
      state.delegatedCcFilter &&
      !t.carbonCopies?.some(
        (c) => c.slackUserId === state.delegatedCcFilter
      )
    ) {
      return false;
    }

    return true;
  });

  const delegatedResponsibleNameMap = await resolveSlackNames(
    slack,
    delegated.map((t) => t.responsible)
  );

  const delegatedResponsibleOptions = Array.from(
    new Set(delegatedUnfiltered.map((t) => t.responsible))
  )
    .filter(Boolean)
    .map((slackId) => ({
      slackId,
      name: delegatedResponsibleNameMap.get(slackId) ?? slackId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const delegatedCcNameMap = await resolveSlackNames(
    slack,
    Array.from(
      new Set(
        delegatedUnfiltered.flatMap(
          (t) => t.carbonCopies?.map((c) => c.slackUserId) ?? []
        )
      )
    )
  );

  const delegatedCcOptions = Array.from(
    new Set(
      delegatedUnfiltered.flatMap(
        (t) => t.carbonCopies?.map((c) => c.slackUserId) ?? []
      )
    )
  )
    .filter(Boolean)
    .map((slackId) => ({
      slackId,
      name: delegatedCcNameMap.get(slackId) ?? slackId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const delegatedTodayAll = delegated.filter((t) => bucketByIso(t.term, todayIso) === "today");
  const delegatedTomorrowAll = delegated.filter((t) => bucketByIso(t.term, todayIso) === "tomorrow");
  const delegatedFutureAll = delegated.filter(
    (t) => bucketByIso(t.term, todayIso) === "future" || bucketByIso(t.term, todayIso) === "overdue"
  );

  const delegatedTodayPag = paginate(
    delegatedTodayAll,
    state.delegatedTodayPage,
    TODAY_MAX
  );

  const delegatedTomorrowPag = paginate(
    delegatedTomorrowAll,
    state.delegatedTomorrowPage,
    TOMORROW_MAX
  );

  const delegatedFuturePag = paginate(
    delegatedFutureAll,
    state.delegatedFuturePage,
    FUTURE_PAGE_SIZE
  );

  const delegatedToday = delegatedTodayPag.items;
  const delegatedTomorrow = delegatedTomorrowPag.items;
  const delegatedFuture = delegatedFuturePag.items;

  // =========================================================
  // 4) Em cópia (carbonCopies)
  // =========================================================
  const ccRaw = (await prisma.task.findMany({
    where: {
      status: { notIn: ["done", "cancelled"] },
      carbonCopies: { some: { slackUserId: userSlackId } },

      ...(state.ccResponsibleFilter
        ? { responsible: state.ccResponsibleFilter }
        : {}),

      AND: [visibleWhere],
    },
    select: {
      id: true,
      title: true,
      description: true,
      term: true,
      urgency: true,
      responsible: true,
      delegation: true,
      createdAt: true,
    },
    take: 200,
  })) as unknown as Array<{
    id: string;
    title: string;
    description: string | null;
    term: Date | null;
    urgency: "light" | "asap" | "turbo";
    responsible: string;
    delegation: string;
    createdAt: Date;
  }>;

  const ccTasks = sortTasks(ccRaw);

  const ccNameMap = await resolveSlackNames(
    slack,
    ccTasks.flatMap((t) => [t.responsible, t.delegation])
  );

  const ccResponsibleOptions = Array.from(
    new Set(ccTasks.map((t) => t.responsible))
  )
    .filter(Boolean)
    .map((slackId) => ({
      slackId,
      name: ccNameMap.get(slackId) ?? slackId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const ccTodayAll = ccTasks.filter((t) => bucketByIso(t.term, todayIso) === "today");
  const ccTomorrowAll = ccTasks.filter((t) => bucketByIso(t.term, todayIso) === "tomorrow");
  const ccFutureAll = ccTasks.filter(
    (t) => bucketByIso(t.term, todayIso) === "future" || bucketByIso(t.term, todayIso) === "overdue"
  );

  const ccTodayPag = paginate(
    ccTodayAll,
    state.ccTodayPage,
    TODAY_MAX
  );

  const ccTomorrowPag = paginate(
    ccTomorrowAll,
    state.ccTomorrowPage,
    TOMORROW_MAX
  );

  const ccFuturePag = paginate(
    ccFutureAll,
    state.ccFuturePage,
    FUTURE_PAGE_SIZE
  );

  const ccToday = ccTodayPag.items;
  const ccTomorrow = ccTomorrowPag.items;
  const ccFuture = ccFuturePag.items;

  // =========================================================
  // 5) Recorrências
  // =========================================================
  const recurrenceTasks = (await prisma.task.findMany({
    where: {
      responsible: userSlackId,
      status: { notIn: ["done", "cancelled"] },
      recurrence: { not: null },
      AND: [visibleWhere, excludeSelfDelegatedFromResponsible],
    },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, title: true, recurrence: true },
    take: 15,
  })) as unknown as Array<{ id: string; title: string; recurrence: string }>;

  // =========================================================
  // 6) Projetos
  // =========================================================
  const projects = await prisma.project.findMany({
    where: {
      status: "active",
      OR: [
        { createdBySlackId: userSlackId },
        { members: { some: { slackUserId: userSlackId } } },
        {
          tasks: {
            some: {
              OR: [
                { delegation: userSlackId },
                { responsible: userSlackId },
                { carbonCopies: { some: { slackUserId: userSlackId } } },
              ],
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const projectsWithCounts = await Promise.all(
    projects.map(async (p) => {
      const [openCount, doneCount, overdueCount] = await Promise.all([
        prisma.task.count({ where: { projectId: p.id, status: { notIn: ["done", "cancelled"] }, AND: [visibleWhere] } }),
        prisma.task.count({ where: { projectId: p.id, status: "done" } }),
        prisma.task.count({
          where: { projectId: p.id, status: { notIn: ["done", "cancelled"] }, term: { lt: todayUtc }, AND: [visibleWhere] },
        }),
      ]);
      return { id: p.id, name: p.name, openCount, doneCount, overdueCount };
    })
  );

  // =========================================================
  // 6.5) Feedback
  // =========================================================
  const myOpenFeedback = await prisma.feedback.findMany({
    where: { createdBySlackId: userSlackId, status: { in: ["pending", "wip"] as any } },
    orderBy: [{ updatedAt: "desc" }],
    take: 8,
    select: { id: true, type: true, title: true, status: true, updatedAt: true },
  });

  // =========================================================
  // 7) Render Home
  // =========================================================
  let blocks = homeHeaderActionsBlocks().concat(
    homeTasksBlocks({
      tasksOverdue,
      tasksToday,
      tasksTomorrow,
      tasksFuture,

      myDelegatorFilter: state.myDelegatorFilter,
      myDelegatorOptions,

      myCcFilter: state.myCcFilter,
      myCcOptions,

      delegatedToday: delegatedToday.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        term: t.term,
        urgency: t.urgency,
        responsible: t.responsible,
        responsibleName: delegatedResponsibleNameMap.get(t.responsible) ?? null,
      })),
      delegatedTomorrow: delegatedTomorrow.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        term: t.term,
        urgency: t.urgency,
        responsible: t.responsible,
        responsibleName: delegatedResponsibleNameMap.get(t.responsible) ?? null,
      })),
      delegatedFuture: delegatedFuture.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        term: t.term,
        urgency: t.urgency,
        responsible: t.responsible,
        responsibleName: delegatedResponsibleNameMap.get(t.responsible) ?? null,
      })),
      delegatedResponsibleFilter: state.delegatedResponsibleFilter,
      delegatedResponsibleOptions,
      ccResponsibleFilter: state.ccResponsibleFilter,
      ccResponsibleOptions,
      delegatedCcFilter: state.delegatedCcFilter,
      delegatedCcOptions,

      ccToday: ccToday.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        term: t.term,
        urgency: t.urgency,
        responsible: t.responsible,
        responsibleName: ccNameMap.get(t.responsible) ?? null,
        delegation: t.delegation,
        delegationName: ccNameMap.get(t.delegation) ?? null,
      })),
      ccTomorrow: ccTomorrow.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        term: t.term,
        urgency: t.urgency,
        responsible: t.responsible,
        responsibleName: ccNameMap.get(t.responsible) ?? null,
        delegation: t.delegation,
        delegationName: ccNameMap.get(t.delegation) ?? null,
      })),
      ccFuture: ccFuture.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        term: t.term,
        urgency: t.urgency,
        responsible: t.responsible,
        responsibleName: ccNameMap.get(t.responsible) ?? null,
        delegation: t.delegation,
        delegationName: ccNameMap.get(t.delegation) ?? null,
      })),

      recurrences: recurrenceTasks.map((r) => ({ id: r.id, title: r.title, recurrence: r.recurrence })),
      projects: projectsWithCounts,

      myOpenFeedback: myOpenFeedback.map((f) => ({
        id: f.id,
        type: f.type as any,
        title: f.title,
        status: f.status as any,
        updatedAt: f.updatedAt,
      })),

      myTodayPager: {
        scope: "my_today",
        page: myTodayPag.page,
        pageSize: myTodayPag.pageSize,
        total: myTodayPag.total,
      },

      myTomorrowPager: {
        scope: "my_tomorrow",
        page: myTomorrowPag.page,
        pageSize: myTomorrowPag.pageSize,
        total: myTomorrowPag.total,
      },

      delegatedTodayPager: {
        scope: "delegated_today",
        page: delegatedTodayPag.page,
        pageSize: delegatedTodayPag.pageSize,
        total: delegatedTodayPag.total,
      },

      delegatedTomorrowPager: {
        scope: "delegated_tomorrow",
        page: delegatedTomorrowPag.page,
        pageSize: delegatedTomorrowPag.pageSize,
        total: delegatedTomorrowPag.total,
      },

      ccTodayPager: {
        scope: "cc_today",
        page: ccTodayPag.page,
        pageSize: ccTodayPag.pageSize,
        total: ccTodayPag.total,
      },

      ccTomorrowPager: {
        scope: "cc_tomorrow",
        page: ccTomorrowPag.page,
        pageSize: ccTomorrowPag.pageSize,
        total: ccTomorrowPag.total,
      },


      // ✅ pager infos
      myFuturePager: { scope: "my_future", page: myFuturePag.page, pageSize: myFuturePag.pageSize, total: myFuturePag.total },
      delegatedFuturePager: {
        scope: "delegated_future",
        page: delegatedFuturePag.page,
        pageSize: delegatedFuturePag.pageSize,
        total: delegatedFuturePag.total,
      },
      ccFuturePager: { scope: "cc_future", page: ccFuturePag.page, pageSize: ccFuturePag.pageSize, total: ccFuturePag.total },
    } as any)
  );

  // ✅ guarda de segurança (se ainda assim estourar por algum motivo)
  if (blocks.length > MAX_BLOCKS) {
    console.warn(`[HOME] too many blocks: ${blocks.length}. trimming to ${MAX_BLOCKS}`);
    blocks = blocks.slice(0, MAX_BLOCKS);
  }

  await slack.views.publish({
    user_id: userSlackId,
    view: {
      type: "home",
      private_metadata: JSON.stringify({
        myTodayPage: myTodayPag.page,
        myTomorrowPage: myTomorrowPag.page,
        myFuturePage: myFuturePag.page,

        delegatedTodayPage: delegatedTodayPag.page,
        delegatedTomorrowPage: delegatedTomorrowPag.page,
        delegatedFuturePage: delegatedFuturePag.page,

        ccTodayPage: ccTodayPag.page,
        ccTomorrowPage: ccTomorrowPag.page,
        ccFuturePage: ccFuturePag.page,

        myDelegatorFilter: state.myDelegatorFilter,
        myCcFilter: state.myCcFilter,

        delegatedResponsibleFilter: state.delegatedResponsibleFilter,
        ccResponsibleFilter: state.ccResponsibleFilter,
        delegatedCcFilter: state.delegatedCcFilter,
      }),
      blocks,
    },
  });
}