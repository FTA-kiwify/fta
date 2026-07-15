import { prisma } from "../lib/prisma";
import { teams } from "../constants/teams";

async function syncTeams() {
  console.log("Iniciando sincronização dos times...");

  for (const teamConfig of teams) {
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: teamConfig.name,
        group: teamConfig.parentName ?? null,
      },
    });

    const team = existingTeam
      ? await prisma.team.update({
        where: {
          id: existingTeam.id,
        },
        data: {
          name: teamConfig.name,
          group: teamConfig.parentName ?? null,
        },
      })
      : await prisma.team.create({
        data: {
          name: teamConfig.name,
          group: teamConfig.parentName ?? null,
        },
      });

    await prisma.teamMember.deleteMany({
      where: {
        teamId: team.id,
        slackUserId: {
          notIn: teamConfig.members,
        },
      },
    });

    for (const slackUserId of teamConfig.members) {
      await prisma.teamMember.upsert({
        where: {
          teamId_slackUserId: {
            teamId: team.id,
            slackUserId,
          },
        },
        update: {},
        create: {
          teamId: team.id,
          slackUserId,
        },
      });
    }

    console.log(
      `Time "${teamConfig.name}" sincronizado com ${teamConfig.members.length} membro(s).`
    );
  }

  console.log("Sincronização concluída.");
}

syncTeams()
  .catch((error) => {
    console.error("Erro ao sincronizar os times:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });